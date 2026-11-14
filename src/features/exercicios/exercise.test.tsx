import { screen, within } from '@testing-library/react'
import { loadFacts } from '@/data'
import { resetDatabase } from '@/test/db.ts'
import { renderRoute } from '@/test/render.tsx'

beforeEach(resetDatabase)

describe('Quiz', () => {
  it('só corrige com tudo respondido; registra a tentativa e cumpre o critério', async () => {
    const { user } = renderRoute('/exercicios/harmonia.triades.quiz')
    const submit = await screen.findByRole('button', { name: 'Corrigir' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Fá Lá♭ Dó' }))
    await user.click(screen.getByRole('radio', { name: 'Terça menor + terça menor' }))
    await user.click(screen.getByRole('radio', { name: 'Aumentada' }))
    await user.click(submit)

    expect(await screen.findByText('Você acertou 100% (3 de 3).')).toBeInTheDocument()
    expect(await screen.findByText(/critério cumprido ✓/)).toBeInTheDocument()
    const [attempt] = (await loadFacts()).attempts
    expect(attempt).toMatchObject({
      exerciseId: 'harmonia.triades.quiz',
      result: { type: 'quiz', score: 1 },
    })

    const history = await screen.findByRole('region', { name: 'Suas tentativas' })
    expect(within(history).getByText('100% de acertos')).toBeInTheDocument()
  })

  it('mostra o que errou, com a explicação, e permite refazer', async () => {
    const { user } = renderRoute('/exercicios/teoria.intervalos.quiz')
    await user.click(await screen.findByRole('radio', { name: 'Fá' })) // errado
    await user.click(screen.getByRole('radio', { name: '7' }))
    await user.click(screen.getByRole('radio', { name: 'Terça menor' }))
    for (const name of ['Quarta', 'Quinta', 'Oitava']) {
      await user.click(screen.getByRole('checkbox', { name }))
    }
    await user.click(screen.getByRole('button', { name: 'Corrigir' }))

    expect(await screen.findByText('Você acertou 75% (3 de 4).')).toBeInTheDocument()
    expect(screen.getByText(/Não foi dessa vez\. Terça maior = 4 semitons/)).toBeInTheDocument()
    expect(screen.getByText('pendente', { exact: false })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Fazer de novo' }))
    expect(screen.getByRole('button', { name: 'Corrigir' })).toBeDisabled()
  })
})

describe('Autoavaliação', () => {
  it('registra a prática; só conta com todos os itens marcados', async () => {
    const { user } = renderRoute('/exercicios/harmonia.campo-maior.12-tons')
    expect(await screen.findByText(/Dó \(C\) · Sol \(G\)/)).toBeInTheDocument()
    expect(screen.getByText('60 bpm')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: /Toquei o campo nas 12 tonalidades/ }))
    await user.click(screen.getByRole('button', { name: 'Registrar prática' }))
    expect(
      await screen.findByText(/Para contar para o domínio, todos os itens/),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Registrar outra prática' }))
    await user.click(screen.getByRole('checkbox', { name: /Toquei o campo nas 12 tonalidades/ }))
    await user.click(screen.getByRole('checkbox', { name: /Nomeei corretamente/ }))
    await user.type(screen.getByRole('spinbutton', { name: /Andamento alcançado/ }), '64')
    await user.click(screen.getByRole('button', { name: 'Registrar prática' }))

    expect(
      await screen.findByText('Registrado! Esta prática conta para o domínio.'),
    ).toBeInTheDocument()
    // Critério exige 2 dias diferentes: hoje conta 1
    expect(await screen.findByText(/1 de 2 dias/)).toBeInTheDocument()
    const attempts = (await loadFacts()).attempts
    expect(attempts).toHaveLength(2)
    expect(attempts[1]?.result).toMatchObject({ type: 'self-assessment', bpm: 64 })
  })
})
