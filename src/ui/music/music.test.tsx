import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDatabase } from '@/test/db.ts'
import { Keyboard } from './Keyboard.tsx'
import { ChordBlock, ChordsBlock, ProgressionBlock, ScaleBlock } from './MusicBlocks.tsx'

beforeEach(resetDatabase)

const highlighted = (container: HTMLElement) =>
  [...container.querySelectorAll('rect[data-on="true"]')].map((r) =>
    Number(r.getAttribute('data-midi')),
  )

describe('Keyboard', () => {
  it('destaca as notas e descreve para leitores de tela', () => {
    const { container } = render(<Keyboard notes={['C4', 'Eb4', 'G4']} naming="both" />)
    expect(highlighted(container).sort()).toEqual([60, 63, 67])
    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Teclado com as notas: Dó (C), Mi♭ (E♭), Sol (G)',
    )
  })

  it('afunda a tecla enquanto ela é segurada', () => {
    const pressed = new Set<number>()
    const { container, rerender } = render(
      <Keyboard
        notes={['C4']}
        naming="letters"
        pressed={pressed}
        onPress={(m) => pressed.add(m)}
        onRelease={(m) => pressed.delete(m)}
      />,
    )
    const key = container.querySelector('rect[data-midi="62"]') as Element
    fireEvent.pointerDown(key)
    rerender(
      <Keyboard notes={['C4']} naming="letters" pressed={new Set(pressed)} onPress={() => {}} />,
    )
    expect(container.querySelector('rect[data-midi="62"]')).toHaveAttribute('data-pressed', 'true')
    fireEvent.pointerUp(container.querySelector('rect[data-midi="62"]') as Element)
  })

  it('cobre oitavas completas, com pelo menos duas', () => {
    const { container } = render(<Keyboard notes={['C4', 'E4']} naming="letters" />)
    expect(container.querySelectorAll('rect')).toHaveLength(24)
  })
})

describe('blocos musicais', () => {
  it('::chord mostra cifra brasileira, grau, qualidade e notas', async () => {
    render(<ChordBlock symbol="Cm" keyName="G" />)
    expect(screen.getByText('Cm')).toBeInTheDocument()
    expect(screen.getByText('IVm')).toBeInTheDocument()
    expect(screen.getByText('menor')).toBeInTheDocument()
    expect(await screen.findByText('Dó (C) · Mi♭ (E♭) · Sol (G)')).toBeInTheDocument()
  })

  it('::progression mostra graus e cifras; clicar seleciona o acorde', async () => {
    const user = userEvent.setup()
    const { container } = render(<ProgressionBlock keyName="G" degrees="I IV iv I" />)
    const chords = screen.getByRole('group', { name: 'Acordes' })
    const buttons = within(chords).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['IG', 'IVC', 'IVmCm', 'IG'])
    expect(screen.getByText('Em Sol (G) maior')).toBeInTheDocument()

    await user.click(buttons[2] as HTMLElement)
    expect(buttons[2]).toHaveAttribute('aria-pressed', 'true')
    // Cm destacado no teclado (com Mi♭, em qualquer oitava)
    expect(highlighted(container).some((midi) => midi % 12 === 3)).toBe(true)
  })

  it('clicar numa tecla do exemplo a mostra afundada até soltar', async () => {
    const { container } = render(<ChordBlock symbol="C" />)
    await screen.findByText('Dó (C) · Mi (E) · Sol (G)')
    const key = () => container.querySelector('rect[data-midi="65"]') as Element
    fireEvent.pointerDown(key())
    expect(key()).toHaveAttribute('data-pressed', 'true')
    fireEvent.pointerUp(key())
    expect(key()).not.toHaveAttribute('data-pressed')
  })

  it('a câmera lenta vale para todos os exemplos da página', async () => {
    const user = userEvent.setup()
    render(
      <>
        <ChordBlock symbol="C" />
        <ScaleBlock root="C" type="major" />
      </>,
    )
    const toggles = await screen.findAllByRole('button', { name: 'Câmera lenta' })
    expect(toggles).toHaveLength(2)
    await user.click(toggles[0] as HTMLElement)
    for (const toggle of toggles) expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await user.click(toggles[1] as HTMLElement)
    for (const toggle of toggles) expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('::chords mostra os graus quando há tom', () => {
    render(<ChordsBlock symbols="Eb F G" keyName="G" />)
    expect(screen.getByText('♭VI')).toBeInTheDocument()
    expect(screen.getByText('♭VII')).toBeInTheDocument()
  })

  it('::scale mostra o nome e as sete notas', async () => {
    render(<ScaleBlock root="A" type="harmonic-minor" />)
    expect(await screen.findByText('Lá (A) · menor harmônica')).toBeInTheDocument()
    expect(screen.getByText(/Sol♯ \(G♯\)$/)).toBeInTheDocument()
  })
})
