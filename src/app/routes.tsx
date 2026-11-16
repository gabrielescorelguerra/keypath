import type { RouteObject } from 'react-router'
import { LearnPage } from '@/features/aprender/LearnPage'
import { ModulePage } from '@/features/aprender/ModulePage'
import { ConceptPage } from '@/features/biblioteca/ConceptPage'
import { LibraryPage } from '@/features/biblioteca/LibraryPage'
import { SongsPage } from '@/features/biblioteca/SongsPage'
import { LessonPage } from '@/features/aulas/LessonPage'
import { ExercisePage } from '@/features/exercicios/ExercisePage'
import { PracticePage } from '@/features/pratica/PracticePage'
import { SessionPage } from '@/features/pratica/SessionPage'
import { RepertoirePage } from '@/features/pratica/RepertoirePage'
import { SongPage } from '@/features/pratica/SongPage'
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
      { path: 'aprender', element: <LearnPage /> },
      { path: 'aprender/:moduleId', element: <ModulePage /> },
      { path: 'trilhas/:trackId', element: <TrackPage /> },
      { path: 'competencias/:competencyId', element: <CompetencyPage /> },
      { path: 'aulas/:lessonId', element: <LessonPage /> },
      { path: 'exercicios/:exerciseId', element: <ExercisePage /> },
      { path: 'biblioteca', element: <LibraryPage /> },
      { path: 'biblioteca/musicas', element: <SongsPage /> },
      { path: 'biblioteca/:conceptId', element: <ConceptPage /> },
      { path: 'pratica', element: <PracticePage /> },
      { path: 'pratica/sessoes/:sessionId', element: <SessionPage /> },
      { path: 'pratica/repertorio', element: <RepertoirePage /> },
      { path: 'pratica/repertorio/:songId', element: <SongPage /> },
      { path: 'diagnostico', element: <DiagnosisPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
