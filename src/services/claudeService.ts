import { Cue, CueElement, ScriptBlock } from '../types'

// ─── Placeholder generators (prototype) ───────────────────────────────────────
// These produce template text based on cue data. No API calls are made.

function primaryElement(elements: CueElement[]): CueElement | null {
  return elements[0] ?? null
}

function intensityWord(pct: number): string {
  if (pct >= 85) return 'bright'
  if (pct >= 60) return 'medium'
  if (pct >= 35) return 'dim'
  return 'very dim'
}

function gelDescription(gelCode: string, gelColor: string): string {
  const code = gelCode.toLowerCase()
  if (code.includes('cto') || code.includes('ctb')) return 'a neutral white correction'
  if (!gelCode || gelCode === 'no gel') return 'a clear, uncolored'
  const hex = gelColor.toLowerCase()
  if (hex.startsWith('#ff') || hex.startsWith('#f4') || hex.startsWith('#e8')) return `a warm amber (${gelCode})`
  if (hex.startsWith('#00') || hex.startsWith('#0') || hex.includes('4c') || hex.includes('5b')) return `a cool blue (${gelCode})`
  if (hex.startsWith('#8') || hex.startsWith('#9') || hex.startsWith('#a')) return `a soft lavender (${gelCode})`
  if (hex.startsWith('#4') || hex.startsWith('#3')) return `a deep teal (${gelCode})`
  return `a ${gelCode} tinted`
}

function fixtureDescription(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('follow')) return 'follow spot'
  if (t.includes('fresnel')) return 'fresnel wash'
  if (t.includes('ellipsoidal') || t.includes('leko') || t.includes('s4')) return 'ellipsoidal spot'
  if (t.includes('par') || t.includes('led')) return 'LED par wash'
  if (t.includes('strip') || t.includes('cyc')) return 'cyc strip'
  return type.toLowerCase()
}

function buildPlaceholderDescription(cue: Cue, scriptBlock: ScriptBlock | undefined): string {
  const el = primaryElement(cue.elements)
  if (!el) return 'No lighting elements defined for this cue.'

  const intensity = intensityWord(el.intensity)
  const gel = gelDescription(el.gelCode, el.gelColor)
  const fixture = fixtureDescription(el.fixtureType)
  const focus = el.focusArea || 'the stage'
  const count = cue.elements.length

  let desc = `A ${intensity} ${gel} light from a ${fixture} illuminates ${focus}.`

  if (count > 1) {
    const others = cue.elements.slice(1)
    const fills = others
      .map((e) => `${gelDescription(e.gelCode, e.gelColor)} ${fixtureDescription(e.fixtureType)} at ${e.intensity}%`)
      .join(', ')
    desc += ` Supplemented by ${fills}.`
  }

  if (scriptBlock?.lineText) {
    desc += ` The overall mood supports the scene at this moment.`
  }

  desc += ` Timing: ${cue.timingUp}s fade up, ${cue.timingDown}s fade down.`
  return desc
}

function buildPlaceholderVisualization(cue: Cue, scriptBlock: ScriptBlock | undefined): string {
  const el = primaryElement(cue.elements)
  if (!el) return ''

  const intensity = intensityWord(el.intensity)
  const gel = gelDescription(el.gelCode, el.gelColor)
  const focus = el.focusArea || 'center stage'
  const context = scriptBlock?.lineText
    ? `The scene — "${scriptBlock.lineText.slice(0, 60)}${scriptBlock.lineText.length > 60 ? '…' : ''}" — `
    : 'The scene '

  const additive =
    cue.elements.length > 1
      ? ` Additional fixtures blend in from the sides, softening the shadows and widening the pool of light.`
      : ''

  return (
    `${context}is lit by a ${intensity} ${gel} ${fixtureDescription(el.fixtureType)} ` +
    `casting from above-front onto ${focus}.${additive} ` +
    `The audience perceives a focused, ${intensity} stage picture with the remaining area receding into shadow.`
  )
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function generateCueDescription(
  cue: Cue,
  scriptBlock: ScriptBlock | undefined,
): Promise<string> {
  await new Promise((r) => setTimeout(r, 900))
  return buildPlaceholderDescription(cue, scriptBlock)
}

const PLACEHOLDER_IMAGES = [
  '/placeholders/stage1.jpg',
  '/placeholders/stage2.jpg',
]

export async function generateSceneVisualization(
  _cue: Cue,
  _scriptBlock: ScriptBlock | undefined,
): Promise<string | null> {
  await new Promise((r) => setTimeout(r, 900))
  return PLACEHOLDER_IMAGES[Math.floor(Math.random() * PLACEHOLDER_IMAGES.length)]
}

export async function generateAI(
  cue: Cue,
  scriptBlock: ScriptBlock | undefined,
): Promise<{ aiDescription: string | null; aiPreviewUrl: string | null }> {
  const [aiDescription, aiPreviewUrl] = await Promise.all([
    cue.aiDescriptionLocked
      ? Promise.resolve(cue.aiDescription)
      : generateCueDescription(cue, scriptBlock),
    generateSceneVisualization(cue, scriptBlock),
  ])
  return { aiDescription, aiPreviewUrl }
}
