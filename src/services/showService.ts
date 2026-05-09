import { Show, ScriptBlock } from '../types'

const STORAGE_KEY = 'qollab_shows'

function getStored(): Show[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveShows(shows: Show[]): void {
  const toSave = shows.map((s) => ({
    ...s,
    cues: s.cues.map((c) => ({ ...c, aiPreviewUrl: null, isGenerating: undefined })),
  }))
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  } catch {
    // sessionStorage full — skip
  }
}

export async function loadUserShows(): Promise<Show[]> {
  return getStored()
}

export async function loadShow(id: string): Promise<Show> {
  const show = getStored().find((s) => s.id === id)
  if (!show) throw new Error('Show not found')
  return show
}

export async function createShow(title: string, scriptBlocks: ScriptBlock[]): Promise<Show> {
  const now = new Date().toISOString()
  const newShow: Show = {
    id: crypto.randomUUID(),
    title,
    ownerId: 'demo-user-id',
    inviteToken: crypto.randomUUID(),
    scriptBlocks: scriptBlocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    cues: [],
    createdAt: now,
    updatedAt: now,
  }
  saveShows([newShow, ...getStored()])
  return newShow
}

export async function updateShowTitle(id: string, title: string): Promise<void> {
  saveShows(getStored().map((s) => (s.id === id ? { ...s, title } : s)))
}

export async function deleteShow(id: string): Promise<void> {
  saveShows(getStored().filter((s) => s.id !== id))
}

export async function rotateInviteToken(id: string): Promise<string> {
  const token = crypto.randomUUID()
  saveShows(getStored().map((s) => (s.id === id ? { ...s, inviteToken: token } : s)))
  return token
}

export async function getShowByInviteToken(
  _token: string,
): Promise<{ id: string; title: string; ownerId: string } | null> {
  return null
}
