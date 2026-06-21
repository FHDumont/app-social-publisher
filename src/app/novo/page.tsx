"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import type { PostContent } from "@/domain/content"
import { usePublisher } from "@/store/publisher-store"
import { Composer } from "@/components/composer/composer"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"

export default function NewPostPage() {
  const { nowISO } = usePublisher()
  const [draft] = useState<PostContent>(() => emptyDraft(nowISO))

  return (
    <>
      <PageHeader
        title="Novo post"
        description="Crie um post do zero (origem manual). Mesmo modelo e mesma máquina de estados dos posts do MC."
        actions={
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeft />
            Voltar
          </Button>
        }
      />
      <Composer mode="create" initial={draft} />
    </>
  )
}

function emptyDraft(nowISO: string): PostContent {
  return {
    schemaVersion: 1,
    deliveryId: crypto.randomUUID(),
    origin: "manual",
    createdAt: nowISO,
    channels: [],
    base: { text: "", media: [] },
    perChannel: {},
    media: [],
    schedule: { mode: "now" },
    autoPublish: false,
  }
}
