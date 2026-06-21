"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { usePublisher } from "@/store/publisher-store"
import { Composer } from "@/components/composer/composer"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"

export default function EditPostPage() {
  const params = useParams<{ id: string }>()
  const { posts } = usePublisher()
  const post = posts.find((p) => p.content.deliveryId === params.id)

  if (!post) {
    return (
      <>
        <PageHeader title="Post não encontrado" />
        <div className="bg-card/50 rounded-2xl border border-dashed px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Este post não existe (ou foi removido).
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            nativeButton={false}
            render={<Link href="/" />}
          >
            <ArrowLeft />
            Voltar para a inbox
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Composer"
        description="Edite a base e as versões por canal. O preview à direita aplica os overrides sobre a base."
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
      <Composer mode="edit" initial={post.content} post={post} />
    </>
  )
}
