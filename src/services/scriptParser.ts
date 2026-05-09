import { ScriptBlock, ScriptBlockType } from '../types'

// ─── Patterns ─────────────────────────────────────────────────────────────────

const ACT_RE = /^Act\s+(I{1,3}V?|VI{0,3}|\d+)(\s|$)/i
const SCENE_RE = /^Scene\s+\d+/i
const LOCATION_RE = /^\[.+\]$/
const SONG_RE = /^Song\s+(No\.?\s*)?\d+/i
const VOICEOVER_RE = /^\(Voice[\s-]?[Oo]ver\)/

// Matches: "Name  dialogue text" — name is up to 40 chars, 2+ spaces, then text.
// Works for both English ("Wei Lan", "Guest 1") and Chinese ("郑微岚") names.
const DIALOGUE_RE = /^(.{1,40}?)[ \t]{2,}(.+)$/

function looksLikeSpeakerName(s: string): boolean {
  if (s.length === 0 || s.length > 40) return false
  // Must start with uppercase letter or Chinese/Japanese/Korean character
  if (!/^[A-Z\u3040-\u9FFF\uF900-\uFAFF（(]/.test(s)) return false
  // Stage directions often contain lowercase mid-word prose; real names don't
  if (/[a-z]{4,}/.test(s) && !/^[A-Z][a-z]/.test(s)) return false
  return true
}

// ─── PDF text extraction ──────────────────────────────────────────────────────

export async function extractTextFromPDF(file: File): Promise<string> {
  // Dynamic import so the worker URL is only resolved when needed
  const pdfjsLib = await import('pdfjs-dist')

  // Use a CDN-hosted worker to avoid Vite bundling complications
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    // Group text items by their Y position to reconstruct visual lines
    type RawItem = { str: string; transform: number[] }
    const items = textContent.items.filter(
      (item) => 'str' in item && 'transform' in item && (item as RawItem).str.trim() !== '',
    ) as RawItem[]

    const lineMap = new Map<number, RawItem[]>()
    for (const item of items) {
      const y = Math.round(item.transform[5])
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push(item)
    }

    // Sort Y values descending (PDF Y axis is bottom-up)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a)
    const pageText = sortedYs
      .map((y) => {
        const row = lineMap.get(y)!.sort((a: RawItem, b: RawItem) => a.transform[4] - b.transform[4])
        return row.map((item: RawItem) => item.str).join('')
      })
      .join('\n')

    pageTexts.push(pageText)
  }

  return pageTexts.join('\n')
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseTextToBlocks(text: string, showId: string): ScriptBlock[] {
  const rawLines = text.split(/\r?\n/)
  const blocks: ScriptBlock[] = []
  let currentAct = ''
  let currentScene = ''
  let orderIndex = 0

  for (const rawLine of rawLines) {
    const line = rawLine.trim()
    if (!line) continue

    let type: ScriptBlockType
    let speaker: string | undefined
    let lineText = line

    if (ACT_RE.test(line)) {
      type = 'act'
      currentAct = line
      currentScene = ''
    } else if (SCENE_RE.test(line)) {
      type = 'scene'
      currentScene = line
    } else if (LOCATION_RE.test(line)) {
      type = 'location'
    } else if (SONG_RE.test(line)) {
      type = 'song_header'
    } else if (VOICEOVER_RE.test(line)) {
      type = 'stage_direction'
    } else {
      const match = line.match(DIALOGUE_RE)
      if (match && looksLikeSpeakerName(match[1].trim())) {
        speaker = match[1].trim()
        lineText = match[2].trim()
        type = 'dialogue'
      } else {
        type = 'stage_direction'
      }
    }

    blocks.push({
      id: crypto.randomUUID(),
      showId,
      orderIndex: orderIndex++,
      actLabel: currentAct,
      sceneLabel: currentScene,
      type,
      speaker,
      lineText,
    })
  }

  return blocks
}
