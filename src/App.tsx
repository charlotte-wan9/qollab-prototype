import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Show, Cue, CueElement, Suggestion, ScriptBlock, AppView, CueStatus } from './types'
import { DEFAULT_ELEMENT } from './constants'
import { generateAI } from './services/claudeService'
import { useSession } from './hooks/useSession'
import {
  loadUserShows,
  loadShow,
  createShow as dbCreateShow,
  deleteShow as dbDeleteShow,
  rotateInviteToken,
  saveShows,
} from './services/showService'
import { getMyMemberships, leaveShow } from './services/memberService'
import {
  createCue as dbCreateCue,
  updateCue as dbUpdateCue,
  deleteCue as dbDeleteCue,
  resequenceCues as dbResequenceCues,
  createElement as dbCreateElement,
  updateElement as dbUpdateElement,
  deleteElement as dbDeleteElement,
  updateCuePreviewPath,
} from './services/cueService'
import {
  createSuggestion as dbCreateSuggestion,
  updateSuggestion as dbUpdateSuggestion,
  createReply as dbCreateReply,
} from './services/suggestionService'
import { uploadPreview, getPreviewUrl } from './services/storageService'
import ShareModal from './components/ShareModal'
import Workspace from './components/Workspace'
import ShowCreationModal from './components/ShowCreationModal'
import ScriptViewer from './components/ScriptViewer'
import CueEditor from './components/CueEditor'
import CueSheet from './components/CueSheet'
import FeedbackRequestModal from './components/FeedbackRequestModal'
import { ChevronLeft, FileOutput, Loader2, UserPlus, Zap } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomUUID()
}

function displayCueNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function resequenceCues(blocks: ScriptBlock[], cues: Cue[]): Cue[] {
  const sorted = [...cues].sort((a, b) => {
    const ia = blocks.findIndex((bl) => bl.id === a.scriptBlockId)
    const ib = blocks.findIndex((bl) => bl.id === b.scriptBlockId)
    if (ia !== ib) return ia - ib
    return (a.selectionStart ?? -1) - (b.selectionStart ?? -1)
  })
  return sorted.map((c, i) => ({ ...c, cueNumber: i + 1 }))
}

const STATUS_DOT: Record<CueStatus, string> = {
  approved: 'bg-approved',
  pending: 'bg-pending',
  draft: 'bg-draft',
}

// ─── App ──────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const { user } = useSession()
  const [view, setView] = useState<AppView>('workspace')
  const [shows, setShows] = useState<Show[]>([])
  const [showsLoading, setShowsLoading] = useState(false)
  const [myMemberships] = useState<{ showId: string; role: import('./types').ShowRole }[]>([])
  const [currentShowId, setCurrentShowId] = useState<string | null>(null)
  const [selectedCueId, setSelectedCueId] = useState<string | undefined>()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingShow, setIsCreatingShow] = useState(false)
  const [createShowError, setCreateShowError] = useState('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [feedbackCueId, setFeedbackCueId] = useState<string | null>(null)

  const handleTokenRotated = useCallback((showId: string, newToken: string) => {
    setShows((prev) =>
      prev.map((s) => s.id === showId ? { ...s, inviteToken: newToken } : s),
    )
  }, [])

  // ── Load shows from sessionStorage on mount ────────────────────────────────
  useEffect(() => {
    setShowsLoading(true)
    Promise.all([loadUserShows(), getMyMemberships()])
      .then(([storedShows]) => { setShows(storedShows) })
      .catch(console.error)
      .finally(() => setShowsLoading(false))
  }, [])

  // ── Persist shows to sessionStorage whenever state changes ─────────────────
  useEffect(() => {
    if (shows.length > 0) saveShows(shows)
  }, [shows])

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeShow = useMemo(
    () => shows.find((s) => s.id === currentShowId),
    [shows, currentShowId],
  )

  const selectedCue = useMemo(
    () => activeShow?.cues.find((c) => c.id === selectedCueId),
    [activeShow, selectedCueId],
  )

  const selectedBlock = useMemo(
    () => activeShow?.scriptBlocks.find((b) => b.id === selectedCue?.scriptBlockId),
    [activeShow, selectedCue],
  )

  const sortedCues = useMemo(
    () => [...(activeShow?.cues ?? [])].sort((a, b) => a.cueNumber - b.cueNumber),
    [activeShow],
  )

  // All users can edit in the prototype
  const canEdit = true
  const currentUserName = (user?.user_metadata?.display_name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'Demo User'

  const handleRequestFeedback = useCallback((cueId: string) => setFeedbackCueId(cueId), [])

  // ── Show CRUD ──────────────────────────────────────────────────────────────

  const handleCreateShow = useCallback(
    async (title: string, scriptBlocks: ScriptBlock[]) => {
      setIsCreatingShow(true)
      setCreateShowError('')
      try {
        const newShow = await dbCreateShow(title, scriptBlocks)
        setShows((prev) => [newShow, ...prev])
        setCurrentShowId(newShow.id)
        setSelectedCueId(undefined)
        setView('editor')
      } catch (err) {
        console.error('Failed to create show:', err)
        setCreateShowError(err instanceof Error ? err.message : 'Failed to create show')
      } finally {
        setIsCreatingShow(false)
      }
    },
    [],
  )

  const handleDeleteShow = useCallback(
    (id: string) => {
      if (currentShowId === id) { setCurrentShowId(null); setSelectedCueId(undefined); setView('workspace') }
      setShows((prev) => prev.filter((s) => s.id !== id))
      dbDeleteShow(id).catch(console.error)
    },
    [currentShowId],
  )

  const handleLeaveShow = useCallback(
    (id: string) => {
      if (currentShowId === id) { setCurrentShowId(null); setSelectedCueId(undefined); setView('workspace') }
      setShows((prev) => prev.filter((s) => s.id !== id))
      leaveShow(id).catch(console.error)
    },
    [currentShowId],
  )

  const handleOpenShow = useCallback(
    async (id: string) => {
      setCurrentShowId(id)
      setSelectedCueId(undefined)
      setView('editor')

      const existing = shows.find((s) => s.id === id)
      if (!existing || existing.scriptBlocks.length === 0) {
        try {
          const full = await loadShow(id)
          setShows((prev) => prev.map((s) => (s.id === id ? full : s)))
          setSelectedCueId(full.cues[0]?.id)
        } catch (err) {
          console.error('Failed to load show:', err)
        }
      } else {
        setSelectedCueId(existing.cues[0]?.id)
      }
    },
    [shows],
  )

  // ── Cue CRUD ───────────────────────────────────────────────────────────────

  const updateShow = useCallback(
    (id: string, updater: (show: Show) => Show) => {
      setShows((prev) =>
        prev.map((s) =>
          s.id === id ? { ...updater(s), updatedAt: new Date().toISOString() } : s,
        ),
      )
    },
    [],
  )

  const handleAddCue = useCallback(
    (scriptBlockId: string, selection?: { start: number; end: number }) => {
      if (!currentShowId) return
      const show = shows.find((s) => s.id === currentShowId)
      if (!show) return

      const newCue: Cue = {
        id: uid(),
        showId: currentShowId,
        scriptBlockId,
        cueNumber: 0,
        status: 'draft',
        designerConfidence: 3,
        aiDescription: '',
        aiDescriptionLocked: false,
        aiPreviewUrl: null,
        timingUp: 3,
        timingDown: 3,
        delay: 0,
        notes: '',
        elements: [{ id: uid(), cueId: '', ...DEFAULT_ELEMENT }],
        suggestions: [],
        selectionStart: selection?.start,
        selectionEnd: selection?.end,
      }
      newCue.elements[0].cueId = newCue.id

      const updated = resequenceCues(show.scriptBlocks, [...show.cues, newCue])
      updateShow(currentShowId, (s) => ({ ...s, cues: updated }))
      setSelectedCueId(newCue.id)

      const persisted = updated.find((c) => c.id === newCue.id)!
      dbCreateCue(persisted).catch(console.error)

      const resequenced = updated
        .filter((c) => c.id !== newCue.id)
        .map((c) => ({ id: c.id, cueNumber: c.cueNumber }))
      if (resequenced.length > 0) dbResequenceCues(resequenced).catch(console.error)
    },
    [currentShowId, shows, updateShow],
  )

  const handleDeleteCue = useCallback(
    (cueId: string) => {
      if (!currentShowId) return
      const show = shows.find((s) => s.id === currentShowId)
      if (!show) return

      const remaining = show.cues.filter((c) => c.id !== cueId)
      const updated = resequenceCues(show.scriptBlocks, remaining)
      updateShow(currentShowId, (s) => ({ ...s, cues: updated }))
      if (selectedCueId === cueId) setSelectedCueId(updated[0]?.id)

      dbDeleteCue(cueId).catch(console.error)
      if (updated.length > 0) {
        dbResequenceCues(updated.map((c) => ({ id: c.id, cueNumber: c.cueNumber }))).catch(console.error)
      }
    },
    [currentShowId, shows, selectedCueId, updateShow],
  )

  const handleUpdateCue = useCallback(
    (cueId: string, updates: Partial<Cue>) => {
      if (!currentShowId) return
      updateShow(currentShowId, (s) => ({
        ...s,
        cues: s.cues.map((c) => (c.id === cueId ? { ...c, ...updates } : c)),
      }))
      const { elements: _el, suggestions: _sg, isGenerating: _ig, ...dbUpdates } = updates as Partial<Cue> & { isGenerating?: boolean }
      if (Object.keys(dbUpdates).length > 0) {
        dbUpdateCue(cueId, dbUpdates).catch(console.error)
      }
    },
    [currentShowId, updateShow],
  )

  // ── Element CRUD ───────────────────────────────────────────────────────────

  const handleAddElement = useCallback(
    (cueId: string) => {
      if (!currentShowId) return
      const cue = activeShow?.cues.find((c) => c.id === cueId)
      const orderIndex = cue?.elements.length ?? 0
      const newEl: CueElement = {
        id: uid(),
        cueId,
        ...DEFAULT_ELEMENT,
        label: `Light ${orderIndex + 1}`,
      }
      handleUpdateCue(cueId, { elements: [...(cue?.elements ?? []), newEl] })
      dbCreateElement(newEl, orderIndex).catch(console.error)
    },
    [currentShowId, activeShow, handleUpdateCue],
  )

  const handleUpdateElement = useCallback(
    (cueId: string, elementId: string, updates: Partial<CueElement>) => {
      const cue = activeShow?.cues.find((c) => c.id === cueId)
      if (!cue) return
      handleUpdateCue(cueId, {
        elements: cue.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
      })
      dbUpdateElement(elementId, updates).catch(console.error)
    },
    [activeShow, handleUpdateCue],
  )

  const handleDeleteElement = useCallback(
    (cueId: string, elementId: string) => {
      const cue = activeShow?.cues.find((c) => c.id === cueId)
      if (!cue) return
      handleUpdateCue(cueId, {
        elements: cue.elements.filter((el) => el.id !== elementId),
      })
      dbDeleteElement(elementId).catch(console.error)
    },
    [activeShow, handleUpdateCue],
  )

  // ── Suggestions ────────────────────────────────────────────────────────────

  const handleAddSuggestion = useCallback(
    (cueId: string, data: Omit<Suggestion, 'id' | 'cueId' | 'status' | 'createdAt' | 'replies'>) => {
      const cue = activeShow?.cues.find((c) => c.id === cueId)
      if (!cue) return
      const newSug: Suggestion = {
        id: uid(),
        cueId,
        status: 'open',
        createdAt: new Date().toISOString(),
        replies: [],
        ...data,
      }
      handleUpdateCue(cueId, { suggestions: [...cue.suggestions, newSug] })
      dbCreateSuggestion(newSug).catch(console.error)
    },
    [activeShow, handleUpdateCue],
  )

  const handleUpdateSuggestion = useCallback(
    (cueId: string, suggestionId: string, updates: Partial<Suggestion>) => {
      const cue = activeShow?.cues.find((c) => c.id === cueId)
      if (!cue) return

      handleUpdateCue(cueId, {
        suggestions: cue.suggestions.map((s) =>
          s.id === suggestionId ? { ...s, ...updates } : s,
        ),
      })

      const scalarUpdates: Parameters<typeof dbUpdateSuggestion>[1] = {}
      if (updates.status    !== undefined) scalarUpdates.status    = updates.status
      if (updates.body      !== undefined) scalarUpdates.body      = updates.body
      if (updates.rationale !== undefined) scalarUpdates.rationale = updates.rationale
      if (Object.keys(scalarUpdates).length > 0) {
        dbUpdateSuggestion(suggestionId, scalarUpdates).catch(console.error)
      }

      if (updates.replies) {
        const existing = cue.suggestions.find((s) => s.id === suggestionId)
        const existingIds = new Set((existing?.replies ?? []).map((r) => r.id))
        const newReplies = updates.replies.filter((r) => !existingIds.has(r.id))
        for (const reply of newReplies) {
          dbCreateReply(reply, suggestionId).catch(console.error)
        }
      }
    },
    [activeShow, handleUpdateCue],
  )

  // ── AI ─────────────────────────────────────────────────────────────────────

  const handleGenerateAI = useCallback(
    async (cueId: string) => {
      const show = shows.find((s) => s.id === currentShowId)
      const cue = show?.cues.find((c) => c.id === cueId)
      if (!cue || cue.elements.length === 0) return

      handleUpdateCue(cueId, { isGenerating: true })
      try {
        const block = show?.scriptBlocks.find((b) => b.id === cue.scriptBlockId)
        const { aiDescription, aiPreviewUrl: dataUrl } = await generateAI(cue, block)

        let finalUrl: string | null = dataUrl ?? null
        if (dataUrl && currentShowId) {
          try {
            const path = await uploadPreview(currentShowId, cueId, dataUrl)
            finalUrl = getPreviewUrl(path)
            updateCuePreviewPath(cueId, path).catch(console.error)
          } catch (uploadErr) {
            console.warn('Preview generation failed, using local URL:', uploadErr)
          }
        }

        handleUpdateCue(cueId, {
          aiDescription: aiDescription ?? cue.aiDescription,
          aiPreviewUrl: finalUrl,
          isGenerating: false,
        })
      } catch (err) {
        console.error('AI generation error:', err)
        handleUpdateCue(cueId, { isGenerating: false })
      }
    },
    [shows, currentShowId, handleUpdateCue],
  )

  // ── Views ──────────────────────────────────────────────────────────────────

  if (view === 'cue-sheet') {
    return (
      <CueSheet
        show={activeShow!}
        onBack={() => setView('editor')}
      />
    )
  }

  if (view === 'workspace') {
    return (
      <>
        <Workspace
          shows={shows}
          showsLoading={showsLoading}
          myMemberships={myMemberships}
          user={user}
          onCreateShow={() => setIsCreateModalOpen(true)}
          onOpenShow={handleOpenShow}
          onDeleteShow={handleDeleteShow}
          onLeaveShow={handleLeaveShow}
        />
        <ShowCreationModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={async (title, blocks) => {
            setIsCreateModalOpen(false)
            await handleCreateShow(title, blocks)
          }}
          showCount={shows.length}
        />
        {(isCreatingShow || createShowError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-6 py-4 shadow-2xl">
              {isCreatingShow ? (
                <>
                  <Loader2 size={18} className="text-amber animate-spin" />
                  <span className="text-sm text-slate-300 font-medium">Creating show…</span>
                </>
              ) : (
                <>
                  <span className="text-sm text-red">{createShowError}</span>
                  <button
                    onClick={() => setCreateShowError('')}
                    className="text-xs text-slate-500 hover:text-slate-300 ml-2"
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  // ── Editor view ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      {/* Header */}
      <header className="h-13 shrink-0 flex items-center justify-between px-4 bg-surface/90 backdrop-blur-sm z-10 amber-divider">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('workspace')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-200 hover:bg-raised transition-colors"
          >
            <ChevronLeft size={14} />
            Shows
          </button>
          <span className="text-border-strong text-xs">|</span>
          <span className="font-display italic text-base font-semibold text-slate-200 truncate max-w-xs leading-none">
            {activeShow?.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-200 hover:bg-raised transition-colors border border-border"
          >
            <UserPlus size={12} />
            Invite
          </button>
          <button
            onClick={() => setView('cue-sheet')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-amber hover:bg-amber-muted transition-colors border border-border"
          >
            <FileOutput size={12} />
            Export Cue Sheet
          </button>
        </div>
      </header>

      {/* Main split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Script viewer — 55% */}
        <div className="w-[55%] flex flex-col border-r border-border">
          <ScriptViewer
            blocks={activeShow?.scriptBlocks ?? []}
            cues={activeShow?.cues ?? []}
            selectedCueId={selectedCueId}
            canEdit={canEdit}
            onAddCue={handleAddCue}
            onSelectCue={setSelectedCueId}
          />
        </div>

        {/* Cue editor — 45% */}
        <div className="w-[45%] flex flex-col">
          {selectedCue ? (
            <CueEditor
              cue={selectedCue}
              scriptBlock={selectedBlock}
              canEdit={canEdit}
              currentUserName={currentUserName}
              onUpdateCue={handleUpdateCue}
              onDeleteCue={handleDeleteCue}
              onAddElement={handleAddElement}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onAddSuggestion={handleAddSuggestion}
              onUpdateSuggestion={handleUpdateSuggestion}
              onGenerateAI={handleGenerateAI}
              onRequestFeedback={handleRequestFeedback}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-12 bg-surface">
              <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
                <Zap size={22} className="text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-400">No cue selected</p>
                <p className="text-xs text-slate-600 mt-1 max-w-xs">
                  Hover a script line and click <span className="text-amber font-medium">+</span> to add a cue, or select an existing one from the bar below.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cue Stack Bar */}
      <div className="shrink-0 h-11 bg-surface border-t border-border flex items-center px-4 gap-3 overflow-x-auto custom-scroll z-10">
        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em] shrink-0 pr-3 border-r border-border font-mono">
          Stack
        </span>
        <div className="flex items-center gap-1.5">
          {sortedCues.map((cue) => (
            <button
              key={cue.id}
              onClick={() => setSelectedCueId(cue.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all shrink-0 border ${
                selectedCueId === cue.id
                  ? 'bg-amber text-bg border-amber'
                  : 'bg-card text-slate-400 border-border hover:border-border-strong hover:text-slate-200'
              }`}
              style={selectedCueId === cue.id ? { boxShadow: '0 0 10px rgba(76,198,254,0.3)' } : undefined}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  selectedCueId === cue.id ? 'bg-bg/60' : STATUS_DOT[cue.status]
                }`}
              />
              Q{displayCueNumber(cue.cueNumber)}
            </button>
          ))}
          {sortedCues.length === 0 && (
            <span className="text-[11px] text-slate-700 italic font-mono">No cues yet</span>
          )}
        </div>
      </div>

      {/* Share / Invite modal */}
      {isShareModalOpen && activeShow && user && (
        <ShareModal
          show={activeShow}
          user={user}
          onClose={() => setIsShareModalOpen(false)}
          onTokenRotated={handleTokenRotated}
        />
      )}

      {/* Feedback request modal */}
      {feedbackCueId && activeShow && (
        <FeedbackRequestModal
          showId={activeShow.id}
          cueId={feedbackCueId}
          cueNumber={activeShow.cues.find((c) => c.id === feedbackCueId)?.cueNumber ?? 0}
          onClose={() => setFeedbackCueId(null)}
        />
      )}
    </div>
  )
}

export default App
