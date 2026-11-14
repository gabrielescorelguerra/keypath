import type { RouteObject } from 'react-router'
import { CompetencyPage } from '@/features/competencias/CompetencyPage'
import { SettingsPage } from '@/features/configuracoes/SettingsPage'
import { DiagnosisPage } from '@/features/diagnostico/DiagnosisPage'
import { HomePage } from '@/features/inicio/HomePage'
import { ComingSoonPage, NotFoundPage } from '@/features/NotFoundPage'
import { TrackPage } from '@/features/trilhas/TrackPage'
import { Layout } from './Layout.tsx'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'trilhas/:trackId', element: <TrackPage /> },
      { path: 'competencias/:competencyId', element: <CompetencyPage /> },
      { path: 'aulas/:lessonId', element: <ComingSoonPage what="Aula" /> },
      { path: 'exercicios/:exerciseId', element: <ComingSoonPage what="Exercício" /> },
      { path: 'biblioteca', element: <ComingSoonPage what="Biblioteca" /> },
      { path: 'biblioteca/:conceptId', element: <ComingSoonPage what="Biblioteca" /> },
      { path: 'diagnostico', element: <DiagnosisPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
