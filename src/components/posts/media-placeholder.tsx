import { FileText, ImageIcon, Play } from "lucide-react"

import type { MediaDescriptor } from "@/domain/content"
import { cn } from "@/lib/utils"

/**
 * Placeholder de mídia — nesta fase os bytes não existem (chegam pelo invólucro do
 * MC na integração real). Renderiza um tile estilizado por tipo, com o nome e o
 * alt do descritor, para o preview ficar fiel sem precisar de arquivo real.
 */
export function MediaPlaceholder({
  media,
  className,
  aspect = "video",
}: {
  media: MediaDescriptor
  className?: string
  aspect?: "video" | "square" | "auto"
}) {
  const Icon =
    media.kind === "video"
      ? Play
      : media.kind === "document"
        ? FileText
        : ImageIcon
  const aspectClass =
    aspect === "square"
      ? "aspect-square"
      : aspect === "video"
        ? "aspect-video"
        : ""

  return (
    <div
      className={cn(
        "from-muted to-accent/40 text-muted-foreground relative flex flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg border bg-gradient-to-br",
        aspectClass,
        className
      )}
      title={media.alt || media.name}
    >
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 11px)",
        }}
      />
      <Icon className="size-6 opacity-70" />
      <span className="z-10 max-w-[85%] truncate px-2 text-[11px] font-medium">
        {media.name}
      </span>
      {media.kind === "video" && (
        <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          vídeo
        </span>
      )}
      {media.kind === "document" && (
        <span className="absolute top-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          doc
        </span>
      )}
    </div>
  )
}
