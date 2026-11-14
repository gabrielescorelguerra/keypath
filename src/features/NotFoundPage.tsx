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
