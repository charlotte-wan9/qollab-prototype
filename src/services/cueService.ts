import type { Cue, CueElement } from '../types'

export async function createCue(_cue: Cue): Promise<void> {}
export async function updateCue(_id: string, _updates: Partial<Cue>): Promise<void> {}
export async function updateCuePreviewPath(_id: string, _path: string | null): Promise<void> {}
export async function deleteCue(_id: string): Promise<void> {}
export async function resequenceCues(_updates: { id: string; cueNumber: number }[]): Promise<void> {}
export async function createElement(_element: CueElement, _orderIndex: number): Promise<void> {}
export async function updateElement(_id: string, _updates: Partial<CueElement>): Promise<void> {}
export async function deleteElement(_id: string): Promise<void> {}
