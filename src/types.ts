// ─── Script ───────────────────────────────────────────────────────────────────

export type ScriptBlockType =
  | 'act'
  | 'scene'
  | 'location'
  | 'song_header'
  | 'dialogue'
  | 'lyric'
  | 'stage_direction'

export interface ScriptBlock {
  id: string
  showId: string
  orderIndex: number
  actLabel: string
  sceneLabel: string
  type: ScriptBlockType
  speaker?: string
  lineText: string
}

// ─── Cue Elements ─────────────────────────────────────────────────────────────

export interface CueElement {
  id: string
  cueId: string
  fixtureType: string   // e.g. "Fresnel", "LED Par", "Ellipsoidal", "Follow Spot"
  label: string
  gelColor: string      // hex color for visualization
  gelCode: string       // e.g. "R27", "L201", "CTO", "no gel"
  intensity: number     // 0–100
  focusArea: string
  notes: string
}

// ─── Suggestions ──────────────────────────────────────────────────────────────

export type SuggestionStatus = 'open' | 'accepted' | 'rejected'

export interface SuggestionReply {
  id: string
  authorName: string
  body: string
  createdAt: string
}

export interface Suggestion {
  id: string
  cueId: string
  authorName: string
  body: string
  rationale: string
  strength: number      // 1–5
  status: SuggestionStatus
  createdAt: string
  replies: SuggestionReply[]
}

// ─── Cue ──────────────────────────────────────────────────────────────────────

export type CueStatus = 'draft' | 'pending' | 'approved'

export interface Cue {
  id: string
  showId: string
  scriptBlockId: string
  cueNumber: number           // float; displayed as integer when whole
  status: CueStatus
  designerConfidence: number  // 1–5
  aiDescription: string
  aiDescriptionLocked: boolean
  aiPreviewUrl: string | null
  timingUp: number
  timingDown: number
  delay: number
  notes: string
  elements: CueElement[]
  suggestions: Suggestion[]
  selectionStart?: number     // char offset in block.lineText for text-range cues
  selectionEnd?: number
  isGenerating?: boolean
}

// ─── Show ─────────────────────────────────────────────────────────────────────

export interface Show {
  id: string
  title: string
  ownerId: string
  inviteToken?: string
  createdAt: string
  updatedAt: string
  scriptBlocks: ScriptBlock[]
  cues: Cue[]
}

// ─── Show membership ──────────────────────────────────────────────────────────

export type ShowRole =
  | 'lighting_designer'
  | 'director'
  | 'stage_manager'
  | 'choreographer'
  | 'musical_director'
  | 'producer'
  | 'sound_designer'
  | 'set_designer'
  | 'costume_designer'
  | 'other'

export const SHOW_ROLE_LABELS: Record<ShowRole, string> = {
  lighting_designer: 'Lighting Designer',
  director:          'Director',
  stage_manager:     'Stage Manager',
  choreographer:     'Choreographer',
  musical_director:  'Musical Director',
  producer:          'Producer',
  sound_designer:    'Sound Designer',
  set_designer:      'Set Designer',
  costume_designer:  'Costume Designer',
  other:             'Other',
}

export interface ShowMember {
  id: string
  showId: string
  userId: string
  role: ShowRole
  joinedAt: string
  profile?: {
    displayName: string
    avatarUrl: string | null
  }
}

// ─── Feedback requests ────────────────────────────────────────────────────────

export interface FeedbackRequest {
  id: string
  cueId: string
  showId: string
  requesterId: string
  recipientIds: string[]
  message: string
  createdAt: string
  emailSentAt: string | null
}

// ─── App ──────────────────────────────────────────────────────────────────────

export type AppView = 'workspace' | 'editor' | 'cue-sheet'
