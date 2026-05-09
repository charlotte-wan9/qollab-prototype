import type { Suggestion, SuggestionReply } from '../types'

export async function createSuggestion(_suggestion: Omit<Suggestion, 'replies'>): Promise<void> {}
export async function updateSuggestion(
  _id: string,
  _updates: Partial<Pick<Suggestion, 'status' | 'body' | 'rationale'>>,
): Promise<void> {}
export async function createReply(_reply: SuggestionReply, _suggestionId: string): Promise<void> {}
