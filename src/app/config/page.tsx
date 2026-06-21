"use client"

import {
  AppWindow,
  Bell,
  Copy,
  Info,
  KeyRound,
  PlugZap,
  SlidersHorizontal,
  TriangleAlert,
  Users,
  Webhook,
} from "lucide-react"
import { toast } from "sonner"

import { NETWORK_LIST } from "@/domain/networks"
import { PageHeader } from "@/components/shell/page-header"
import { NetworkMark } from "@/components/networks/network-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

/**
 * Área de Configurações — PLACEHOLDER VISUAL (F-001).
 *
 * Os contratos reais não são fixados aqui: a recepção do MC (token, callback,
 * invólucro) depende dos 3 pontos abertos da §6.B e será definida na fase
 * F-int-mc; o OAuth das redes, na F-oauth-redes. Esta tela só mostra COMO a área
 * vai parecer — campos são exemplos, sem coletar segredos reais.
 */

const CALLBACK_EXEMPLO = "https://publisher.exemplo.local/api/mc/push"

export default function ConfigPage() {
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Integração com o Mission Control e conexões das redes."
      />

      <MockBanner />

      <div className="mt-6 flex flex-col gap-5">
        <GeralSection />
        <McSection />
        <OAuthSection />
        <PoliticaSection />
        <NotificacoesSection />
        <AcessoSection />
      </div>
    </>
  )
}

function MockBanner() {
  return (
    <div className="border-status-review-foreground/30 bg-status-review/40 text-status-review-foreground flex items-start gap-3 rounded-xl border p-4 text-sm">
      <Info className="mt-0.5 size-5 shrink-0" />
      <p className="leading-relaxed">
        <strong className="font-semibold">Placeholder visual.</strong> Os campos
        abaixo são exemplos para aprovar o layout. Os contratos reais (token e
        callback do MC, OAuth das redes) serão definidos nas fases{" "}
        <code className="rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-white/10">
          F-int-mc
        </code>{" "}
        e{" "}
        <code className="rounded bg-black/10 px-1 py-0.5 text-xs dark:bg-white/10">
          F-oauth-redes
        </code>
        . Não cole segredos reais aqui.
      </p>
    </div>
  )
}

function Section({
  icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-card ring-foreground/5 overflow-hidden rounded-2xl border shadow-sm ring-1">
      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
        {badge && (
          <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
            <TriangleAlert className="size-3" />
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function McSection() {
  function copyCallback() {
    navigator.clipboard?.writeText(CALLBACK_EXEMPLO).catch(() => {})
    toast.success("URL de callback copiada (exemplo)")
  }

  return (
    <Section
      icon={<Webhook className="size-5" />}
      title="Mission Control · recepção do push"
      description="Este app é receptor puro (Modo B): o MC empurra os posts prontos."
      badge="contrato em aberto (§6.B)"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>URL de callback (o MC envia para cá)</Label>
          <div className="flex gap-2">
            <Input
              value={CALLBACK_EXEMPLO}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Copiar URL de callback"
              onClick={copyCallback}
            >
              <Copy />
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Endereço de exemplo — o caminho real é definido na integração.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5">
            <KeyRound className="size-3.5" />
            Token de comunicação
          </Label>
          <Input
            type="password"
            value=""
            disabled
            placeholder="definido na fase de integração"
          />
          <p className="text-status-failed-foreground text-xs">
            Demonstração: nunca cole um token real nesta tela.
          </p>
        </div>
      </div>

      <div className="bg-muted/40 text-muted-foreground mt-5 rounded-lg p-3 text-xs leading-relaxed">
        Em aberto no manual de integração (§6.B), território do MC:{" "}
        <strong>formato do corpo</strong>, <strong>id consultável</strong> e{" "}
        <strong>headers</strong> do invólucro do push. Só o conteúdo do campo{" "}
        <code>content</code> (o modelo de post v1) é deste app.
      </div>
    </Section>
  )
}

function OAuthSection() {
  return (
    <Section
      icon={<PlugZap className="size-5" />}
      title="Publicação nas redes · OAuth"
      description="Conexão real de cada conta para publicar (fase futura)."
      badge="mock — sem OAuth real"
    >
      <ul className="divide-y">
        {NETWORK_LIST.map((net) => (
          <li key={net.id} className="flex items-center gap-3 py-3 first:pt-0">
            <NetworkMark network={net.id} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{net.name}</p>
              <p className="text-muted-foreground text-xs">{net.blurb}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info(`Conectar ${net.name}`, {
                  description: "Disponível na fase de OAuth (F-oauth-redes).",
                })
              }
            >
              Conectar conta
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function GeralSection() {
  return (
    <Section
      icon={<AppWindow className="size-5" />}
      title="Geral"
      description="Identidade e preferências do app."
      badge="rascunho"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome do espaço" value="Social Publisher" />
        <Field label="Fuso horário" value="America/Sao_Paulo (UTC-3)" />
        <Field label="Idioma da interface" value="Português (Brasil)" />
        <Field label="Tema padrão" value="Claro / Escuro (alternável)" />
      </div>
    </Section>
  )
}

function PoliticaSection() {
  const rows: { label: string; hint: string; on: boolean }[] = [
    {
      label: "Revisão humana por padrão",
      hint: "Todo post entra em 'a revisar' a menos que venha com autoPublish.",
      on: true,
    },
    {
      label: "Permitir publicação automática (autoPublish)",
      hint: "Posts com autoPublish + agendamento válido pulam a revisão.",
      on: true,
    },
    {
      label: "Exigir confirmação ao publicar imediatamente",
      hint: "Pede um 'ok' extra antes de disparar um post 'agora'.",
      on: false,
    },
  ]
  return (
    <Section
      icon={<SlidersHorizontal className="size-5" />}
      title="Política de publicação"
      description="Como o app decide entre revisar, agendar e publicar."
      badge="rascunho"
    >
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-center justify-between gap-4 py-2"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-muted-foreground text-xs">{r.hint}</p>
            </div>
            <Switch checked={r.on} disabled aria-label={r.label} />
          </li>
        ))}
      </ul>
    </Section>
  )
}

function NotificacoesSection() {
  return (
    <Section
      icon={<Bell className="size-5" />}
      title="Notificações"
      description="Para onde avisar quando uma publicação falha."
      badge="rascunho"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="E-mail de alertas" value="alertas@exemplo.local" />
        <Field label="Webhook de falhas" value="(não configurado)" />
      </div>
      <p className="text-muted-foreground mt-4 text-xs">
        Falha de publicação já é sempre visível na inbox (aba “Falhas”); estes
        canais externos são um extra a definir.
      </p>
    </Section>
  )
}

function AcessoSection() {
  const members = [
    {
      name: "Marina Alvez",
      role: "Administradora",
      email: "marina@exemplo.local",
    },
    { name: "Você", role: "Editor", email: "voce@exemplo.local" },
  ]
  return (
    <Section
      icon={<Users className="size-5" />}
      title="Acesso & membros"
      description="Quem pode revisar e publicar (papéis a definir)."
      badge="rascunho"
    >
      <ul className="divide-y">
        {members.map((m) => (
          <li key={m.email} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-muted-foreground text-xs">{m.email}</p>
            </div>
            <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 text-xs font-medium">
              {m.role}
            </span>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() =>
          toast.info("Convidar membro", { description: "A definir no chat." })
        }
      >
        Convidar membro
      </Button>
    </Section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} readOnly />
    </div>
  )
}
