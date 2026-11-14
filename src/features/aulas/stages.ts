import type { LessonStage, MaterialKind, MaterialPurpose } from '@/domain/catalog'

export const STAGE_LABEL: Record<LessonStage, string> = {
  fundamentos: 'Fundamentos',
  visualizacao: 'Visualização',
  aplicacao: 'Aplicação',
  pratica: 'Prática guiada',
  revisao: 'Revisão',
}

export const PURPOSE_LABEL: Record<MaterialPurpose, { title: string; hint: string }> = {
  understand: { title: 'Entender o conceito', hint: 'Explicações e textos de referência.' },
  see: { title: 'Ver aplicado', hint: 'Demonstrações no instrumento.' },
  listen: { title: 'Ouvir exemplos', hint: 'Músicas em que o conceito aparece.' },
  practice: { title: 'Praticar', hint: 'Exercícios, playbacks e partituras.' },
}

export const KIND_LABEL: Record<MaterialKind, string> = {
  video: 'Vídeo',
  article: 'Artigo',
  interactive: 'Interativo',
  course: 'Curso',
  sheet: 'Partitura',
  'backing-track': 'Playback',
  song: 'Música',
  docs: 'Documentação',
}

export const LANGUAGE_LABEL = { pt: 'em português', en: 'em inglês', es: 'em espanhol' } as const

export const INTRO_STEP = 'introducao'
export const MATERIALS_STEP = 'aprofundamento'
