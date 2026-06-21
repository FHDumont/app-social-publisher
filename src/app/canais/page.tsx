"use client"

import { Check, X } from "lucide-react"

import { NETWORK_LIST } from "@/domain/networks"
import { usePublisher } from "@/store/publisher-store"
import { PageHeader } from "@/components/shell/page-header"
import { NetworkMark } from "@/components/networks/network-mark"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export default function ChannelsPage() {
  const { channels, setChannelConnected } = usePublisher()

  return (
    <>
      <PageHeader
        title="Canais"
        description="Contas conectadas por rede. Cada rede tem seu descritor de capacidade, que alimenta o preview e a validação."
      />

      <div className="flex flex-col gap-4">
        {NETWORK_LIST.map((net) => {
          const accounts = channels.filter((c) => c.networkId === net.id)
          const cap = net.capability
          return (
            <section
              key={net.id}
              className="bg-card ring-foreground/5 overflow-hidden rounded-2xl border shadow-sm ring-1"
            >
              <div className="bg-muted/30 flex flex-wrap items-center gap-3 border-b px-4 py-3">
                <NetworkMark network={net.id} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-base font-semibold">
                    {net.name}
                  </h2>
                  <p className="text-muted-foreground text-xs">{net.blurb}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-b px-4 py-3 text-xs">
                <Capability label="Texto">
                  {cap.maxChars === null
                    ? "sem limite"
                    : `${cap.maxChars.toLocaleString("pt-BR")} caracteres`}
                </Capability>
                <Capability label="Mídias">até {cap.maxMedia}</Capability>
                <Capability label="Tipos">
                  {cap.allowedKinds.join(", ")}
                </Capability>
                <Capability label="Proporções">
                  {cap.aspectRatios.join(" · ")}
                </Capability>
              </div>

              <ul className="divide-y">
                {accounts.map((account) => (
                  <li
                    key={account.slug}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {account.accountName}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {account.handle}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        account.connected
                          ? "bg-status-published text-status-published-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {account.connected ? (
                        <>
                          <Check className="size-3" />
                          Conectada
                        </>
                      ) : (
                        <>
                          <X className="size-3" />
                          Desconectada
                        </>
                      )}
                    </span>
                    <Switch
                      checked={account.connected}
                      onCheckedChange={(checked) =>
                        setChannelConnected(account.slug, checked)
                      }
                      aria-label={`Alternar conexão de ${account.accountName}`}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}

function Capability({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{children}</span>
    </span>
  )
}
