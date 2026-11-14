let context: AudioContext | null = null
let master: GainNode | null = null

/** AudioContext único do app (criado no primeiro uso, que deve vir de um toque do usuário). */
export function getAudio(): { readonly context: AudioContext; readonly master: GainNode } | null {
  if (typeof AudioContext === 'undefined') return null
  if (!context || !master) {
    context = new AudioContext()
    master = context.createGain()
    master.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume()
  return { context, master }
}
