export const practicePaths = {
  home: '/pratica',
  repertoire: '/pratica/repertorio',
  song: (id: string) => `/pratica/repertorio/${id}`,
  session: (id: string) => `/pratica/sessoes/${id}`,
} as const
