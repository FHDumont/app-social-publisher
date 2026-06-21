import type { MediaKind, PostBody } from "@/domain/content"

/**
 * Registro de redes (network registry).
 *
 * Cada rede tem um descritor de capacidade — limites e formatos que alimentam o
 * preview e a validação por-rede. É o conhecimento "o que cada rede aceita",
 * separado de qualquer conta conectada (isso é `channel`).
 *
 * `iconKey` e `brand` são consumidos pela UI; o domínio em si não importa React.
 */

export const NETWORK_IDS = [
  "linkedin",
  "x",
  "instagram",
  "youtube",
  "wordpress",
] as const
export type NetworkId = (typeof NETWORK_IDS)[number]

export interface NetworkCapability {
  /** Limite de caracteres do texto; `null` = sem limite. */
  maxChars: number | null
  /** Nº máximo de mídias por post; `null` = sem limite. */
  maxMedia: number
  /** Tipos de mídia aceitos. */
  allowedKinds: MediaKind[]
  /** Aspect ratios recomendados (rótulo legível). */
  aspectRatios: string[]
}

export interface Network {
  id: NetworkId
  name: string
  /** Cor de marca (hex) usada em chips/realces na UI. */
  brand: string
  /** Chave do ícone lucide, resolvida na UI. */
  iconKey: string
  /** Frase curta do que a rede representa. */
  blurb: string
  capability: NetworkCapability
}

export const NETWORKS: Record<NetworkId, Network> = {
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    brand: "#0A66C2",
    iconKey: "linkedin",
    blurb: "Rede profissional — textos longos e documentos.",
    capability: {
      maxChars: 3000,
      maxMedia: 9,
      allowedKinds: ["image", "video", "document"],
      aspectRatios: ["1:1", "1.91:1", "4:5"],
    },
  },
  x: {
    id: "x",
    name: "X",
    brand: "#111111",
    iconKey: "x",
    blurb: "Texto curto, ritmo rápido.",
    capability: {
      maxChars: 280,
      maxMedia: 4,
      allowedKinds: ["image", "video"],
      aspectRatios: ["16:9", "1:1"],
    },
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    brand: "#E1306C",
    iconKey: "instagram",
    blurb: "Visual primeiro — carrossel e vídeo.",
    capability: {
      maxChars: 2200,
      maxMedia: 10,
      allowedKinds: ["image", "video"],
      aspectRatios: ["1:1", "4:5", "1.91:1"],
    },
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    brand: "#FF0000",
    iconKey: "youtube",
    blurb: "Vídeo único + descrição.",
    capability: {
      maxChars: 5000,
      maxMedia: 1,
      allowedKinds: ["video"],
      aspectRatios: ["16:9"],
    },
  },
  wordpress: {
    id: "wordpress",
    name: "WordPress / Newsletter",
    brand: "#21759B",
    iconKey: "wordpress",
    blurb: "Conteúdo longo — sem limite rígido de tamanho.",
    capability: {
      maxChars: null,
      maxMedia: 20,
      allowedKinds: ["image", "video", "document"],
      aspectRatios: ["livre"],
    },
  },
}

export const NETWORK_LIST: Network[] = NETWORK_IDS.map((id) => NETWORKS[id])

/** Nível de uma questão de validação por-rede. */
export type ValidationLevel = "error" | "warning"

export interface ValidationIssue {
  level: ValidationLevel
  message: string
}

/**
 * Valida o corpo efetivo de um canal contra o descritor da sua rede.
 * `error` = a rede recusaria; `warning` = passa, mas vale revisar.
 */
export function validateBodyForNetwork(
  body: PostBody,
  network: Network,
  media: { kind: MediaKind }[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const cap = network.capability

  const chars = body.text.length
  if (cap.maxChars !== null && chars > cap.maxChars) {
    issues.push({
      level: "error",
      message: `Texto com ${chars} caracteres excede o limite de ${cap.maxChars} do ${network.name}.`,
    })
  } else if (cap.maxChars !== null && chars > cap.maxChars * 0.9) {
    issues.push({
      level: "warning",
      message: `Texto perto do limite (${chars}/${cap.maxChars}).`,
    })
  }

  if (media.length > cap.maxMedia) {
    issues.push({
      level: "error",
      message: `${media.length} mídias excedem o máximo de ${cap.maxMedia} do ${network.name}.`,
    })
  }

  const invalidKinds = media
    .map((m) => m.kind)
    .filter((k) => !cap.allowedKinds.includes(k))
  if (invalidKinds.length > 0) {
    const unique = [...new Set(invalidKinds)]
    issues.push({
      level: "error",
      message: `${network.name} não aceita: ${unique.join(", ")}.`,
    })
  }

  if (network.id === "youtube" && media.length === 0) {
    issues.push({
      level: "error",
      message: "YouTube exige um vídeo.",
    })
  }

  return issues
}
