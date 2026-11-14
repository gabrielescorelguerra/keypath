import { Link } from 'react-router'
import { PageHeader } from '@/ui/Page'
import { paths } from '@/ui/paths'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Página não encontrada" />
      <p className="muted">
        O conteúdo pode ter mudado de nome. <Link to={paths.home}>Voltar ao início</Link>
      </p>
    </>
  )
}

export function ComingSoonPage({ what }: { readonly what: string }) {
  return (
    <>
      <PageHeader title={what} crumbs={[{ label: 'Início', to: paths.home }]} />
      <p className="muted">Em construção — chega nas próximas partes da etapa 6.</p>
    </>
  )
}
