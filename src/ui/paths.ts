export const paths = {
  home: '/',
  learn: '/aprender',
  course: (id: string) => `/aprender?curso=${id}`,
  module: (id: string) => `/aprender/${id}`,
  track: (id: string) => `/trilhas/${id}`,
  competency: (id: string) => `/competencias/${id}`,
  lesson: (id: string, checkpoint?: string) =>
    `/aulas/${id}${checkpoint ? `?parte=${checkpoint}` : ''}`,
  exercise: (id: string) => `/exercicios/${id}`,
  library: '/biblioteca',
  concept: (id: string) => `/biblioteca/${id}`,
  diagnosis: '/diagnostico',
  settings: '/configuracoes',
} as const
