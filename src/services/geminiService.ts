import type { Cue, ScriptBlock } from '../types'

export async function generateCueDescription(
  _cue: Cue,
  _scriptBlock: ScriptBlock | undefined,
): Promise<string> {
  return ''
}

export async function generateMoodPreview(
  _cue: Cue,
  _scriptBlock: ScriptBlock | undefined,
): Promise<string | null> {
  return null
}

export async function generateAI(
  _cue: Cue,
  _scriptBlock: ScriptBlock | undefined,
): Promise<{ aiDescription: string | null; aiPreviewUrl: string | null }> {
  return { aiDescription: null, aiPreviewUrl: null }
}
