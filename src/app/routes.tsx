import type { RouteObject } from 'react-router'
import { ConceptPage } from '@/features/biblioteca/ConceptPage'
import { LibraryPage } from '@/features/biblioteca/LibraryPage'
import { LessonPage } from '@/features/aulas/LessonPage'
import { ExercisePage } from '@/features/exercicios/ExercisePage'
import { CompetencyPage } from '@/features/competencias/CompetencyPage'
import { SettingsPage } from '@/features/configuracoes/SettingsPage'
import { DiagnosisPage } from '@/features/diagnostico/DiagnosisPage'
import { HomePage } from '@/features/inicio/HomePage'
import { NotFoundPage } from '@/features/NotFoundPage'
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
      { path: 'aulas/:lessonId', element: <LessonPage /> },
      { path: 'exercicios/:exerciseId', element: <ExercisePage /> },
      { path: 'biblioteca', element: <LibraryPage /> },
      { path: 'biblioteca/:conceptId', element: <ConceptPage /> },
      { path: 'diagnostico', element: <DiagnosisPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
