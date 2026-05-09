import {
  Show, ScriptBlock, Cue, CueElement,
  Suggestion, SuggestionReply, ShowMember, ShowRole,
} from '../types'

const STORAGE_BASE =
  (import.meta.env.VITE_SUPABASE_URL as string) +
  '/storage/v1/object/public/ai-previews/'

function previewPathToUrl(path: string | null | undefined): string | null {
  return path ? STORAGE_BASE + path : null
}

// ─── Leaf mappers ─────────────────────────────────────────────────────────────

export function mapScriptBlock(row: Record<string, unknown>): ScriptBlock {
  return {
    id:         row.id as string,
    showId:     row.show_id as string,
    orderIndex: row.order_index as number,
    actLabel:   row.act_label as string,
    sceneLabel: row.scene_label as string,
    type:       row.type as ScriptBlock['type'],
    speaker:    (row.speaker as string | null) ?? undefined,
    lineText:   row.line_text as string,
  }
}

export function mapCueElement(row: Record<string, unknown>): CueElement {
  return {
    id:          row.id as string,
    cueId:       row.cue_id as string,
    label:       row.label as string,
    fixtureType: row.fixture_type as string,
    gelColor:    row.gel_color as string,
    gelCode:     row.gel_code as string,
    intensity:   row.intensity as number,
    focusArea:   row.focus_area as string,
    notes:       row.notes as string,
  }
}

export function mapSuggestionReply(row: Record<string, unknown>): SuggestionReply {
  return {
    id:         row.id as string,
    authorName: row.author_name as string,
    body:       row.body as string,
    createdAt:  row.created_at as string,
  }
}

export function mapSuggestion(row: Record<string, unknown>): Suggestion {
  const replies = (row.suggestion_replies as Record<string, unknown>[] | null) ?? []
  return {
    id:         row.id as string,
    cueId:      row.cue_id as string,
    authorName: row.author_name as string,
    body:       row.body as string,
    rationale:  row.rationale as string,
    strength:   row.strength as number,
    status:     row.status as Suggestion['status'],
    createdAt:  row.created_at as string,
    replies: replies
      .map(mapSuggestionReply)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  }
}

export function mapCue(row: Record<string, unknown>): Cue {
  const elements   = (row.cue_elements as Record<string, unknown>[] | null) ?? []
  const suggestions = (row.suggestions as Record<string, unknown>[] | null) ?? []
  return {
    id:                  row.id as string,
    showId:              row.show_id as string,
    scriptBlockId:       row.script_block_id as string,
    cueNumber:           Number(row.cue_number),
    status:              row.status as Cue['status'],
    designerConfidence:  row.designer_confidence as number,
    aiDescription:       row.ai_description as string,
    aiDescriptionLocked: row.ai_description_locked as boolean,
    aiPreviewUrl:        previewPathToUrl(row.ai_preview_path as string | null),
    timingUp:            Number(row.timing_up),
    timingDown:          Number(row.timing_down),
    delay:               Number(row.delay),
    notes:               row.notes as string,
    selectionStart:      (row.selection_start as number | null) ?? undefined,
    selectionEnd:        (row.selection_end as number | null) ?? undefined,
    elements: elements
      .sort((a, b) => (a.order_index as number) - (b.order_index as number))
      .map(mapCueElement),
    suggestions: suggestions
      .sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime())
      .map(mapSuggestion),
  }
}

export function mapShow(row: Record<string, unknown>): Show {
  const scriptBlocks = (row.script_blocks as Record<string, unknown>[] | null) ?? []
  const cues         = (row.cues as Record<string, unknown>[] | null) ?? []
  return {
    id:           row.id as string,
    title:        row.title as string,
    ownerId:      row.owner_id as string,
    inviteToken:  (row.invite_token as string | null) ?? undefined,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
    scriptBlocks: scriptBlocks
      .sort((a, b) => (a.order_index as number) - (b.order_index as number))
      .map(mapScriptBlock),
    cues: cues
      .sort((a, b) => Number(a.cue_number) - Number(b.cue_number))
      .map(mapCue),
  }
}

export function mapShowMember(row: Record<string, unknown>): ShowMember {
  const profile = row.profiles as Record<string, unknown> | null
  return {
    id:       row.id as string,
    showId:   row.show_id as string,
    userId:   row.user_id as string,
    role:     row.role as ShowRole,
    joinedAt: row.joined_at as string,
    profile:  profile
      ? { displayName: profile.display_name as string, avatarUrl: (profile.avatar_url as string | null) ?? null }
      : undefined,
  }
}
