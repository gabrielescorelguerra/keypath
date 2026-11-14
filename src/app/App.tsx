import { createHashRouter, RouterProvider } from 'react-router'
import { routes } from './routes.tsx'

// Navegação por hash (#/aulas/...): links diretos funcionam em qualquer hospedagem estática (D34).
const router = createHashRouter(routes)

export function App() {
  return <RouterProvider router={router} />
}
