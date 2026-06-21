"use client"

import { Radio } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shell/theme-toggle"
import { usePublisher } from "@/store/publisher-store"

export function AppTopbar() {
  const { simulateReceive } = usePublisher()

  function handleReceive() {
    simulateReceive()
  }

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-6 backdrop-blur-md">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <span className="bg-status-published-foreground/70 inline-flex size-2 rounded-full" />
        Ambiente de demonstração · dados falsos
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleReceive} size="sm" variant="outline">
          <Radio />
          Simular recebimento do MC
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}

/** Toasts de feedback do receptor/publicador — ligados ao provider via `notify`. */
export function useStoreNotifications() {
  return {
    received: () => {
      toast.success("Novo post recebido do MC", {
        description: "Entrou na inbox para revisão.",
      })
    },
    invalid: (error: string) => {
      toast.error("Push do MC inválido", { description: error })
    },
    published: (
      _post: unknown,
      state: "aRevisar" | "agendado" | "publicado" | "falhou"
    ) => {
      if (state === "publicado") {
        toast.success("Post publicado em todos os canais")
      } else if (state === "falhou") {
        toast.error("Falha ao publicar", {
          description: "Um ou mais canais falharam. Veja o detalhe no post.",
        })
      }
    },
  }
}
