"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react"

import type { Channel } from "@/domain/channels"
import type { PostContent } from "@/domain/content"
import {
  isPublishing,
  type ChannelResult,
  type Post,
  type PostState,
} from "@/domain/post"
import {
  decideOnApprove,
  decideOnReceive,
  settleState,
} from "@/domain/state-machine"
import {
  APP_NOW_ISO,
  CHANNELS,
  FAIL_CHANNELS,
  MC_PUSH_POOL,
  SEED_POSTS,
} from "@/data/fixtures"
import { MockPublisher } from "@/io/publisher"
import { MockReceiver } from "@/io/receiver"

/* ------------------------------------------------------------------ */
/* Estado + reducer                                                     */
/* ------------------------------------------------------------------ */

interface State {
  posts: Post[]
  channels: Channel[]
}

type Action =
  | { type: "ADD_POST"; post: Post }
  | { type: "SET_STATE"; id: string; state: PostState }
  | { type: "SET_RESULTS"; id: string; results: ChannelResult[] }
  | { type: "PATCH_RESULT"; id: string; result: ChannelResult }
  | { type: "SET_REJECTED"; id: string; rejected: boolean }
  | { type: "UPDATE_CONTENT"; id: string; content: PostContent }
  | { type: "SET_CHANNEL_CONNECTED"; slug: string; connected: boolean }

function mapPost(posts: Post[], id: string, fn: (post: Post) => Post): Post[] {
  return posts.map((p) => (p.content.deliveryId === id ? fn(p) : p))
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_POST":
      return { ...state, posts: [action.post, ...state.posts] }

    case "SET_STATE":
      return {
        ...state,
        posts: mapPost(state.posts, action.id, (p) => ({
          ...p,
          state: action.state,
        })),
      }

    case "SET_RESULTS":
      return {
        ...state,
        posts: mapPost(state.posts, action.id, (p) => ({
          ...p,
          channelResults: action.results,
        })),
      }

    case "PATCH_RESULT":
      return {
        ...state,
        posts: mapPost(state.posts, action.id, (p) => ({
          ...p,
          channelResults: p.channelResults.some(
            (r) => r.channel === action.result.channel
          )
            ? p.channelResults.map((r) =>
                r.channel === action.result.channel ? action.result : r
              )
            : [...p.channelResults, action.result],
        })),
      }

    case "SET_REJECTED":
      return {
        ...state,
        posts: mapPost(state.posts, action.id, (p) => ({
          ...p,
          rejected: action.rejected,
        })),
      }

    case "UPDATE_CONTENT":
      return {
        ...state,
        posts: mapPost(state.posts, action.id, (p) => ({
          ...p,
          content: action.content,
        })),
      }

    case "SET_CHANNEL_CONNECTED":
      return {
        ...state,
        channels: state.channels.map((c) =>
          c.slug === action.slug ? { ...c, connected: action.connected } : c
        ),
      }

    default:
      return state
  }
}

/* ------------------------------------------------------------------ */
/* Contexto                                                             */
/* ------------------------------------------------------------------ */

export interface PublisherStore {
  posts: Post[]
  channels: Channel[]
  /** Relógio do app (fixo) — usado pelo calendário e pelas decisões da máquina. */
  nowISO: string
  /** Simula a chegada de um push do MC (injeta um post `origin:"mc"`). */
  simulateReceive: () => void
  /** Aprova um post em revisão → agenda ou publica conforme o schedule. */
  approve: (id: string) => void
  /** Recusa um post (some da fila ativa, fica no filtro Recusados). */
  reject: (id: string) => void
  /** Restaura um post recusado de volta à revisão. */
  restore: (id: string) => void
  /** Republica os canais que falharam de um post em `falhou`. */
  retry: (id: string) => void
  /** Antecipa um post `agendado` (publica agora, como se o horário tivesse chegado). */
  publishScheduledNow: (id: string) => void
  /** Cria um post manual (composer manual) e o injeta na inbox. */
  createManual: (content: PostContent) => void
  /** Atualiza o `content` de um post (edição no composer). */
  updateContent: (id: string, content: PostContent) => void
  /** Conecta/desconecta uma conta (tela Channels). */
  setChannelConnected: (slug: string, connected: boolean) => void
}

const StoreContext = createContext<PublisherStore | null>(null)

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

export interface PublisherProviderProps {
  children: ReactNode
  /** Callbacks de feedback de UI (toasts). Injetados pela camada de UI. */
  notify?: {
    received?: (content: PostContent) => void
    invalid?: (error: string) => void
    published?: (post: Post, state: PostState) => void
  }
}

export function PublisherProvider({
  children,
  notify,
}: PublisherProviderProps) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    posts: SEED_POSTS,
    channels: CHANNELS,
  }))

  // Ref sempre com o estado mais recente, para os thunks assíncronos (publicação).
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const notifyRef = useRef(notify)
  useEffect(() => {
    notifyRef.current = notify
  }, [notify])

  // Fronteiras de I/O (mock) — estáveis durante o ciclo de vida do provider.
  const publisher = useMemo(
    () => new MockPublisher({ failChannels: FAIL_CHANNELS }),
    []
  )
  const receiver = useMemo(
    () => new MockReceiver(MC_PUSH_POOL, () => APP_NOW_ISO),
    []
  )

  const getPost = useCallback(
    (id: string) =>
      stateRef.current.posts.find((p) => p.content.deliveryId === id) ?? null,
    []
  )

  /** Orquestra a publicação (mock) de um conjunto de canais de um post. */
  const runPublish = useCallback(
    async (id: string, channels: string[]) => {
      const post = getPost(id)
      if (!post) return

      channels.forEach((channel) =>
        dispatch({
          type: "PATCH_RESULT",
          id,
          result: { channel, status: "publicando" },
        })
      )

      const results = await Promise.all(
        channels.map((channel) => publisher.publish(channel, post.content))
      )

      results.forEach((result) =>
        dispatch({ type: "PATCH_RESULT", id, result })
      )

      // Estado terminal considera todos os canais do post (não só os republicados).
      const merged = mergeResults(getPost(id)?.channelResults ?? [], results)
      const next = settleState(merged)
      dispatch({ type: "SET_STATE", id, state: next })
      notifyRef.current?.published?.(post, next)
    },
    [getPost, publisher]
  )

  const addContentAsPost = useCallback(
    (content: PostContent) => {
      const decision = decideOnReceive(content, APP_NOW_ISO)
      const post: Post = {
        content,
        state: decision.state,
        channelResults: content.channels.map((channel) => ({
          channel,
          status: "pendente",
        })),
        receivedAt: APP_NOW_ISO,
        rejected: false,
      }
      dispatch({ type: "ADD_POST", post })
      if (decision.publishNow) {
        void runPublish(content.deliveryId, content.channels)
      }
    },
    [runPublish]
  )

  // Liga o receptor: cada push válido vira um post; inválido é reportado.
  useEffect(() => {
    receiver.start({
      onContent: (content) => {
        addContentAsPost(content)
        notifyRef.current?.received?.(content)
      },
      onInvalid: (_raw, error) => notifyRef.current?.invalid?.(error),
    })
    return () => receiver.stop()
  }, [receiver, addContentAsPost])

  const simulateReceive = useCallback(() => {
    receiver.simulate()
  }, [receiver])

  const approve = useCallback(
    (id: string) => {
      const post = getPost(id)
      if (!post) return
      const decision = decideOnApprove(post.content, APP_NOW_ISO)
      dispatch({ type: "SET_STATE", id, state: decision.state })
      if (decision.publishNow) {
        void runPublish(id, post.content.channels)
      }
    },
    [getPost, runPublish]
  )

  const reject = useCallback(
    (id: string) => dispatch({ type: "SET_REJECTED", id, rejected: true }),
    []
  )
  const restore = useCallback(
    (id: string) => dispatch({ type: "SET_REJECTED", id, rejected: false }),
    []
  )

  const retry = useCallback(
    (id: string) => {
      const post = getPost(id)
      if (!post) return
      const failed = post.channelResults
        .filter((r) => r.status === "falhou")
        .map((r) => r.channel)
      const targets = failed.length > 0 ? failed : post.content.channels
      void runPublish(id, targets)
    },
    [getPost, runPublish]
  )

  const publishScheduledNow = useCallback(
    (id: string) => {
      const post = getPost(id)
      if (!post) return
      void runPublish(id, post.content.channels)
    },
    [getPost, runPublish]
  )

  const createManual = useCallback(
    (content: PostContent) => addContentAsPost(content),
    [addContentAsPost]
  )

  const updateContent = useCallback(
    (id: string, content: PostContent) =>
      dispatch({ type: "UPDATE_CONTENT", id, content }),
    []
  )

  const setChannelConnected = useCallback(
    (slug: string, connected: boolean) =>
      dispatch({ type: "SET_CHANNEL_CONNECTED", slug, connected }),
    []
  )

  const value = useMemo<PublisherStore>(
    () => ({
      posts: state.posts,
      channels: state.channels,
      nowISO: APP_NOW_ISO,
      simulateReceive,
      approve,
      reject,
      restore,
      retry,
      publishScheduledNow,
      createManual,
      updateContent,
      setChannelConnected,
    }),
    [
      state.posts,
      state.channels,
      simulateReceive,
      approve,
      reject,
      restore,
      retry,
      publishScheduledNow,
      createManual,
      updateContent,
      setChannelConnected,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

/** Mescla resultados novos sobre os existentes, por canal. */
function mergeResults(
  existing: ChannelResult[],
  fresh: ChannelResult[]
): ChannelResult[] {
  const byChannel = new Map(existing.map((r) => [r.channel, r]))
  fresh.forEach((r) => byChannel.set(r.channel, r))
  return [...byChannel.values()]
}

/* ------------------------------------------------------------------ */
/* Hook                                                                 */
/* ------------------------------------------------------------------ */

export function usePublisher(): PublisherStore {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error("usePublisher precisa estar dentro de <PublisherProvider>.")
  }
  return ctx
}

/** Re-export utilitário para a UI sinalizar publicação em voo. */
export { isPublishing }
