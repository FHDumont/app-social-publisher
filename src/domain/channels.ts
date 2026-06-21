import type { NetworkId } from "@/domain/networks"

/**
 * Canal = uma conta conectada de uma rede (ex.: a página da empresa no LinkedIn).
 * O `slug` é o identificador usado em `content.channels` e nas chaves de
 * `content.perChannel`. Várias contas podem existir na mesma rede.
 *
 * Nesta fase as contas são falsas (sem OAuth); `connected` modela o estado que a
 * tela Channels exibe.
 */
export interface Channel {
  slug: string
  networkId: NetworkId
  /** Nome de exibição da conta. */
  accountName: string
  /** Handle/URL legível (@perfil, /pagina, etc.). */
  handle: string
  connected: boolean
}
