import React, { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Show, CueStatus, ShowRole, SHOW_ROLE_LABELS } from '../types'
import { Plus, Trash2, ChevronRight, Drama, Clock, Loader2, LogOutIcon } from 'lucide-react'

interface WorkspaceProps {
  shows: Show[]
  showsLoading?: boolean
  myMemberships?: { showId: string; role: ShowRole }[]
  user: User | null
  onCreateShow: () => void
  onOpenShow: (id: string) => void
  onDeleteShow: (id: string) => void
  onLeaveShow: (id: string) => void
  onAuthClick?: () => void
  onSignOut?: () => void
}

function formatRelativeDate(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getCueStats(cues: Show['cues']): Record<CueStatus, number> {
  const counts: Record<CueStatus, number> = { approved: 0, pending: 0, draft: 0 }
  for (const c of cues) counts[c.status]++
  return counts
}

function getAccentColor(stats: Record<CueStatus, number>, totalCues: number): string {
  if (totalCues === 0) return '#4CC6FE'
  if (stats.approved > 0 && stats.approved === totalCues) return '#4ADE80'
  if (stats.approved > 0) return '#A3E4B0'
  if (stats.pending > 0) return '#FB923C'
  return '#3A3A50'
}

const Workspace: React.FC<WorkspaceProps> = ({
  shows,
  showsLoading = false,
  myMemberships = [],
  user,
  onCreateShow,
  onOpenShow,
  onDeleteShow,
  onLeaveShow,
  onAuthClick,
  onSignOut,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const membershipMap = new Map(myMemberships.map((m) => [m.showId, m.role]))

  const displayName: string =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'You'

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setConfirmDeleteId(id)
  }

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirmDeleteId) {
      onDeleteShow(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-14 flex items-center justify-between px-8 bg-surface/90 backdrop-blur-sm amber-divider">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl bg-amber flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 16px rgba(76,198,254,0.45), 0 2px 8px rgba(0,0,0,0.4)' }}
          >
            <Drama size={15} className="text-bg" />
          </div>
          <span className="text-sm font-bold text-slate-100 tracking-tight">Qollab</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Prototype badge */}
          <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-semibold text-amber/70 bg-amber/8 border border-amber/20 uppercase tracking-wide">
            Prototype
          </span>
          {/* User badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-raised border border-border">
            <div className="w-6 h-6 rounded-lg bg-amber flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-bg">{initials}</span>
            </div>
            <span className="text-xs font-medium text-slate-300 max-w-[120px] truncate">
              {displayName}
            </span>
          </div>
          <button
            onClick={onCreateShow}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber hover:bg-amber-bright text-bg text-sm font-semibold transition-all active:scale-95"
            style={{ boxShadow: '0 0 20px rgba(76,198,254,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
          >
            <Plus size={15} />
            New Show
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto custom-scroll px-8 py-10">
        {showsLoading ? (
          <div className="flex items-center justify-center pt-20">
            <Loader2 size={22} className="text-amber animate-spin" />
          </div>
        ) : shows.length === 0 ? (
          <EmptyState onCreateShow={onCreateShow} />
        ) : (
          <div>
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em] mb-7">
              Your Shows — {shows.length}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shows.map((show) => {
                const stats = getCueStats(show.cues)
                const isConfirming = confirmDeleteId === show.id
                const accentColor = getAccentColor(stats, show.cues.length)
                const isOwned = show.ownerId === user?.id
                const memberRole = membershipMap.get(show.id)

                return (
                  <div
                    key={show.id}
                    onClick={() => { if (!isConfirming) onOpenShow(show.id) }}
                    style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
                    className="group relative bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-border-strong hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 flex flex-col gap-4 overflow-hidden"
                  >
                    {/* Card top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl italic font-semibold text-slate-100 leading-snug truncate">
                          {show.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Clock size={10} />
                            <span className="text-[11px]">{formatRelativeDate(show.updatedAt)}</span>
                          </div>
                          {/* Role badge */}
                          {isOwned ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber/10 text-amber border border-amber/20 uppercase tracking-wide">
                              Owner
                            </span>
                          ) : memberRole ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-raised text-slate-400 border border-border uppercase tracking-wide">
                              {SHOW_ROLE_LABELS[memberRole]}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Delete (owner) or Leave (member) button */}
                      {isOwned ? (
                        isConfirming ? (
                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button onClick={handleConfirmDelete} className="px-2.5 py-1 rounded-lg bg-red text-bg text-[11px] font-bold">Delete</button>
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }} className="px-2.5 py-1 rounded-lg bg-raised text-slate-400 text-[11px] font-medium">Cancel</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteClick(e, show.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red hover:bg-red-bg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); onLeaveShow(show.id) }}
                          title="Leave show"
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red hover:bg-red-bg transition-all"
                        >
                          <LogOutIcon size={14} />
                        </button>
                      )}
                    </div>

                    {/* Cue stats */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 font-mono">
                        {show.cues.length} cue{show.cues.length !== 1 ? 's' : ''}
                      </span>
                      {show.cues.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {stats.approved > 0 && (
                            <Pill color="approved" count={stats.approved} label="Approved" />
                          )}
                          {stats.pending > 0 && (
                            <Pill color="pending" count={stats.pending} label="Pending" />
                          )}
                          {stats.draft > 0 && (
                            <Pill color="draft" count={stats.draft} label="Draft" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Script line count */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-700 font-mono">
                        {show.scriptBlocks.length} script blocks
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-slate-700 group-hover:text-amber group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function Pill({
  color,
  count,
  label,
}: {
  color: 'approved' | 'pending' | 'draft'
  count: number
  label: string
}) {
  const styles = {
    approved: 'bg-approved/10 text-approved',
    pending:  'bg-pending/10 text-pending',
    draft:    'bg-raised text-slate-500',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold font-mono ${styles[color]}`}
      title={`${count} ${label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${color === 'approved' ? 'bg-approved' : color === 'pending' ? 'bg-pending' : 'bg-draft'}`} />
      {count}
    </span>
  )
}

function EmptyState({ onCreateShow }: { onCreateShow: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 pt-20">
      <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
        <Drama size={28} className="text-slate-600" />
      </div>
      <div className="text-center">
        <p className="font-display text-2xl italic font-semibold text-slate-300">No shows yet</p>
        <p className="text-sm text-slate-600 mt-2 max-w-xs leading-relaxed">
          Create your first production to start mapping lighting cues to your script.
        </p>
      </div>
      <button
        onClick={onCreateShow}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber hover:bg-amber-bright text-bg text-sm font-semibold transition-all active:scale-95"
        style={{ boxShadow: '0 0 20px rgba(76,198,254,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
      >
        <Plus size={16} />
        Create your first show
      </button>
    </div>
  )
}

export default Workspace
