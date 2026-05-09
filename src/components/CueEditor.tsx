import React, { useState, useEffect, useRef } from 'react'
import {
  Cue, CueElement, CueStatus, ScriptBlock, Suggestion, SuggestionReply,
} from '../types'
import { FIXTURE_TYPES, GEL_PRESETS } from '../constants'
import {
  Trash2, Plus, Loader2, Wand2, Lock, Unlock, Info, Star,
  CheckCircle2, XCircle, Lightbulb, ImageIcon, MessageSquare,
  Palette, CornerDownRight, Send, Bell,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const STATUS_STYLES: Record<CueStatus, { label: string; cls: string }> = {
  draft:    { label: 'Draft',    cls: 'text-draft bg-raised border-border' },
  pending:  { label: 'Pending',  cls: 'text-pending bg-pending-bg border-pending/20' },
  approved: { label: 'Approved', cls: 'text-approved bg-approved-bg border-approved/20' },
}

// ─── CueEditor ────────────────────────────────────────────────────────────────

type Tab = 'lights' | 'ai' | 'suggestions' | 'notes'

interface CueEditorProps {
  cue: Cue
  scriptBlock: ScriptBlock | undefined
  canEdit: boolean
  currentUserName: string
  onUpdateCue: (id: string, updates: Partial<Cue>) => void
  onDeleteCue: (id: string) => void
  onAddElement: (cueId: string) => void
  onUpdateElement: (cueId: string, elId: string, updates: Partial<CueElement>) => void
  onDeleteElement: (cueId: string, elId: string) => void
  onAddSuggestion: (cueId: string, data: Omit<Suggestion, 'id' | 'cueId' | 'status' | 'createdAt' | 'replies'>) => void
  onUpdateSuggestion: (cueId: string, sugId: string, updates: Partial<Suggestion>) => void
  onGenerateAI: (cueId: string) => void
  onRequestFeedback: (cueId: string) => void
}

const CueEditor: React.FC<CueEditorProps> = ({
  cue, scriptBlock,
  canEdit,
  currentUserName,
  onUpdateCue, onDeleteCue,
  onAddElement, onUpdateElement, onDeleteElement,
  onAddSuggestion, onUpdateSuggestion,
  onGenerateAI,
  onRequestFeedback,
}) => {
  const [tab, setTab] = useState<Tab>('lights')
  const openSuggestions = cue.suggestions.filter((s) => s.status === 'open').length

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'lights',      label: 'Lights',   icon: <Lightbulb size={13} /> },
    { id: 'ai',          label: 'AI',        icon: <Wand2 size={13} /> },
    { id: 'suggestions', label: 'Feedback',  icon: <MessageSquare size={13} />, badge: openSuggestions || undefined },
    { id: 'notes',       label: 'Notes',     icon: <MessageSquare size={13} /> },
  ]

  return (
    <div className="h-full flex flex-col bg-surface overflow-hidden">

      {/* ── Cue header ── */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl bg-amber flex items-center justify-center text-bg font-bold text-base font-mono shrink-0"
              style={{ boxShadow: '0 0 18px rgba(76,198,254,0.40), 0 4px 12px rgba(0,0,0,0.4)' }}
            >
              {displayNum(cue.cueNumber)}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Q{displayNum(cue.cueNumber)}</span>
                {canEdit ? (
                  <StatusSelector
                    status={cue.status}
                    onChange={(s) => onUpdateCue(cue.id, { status: s })}
                  />
                ) : (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_STYLES[cue.status].cls}`}>
                    {STATUS_STYLES[cue.status].label}
                  </span>
                )}
                {!canEdit && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-raised px-1.5 py-0.5 rounded border border-border">
                    View only
                  </span>
                )}
              </div>
              {/* Designer confidence */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider font-mono">Confidence</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => canEdit && onUpdateCue(cue.id, { designerConfidence: n })}
                      disabled={!canEdit}
                      className={`transition-colors disabled:cursor-default ${n <= cue.designerConfidence ? 'text-amber' : 'text-slate-700'}`}
                    >
                      <Star size={12} fill={n <= cue.designerConfidence ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onGenerateAI(cue.id)}
                disabled={!!cue.isGenerating || cue.elements.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber/10 hover:bg-amber-muted text-amber text-[10px] font-bold uppercase tracking-wider border border-amber/20 hover:border-amber/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-mono"
              >
                {cue.isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                {cue.isGenerating ? 'Generating…' : 'Generate AI'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete cue Q${displayNum(cue.cueNumber)}? This cannot be undone.`)) {
                    onDeleteCue(cue.id)
                  }
                }}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red hover:bg-red-bg transition-all"
                title="Delete this cue"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Script context strip ── */}
      {scriptBlock && (
        <div className="shrink-0 px-4 py-2 bg-surface border-b border-border-soft">
          <p className="text-[10px] text-slate-600 font-medium uppercase tracking-wider mb-0.5">
            {scriptBlock.actLabel} · {scriptBlock.sceneLabel}
          </p>
          <p className="text-xs text-slate-500 leading-snug line-clamp-2">
            {scriptBlock.speaker && (
              <span className="font-semibold text-slate-400">{scriptBlock.speaker}: </span>
            )}
            {scriptBlock.lineText}
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="shrink-0 flex border-b border-border bg-card/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-all border-b-2 relative ${
              tab === t.id
                ? 'border-amber text-amber bg-amber-muted/30'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-raised/40'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {t.badge !== undefined && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-red text-bg text-[8px] font-bold flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        {tab === 'lights' && (
          <LightsTab
            cue={cue}
            canEdit={canEdit}
            onUpdateCue={onUpdateCue}
            onAddElement={onAddElement}
            onUpdateElement={onUpdateElement}
            onDeleteElement={onDeleteElement}
          />
        )}
        {tab === 'ai' && (
          <AITab cue={cue} canEdit={canEdit} onUpdateCue={onUpdateCue} onGenerateAI={onGenerateAI} />
        )}
        {tab === 'suggestions' && (
          <SuggestionsTab
            cue={cue}
            canEdit={canEdit}
            currentUserName={currentUserName}
            onAddSuggestion={onAddSuggestion}
            onUpdateSuggestion={onUpdateSuggestion}
            onRequestFeedback={onRequestFeedback}
          />
        )}
        {tab === 'notes' && (
          <NotesTab cue={cue} canEdit={canEdit} onUpdateCue={onUpdateCue} />
        )}
      </div>
    </div>
  )
}

// ─── Status Selector ──────────────────────────────────────────────────────────

function StatusSelector({ status, onChange }: { status: CueStatus; onChange: (s: CueStatus) => void }) {
  const st = STATUS_STYLES[status]
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as CueStatus)}
      className={`text-[10px] font-bold uppercase tracking-wider pl-2 pr-5 py-0.5 rounded-md border appearance-none cursor-pointer focus:outline-none ${st.cls}`}
      style={{ backgroundImage: 'none' }}
    >
      <option value="draft">Draft</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
    </select>
  )
}

// ─── Lights Tab ───────────────────────────────────────────────────────────────

function LightsTab({
  cue, canEdit,
  onUpdateCue, onAddElement, onUpdateElement, onDeleteElement,
}: {
  cue: Cue
  canEdit: boolean
  onUpdateCue: (id: string, updates: Partial<Cue>) => void
  onAddElement: (id: string) => void
  onUpdateElement: (cueId: string, elId: string, updates: Partial<CueElement>) => void
  onDeleteElement: (cueId: string, elId: string) => void
}) {
  return (
    <div className="p-4 space-y-4">
      {/* Timing — compact row at top */}
      <div className="bg-card border border-border rounded-xl px-3 py-2.5 space-y-2">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider font-mono">Timing</p>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: 'timingUp',   label: 'Fade Up' },
              { key: 'timingDown', label: 'Fade Down' },
              { key: 'delay',      label: 'Delay' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">{label}</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={cue[key]}
                  onChange={(e) => onUpdateCue(cue.id, { [key]: parseFloat(e.target.value) || 0 })}
                  disabled={!canEdit}
                  className="w-full bg-surface border border-border rounded-lg pl-2.5 pr-5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber font-mono disabled:opacity-50 disabled:cursor-default"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 pointer-events-none">s</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Elements */}
      {cue.elements.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-2xl py-10 flex flex-col items-center gap-3 text-slate-600">
          <Lightbulb size={22} />
          <p className="text-xs text-center">No light elements yet</p>
          {canEdit && (
            <button
              onClick={() => onAddElement(cue.id)}
              className="text-[11px] font-bold text-amber uppercase tracking-wider hover:text-amber-bright"
            >
              Add First Light
            </button>
          )}
        </div>
      ) : (
        cue.elements.map((el) => (
          <ElementCard
            key={el.id}
            element={el}
            cueId={cue.id}
            canEdit={canEdit}
            onUpdate={onUpdateElement}
            onDelete={onDeleteElement}
          />
        ))
      )}

      {canEdit && (
        <button
          onClick={() => onAddElement(cue.id)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border hover:border-amber/40 hover:bg-amber-glow text-slate-600 hover:text-amber text-xs font-semibold transition-all"
        >
          <Plus size={14} /> Add Light
        </button>
      )}
    </div>
  )
}

// ─── Gel Picker ───────────────────────────────────────────────────────────────

function GelPicker({
  onSelect,
  onClose,
}: {
  onSelect: (code: string, color: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 bg-panel border border-border rounded-xl shadow-2xl shadow-black/60 p-3 w-72 max-h-64 overflow-y-auto custom-scroll"
    >
      <button
        onClick={() => { onSelect('', '#ffffff'); onClose() }}
        className="mb-3 w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border hover:border-amber/40 hover:bg-amber-muted/20 text-slate-500 hover:text-slate-300 text-[11px] font-medium transition-colors"
      >
        <div className="w-4 h-4 rounded border border-border bg-white/10 shrink-0" />
        No gel (clear)
      </button>

      {GEL_PRESETS.map((group) => (
        <div key={group.brand} className="mb-3 last:mb-0">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-2 font-mono">{group.brand}</p>
          <div className="grid grid-cols-7 gap-1">
            {group.gels.map((gel) => (
              <button
                key={gel.code}
                onClick={() => { onSelect(gel.code, gel.color); onClose() }}
                title={`${gel.code} — ${gel.name}`}
                className="group relative flex flex-col items-center gap-0.5"
              >
                <div
                  className="w-7 h-7 rounded-md border-2 border-transparent group-hover:border-white/60 transition-all shadow-inner"
                  style={{ backgroundColor: gel.color }}
                />
                <span className="text-[8px] text-slate-600 group-hover:text-slate-400 font-mono leading-none">{gel.code}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Element Card ─────────────────────────────────────────────────────────────

function ElementCard({
  element, cueId, canEdit, onUpdate, onDelete,
}: {
  element: CueElement
  cueId: string
  canEdit: boolean
  onUpdate: (cueId: string, elId: string, updates: Partial<CueElement>) => void
  onDelete: (cueId: string, elId: string) => void
}) {
  const upd = (updates: Partial<CueElement>) => onUpdate(cueId, element.id, updates)
  const [showGelPicker, setShowGelPicker] = useState(false)

  const [localIntensity, setLocalIntensity] = useState(element.intensity)
  const parentIntensityRef = useRef(element.intensity)
  useEffect(() => {
    if (element.intensity !== parentIntensityRef.current) {
      parentIntensityRef.current = element.intensity
      setLocalIntensity(element.intensity)
    }
  }, [element.intensity])

  return (
    <div className="relative bg-card border border-border rounded-xl p-4 space-y-3 group">
      {/* Gel color accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: element.gelColor }}
      />

      {/* Header row */}
      <div className="flex items-center gap-2">
        <div className="relative shrink-0">
          <input
            type="color"
            value={element.gelColor}
            onChange={(e) => upd({ gelColor: e.target.value })}
            disabled={!canEdit}
            className="w-7 h-7 rounded-md cursor-pointer border border-border disabled:cursor-default disabled:opacity-60"
            title={canEdit ? 'Set custom gel colour' : undefined}
          />
        </div>
        <input
          type="text"
          value={element.label}
          onChange={(e) => upd({ label: e.target.value })}
          readOnly={!canEdit}
          className="flex-1 bg-transparent text-sm font-semibold text-slate-200 focus:outline-none focus:border-b focus:border-amber placeholder-slate-600 read-only:cursor-default"
          placeholder="Light label"
        />
        {canEdit && (
          <button
            onClick={() => onDelete(cueId, element.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red transition-all"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-2">
        {/* Fixture type */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Type</label>
          <select
            value={element.fixtureType}
            onChange={(e) => upd({ fixtureType: e.target.value })}
            disabled={!canEdit}
            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber disabled:opacity-50 disabled:cursor-default"
          >
            {FIXTURE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Gel code + picker */}
        <div className="space-y-1 relative">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Gel Code</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={element.gelCode}
              onChange={(e) => upd({ gelCode: e.target.value })}
              readOnly={!canEdit}
              placeholder="R27, L201…"
              className="flex-1 min-w-0 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber placeholder-slate-700 font-mono read-only:opacity-50 read-only:cursor-default"
            />
            {canEdit && (
              <button
                onClick={() => setShowGelPicker((v) => !v)}
                title="Open gel picker"
                className={`shrink-0 p-1.5 rounded-lg border transition-colors ${
                  showGelPicker
                    ? 'bg-amber-muted border-amber/40 text-amber'
                    : 'bg-surface border-border text-slate-500 hover:text-amber hover:border-amber/40'
                }`}
              >
                <Palette size={13} />
              </button>
            )}
          </div>
          {showGelPicker && canEdit && (
            <GelPicker
              onSelect={(code, color) => { upd({ gelCode: code, gelColor: color }) }}
              onClose={() => setShowGelPicker(false)}
            />
          )}
        </div>

        {/* Focus area */}
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Focus Area</label>
          <input
            type="text"
            value={element.focusArea}
            onChange={(e) => upd({ focusArea: e.target.value })}
            readOnly={!canEdit}
            placeholder="e.g. DSC — actor position, Stage Left wash"
            className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber placeholder-slate-700 read-only:opacity-50 read-only:cursor-default"
          />
        </div>

        {/* Intensity slider */}
        <div className="col-span-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Intensity</label>
            <span className="text-[10px] font-semibold text-amber font-mono">{localIntensity}%</span>
          </div>
          <div className="relative h-5 flex items-center">
            <div className="absolute inset-y-0 left-0 right-0 flex items-center">
              <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full bg-amber rounded-full"
                  style={{ width: `${localIntensity}%`, opacity: canEdit ? 1 : 0.5 }}
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={localIntensity}
              disabled={!canEdit}
              onChange={(e) => {
                const v = Number(e.target.value)
                setLocalIntensity(v)
                parentIntensityRef.current = v
                upd({ intensity: v })
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-default"
            />
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-md pointer-events-none z-10"
              style={{
                left: `calc(${localIntensity / 100} * (100% - 14px) + 7px)`,
                transform: 'translateX(-50%)',
                opacity: canEdit ? 1 : 0.5,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AI Tab ───────────────────────────────────────────────────────────────────

function AITab({
  cue, canEdit,
  onUpdateCue, onGenerateAI,
}: {
  cue: Cue
  canEdit: boolean
  onUpdateCue: (id: string, updates: Partial<Cue>) => void
  onGenerateAI: (id: string) => void
}) {
  return (
    <div className="p-4 space-y-5">
      {/* Description */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Description</h4>
          {canEdit && (
            <button
              onClick={() => onUpdateCue(cue.id, { aiDescriptionLocked: !cue.aiDescriptionLocked })}
              className={`flex items-center gap-1 text-[10px] font-semibold transition-colors px-2 py-1 rounded-md ${
                cue.aiDescriptionLocked
                  ? 'text-amber bg-amber-muted'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-raised'
              }`}
              title={cue.aiDescriptionLocked ? 'Unlock to allow AI regeneration' : 'Lock to preserve this description'}
            >
              {cue.aiDescriptionLocked ? <Lock size={11} /> : <Unlock size={11} />}
              {cue.aiDescriptionLocked ? 'Locked' : 'Lock'}
            </button>
          )}
        </div>

        {cue.isGenerating ? (
          <div className="h-32 rounded-xl border border-amber/20 bg-amber-muted/20 flex flex-col items-center justify-center gap-3 animate-pulse">
            <Loader2 size={18} className="animate-spin text-amber" />
            <p className="text-[10px] text-amber font-semibold uppercase tracking-wider">Generating description…</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <textarea
              value={cue.aiDescription}
              onChange={(e) => onUpdateCue(cue.id, { aiDescription: e.target.value })}
              readOnly={!canEdit}
              placeholder={canEdit ? 'Click Generate AI to get a plain-language description, or write your own…' : 'No description yet.'}
              rows={5}
              className="w-full bg-card border border-border rounded-xl px-3 py-3 text-xs leading-relaxed text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber resize-none custom-scroll read-only:opacity-70 read-only:cursor-default"
            />
            {cue.aiDescription && (
              <p className="text-[10px] text-slate-600 italic px-1">
                ✦ Prototype placeholder — not generated by AI
              </p>
            )}
          </div>
        )}

        {canEdit && !cue.aiDescription && !cue.isGenerating && (
          <button
            onClick={() => onGenerateAI(cue.id)}
            disabled={cue.elements.length === 0}
            className="w-full py-2.5 rounded-xl bg-amber/10 hover:bg-amber-muted text-amber text-[11px] font-bold uppercase tracking-wider border border-amber/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Generate Description
          </button>
        )}
      </section>

      {/* Visualization */}
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scene Visualization</h4>

        {cue.isGenerating ? (
          <div className="aspect-video rounded-xl border border-amber/20 bg-amber-muted/20 flex flex-col items-center justify-center gap-3 animate-pulse">
            <Loader2 size={22} className="animate-spin text-amber" />
            <p className="text-[11px] text-amber font-semibold uppercase tracking-wider">Visualizing scene…</p>
          </div>
        ) : cue.aiPreviewUrl ? (
          <div className="group relative rounded-xl border border-border bg-card overflow-hidden">
            <div className="relative">
              <img
                src={cue.aiPreviewUrl}
                alt="Scene visualization placeholder"
                className="w-full aspect-video object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 flex items-end justify-between">
                <p className="text-[10px] text-white/50 italic">✦ Prototype placeholder — not generated by AI</p>
                {canEdit && (
                  <button
                    onClick={() => onGenerateAI(cue.id)}
                    className="px-2.5 py-1 rounded-lg bg-black/40 text-white/60 hover:text-amber text-[10px] font-bold uppercase tracking-wider border border-white/10 hover:border-amber/40 transition-all opacity-0 group-hover:opacity-100"
                  >
                    Regenerate
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : canEdit ? (
          <button
            onClick={() => onGenerateAI(cue.id)}
            disabled={cue.elements.length === 0}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-amber/30 hover:bg-amber-glow flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-slate-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <ImageIcon size={22} className="group-hover:text-amber/50 transition-colors" />
            <p className="text-[11px] text-center">
              {cue.elements.length === 0
                ? 'Add lights first to generate a preview'
                : 'Click to generate a scene visualization'}
            </p>
          </button>
        ) : (
          <div className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-slate-700">
            <ImageIcon size={18} />
            <p className="text-[11px]">No visualization yet</p>
          </div>
        )}

        <div className="flex gap-2 p-3 bg-amber/5 rounded-xl border border-amber/15">
          <Info size={13} className="text-amber/60 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber/60 leading-relaxed">
            In this prototype, AI outputs are template-generated from your cue data — no API calls are made. The full version connects to Claude and Gemini for real descriptions and image previews.
          </p>
        </div>
      </section>
    </div>
  )
}

// ─── Suggestions Tab ──────────────────────────────────────────────────────────

function SuggestionsTab({
  cue, canEdit, currentUserName,
  onAddSuggestion, onUpdateSuggestion, onRequestFeedback,
}: {
  cue: Cue
  canEdit: boolean
  currentUserName: string
  onAddSuggestion: (cueId: string, data: Omit<Suggestion, 'id' | 'cueId' | 'status' | 'createdAt' | 'replies'>) => void
  onUpdateSuggestion: (cueId: string, sugId: string, updates: Partial<Suggestion>) => void
  onRequestFeedback: (cueId: string) => void
}) {
  const [form, setForm] = useState({ body: '', rationale: '', strength: 3 })
  const [showForm, setShowForm] = useState(false)

  const canSubmit = form.body.trim() && form.rationale.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onAddSuggestion(cue.id, { ...form, authorName: currentUserName })
    setForm({ body: '', rationale: '', strength: 3 })
    setShowForm(false)
  }

  const open     = cue.suggestions.filter((s) => s.status === 'open')
  const resolved = cue.suggestions.filter((s) => s.status !== 'open')

  return (
    <div className="p-4 space-y-4">

      {/* Header row with Request Feedback action */}
      {canEdit && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            {cue.suggestions.length} suggestion{cue.suggestions.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => onRequestFeedback(cue.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-amber hover:bg-amber/8 border border-border hover:border-amber/30 transition-all"
          >
            <Bell size={10} />
            Request feedback
          </button>
        </div>
      )}

      {cue.suggestions.length === 0 && !showForm ? (
        <div className="border-2 border-dashed border-border rounded-2xl py-8 flex flex-col items-center gap-3 text-slate-600">
          <MessageSquare size={20} />
          <p className="text-xs text-center max-w-[16rem]">
            No suggestions yet. Leave feedback on what you'd like to change or explore.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {open.map((s) => (
            <SuggestionCard
              key={s.id}
              suggestion={s}
              canEdit={canEdit}
              currentUserName={currentUserName}
              onUpdate={(updates) => onUpdateSuggestion(cue.id, s.id, updates)}
            />
          ))}
          {resolved.length > 0 && (
            <details className="group">
              <summary className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-slate-400 transition-colors py-1">
                {resolved.length} resolved suggestion{resolved.length !== 1 ? 's' : ''}
              </summary>
              <div className="space-y-2 mt-2">
                {resolved.map((s) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    canEdit={canEdit}
                    currentUserName={currentUserName}
                    onUpdate={(updates) => onUpdateSuggestion(cue.id, s.id, updates)}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Add suggestion form */}
      {showForm ? (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-raised text-[9px] font-bold text-slate-400 flex items-center justify-center uppercase shrink-0">
              {currentUserName[0]}
            </div>
            <span className="text-[11px] font-semibold text-slate-400">{currentUserName}</span>
          </div>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="What would you like to change or try?"
            rows={3}
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber resize-none"
          />
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Why? <span className="text-red font-bold">*</span>
            </label>
            <textarea
              value={form.rationale}
              onChange={(e) => setForm((f) => ({ ...f, rationale: e.target.value }))}
              placeholder="Explain your reasoning — this helps the designer understand your vision"
              rows={2}
              className={`w-full bg-surface border rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber resize-none ${
                !form.rationale.trim() ? 'border-red/40' : 'border-border'
              }`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">How strongly do you feel about this?</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f) => ({ ...f, strength: n }))}
                  className={`transition-colors ${n <= form.strength ? 'text-amber' : 'text-slate-700'}`}
                >
                  <Star size={16} fill={n <= form.strength ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-lg bg-raised text-slate-500 text-xs font-medium hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-[2] py-2 rounded-lg bg-amber hover:bg-amber-bright disabled:bg-raised disabled:text-slate-600 text-bg text-xs font-bold transition-all"
              title={!form.rationale.trim() ? 'Rationale is required' : undefined}
            >
              Add Suggestion
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border hover:border-amber/40 hover:bg-amber-glow text-slate-600 hover:text-amber text-xs font-semibold transition-all"
        >
          <Plus size={14} /> Add Suggestion
        </button>
      )}
    </div>
  )
}

function SuggestionCard({
  suggestion, canEdit, currentUserName,
  onUpdate,
}: {
  suggestion: Suggestion
  canEdit: boolean
  currentUserName: string
  onUpdate: (updates: Partial<Suggestion>) => void
}) {
  const isOpen     = suggestion.status === 'open'
  const isAccepted = suggestion.status === 'accepted'
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyBody, setReplyBody] = useState('')

  const handleReply = () => {
    if (!replyBody.trim()) return
    const newReply: SuggestionReply = {
      id: crypto.randomUUID(),
      authorName: currentUserName,
      body: replyBody.trim(),
      createdAt: new Date().toISOString(),
    }
    onUpdate({ replies: [...(suggestion.replies ?? []), newReply] })
    setReplyBody('')
    setShowReplyForm(false)
  }

  return (
    <div
      className={`rounded-xl border space-y-2 overflow-hidden ${
        isOpen
          ? 'bg-card border-border'
          : isAccepted
          ? 'bg-approved-bg border-approved/20 opacity-80'
          : 'bg-red-bg border-red/20 opacity-70'
      }`}
    >
      {/* Main suggestion body */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-raised text-[9px] font-bold text-slate-400 flex items-center justify-center uppercase shrink-0">
              {suggestion.authorName[0]}
            </div>
            <span className="text-[11px] font-semibold text-slate-300">{suggestion.authorName}</span>
            <span className="text-[10px] text-slate-600">{relativeTime(suggestion.createdAt)}</span>
          </div>
          <div className="flex gap-0.5 shrink-0">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                size={10}
                className={n <= suggestion.strength ? 'text-amber' : 'text-slate-700'}
                fill={n <= suggestion.strength ? 'currentColor' : 'none'}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{suggestion.body}</p>
        {suggestion.rationale && (
          <p className="text-[11px] text-slate-500 italic leading-relaxed">"{suggestion.rationale}"</p>
        )}

        {/* Action row */}
        {isOpen ? (
          <div className="flex gap-2 pt-1">
            {canEdit && (
              <>
                <button
                  onClick={() => onUpdate({ status: 'accepted' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-approved/10 text-approved text-[10px] font-bold border border-approved/20 hover:bg-approved/20 transition-colors"
                >
                  <CheckCircle2 size={11} /> Accept
                </button>
                <button
                  onClick={() => onUpdate({ status: 'rejected' })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red/10 text-red text-[10px] font-bold border border-red/20 hover:bg-red/20 transition-colors"
                >
                  <XCircle size={11} /> Reject
                </button>
              </>
            )}
            <button
              onClick={() => setShowReplyForm((v) => !v)}
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-500 text-[10px] font-semibold hover:text-slate-300 hover:bg-raised transition-colors"
            >
              <CornerDownRight size={11} /> Reply
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isAccepted ? 'text-approved' : 'text-red'}`}>
              {isAccepted ? '✓ Accepted' : '✗ Rejected'}
            </p>
            <button
              onClick={() => setShowReplyForm((v) => !v)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-slate-600 text-[10px] font-semibold hover:text-slate-400 transition-colors"
            >
              <CornerDownRight size={10} /> Reply
            </button>
          </div>
        )}
      </div>

      {/* Thread replies */}
      {(suggestion.replies ?? []).length > 0 && (
        <div className="border-t border-border/60 bg-surface/40 px-3 py-2 space-y-2">
          {(suggestion.replies ?? []).map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <div className="shrink-0 mt-0.5">
                <div className="w-4 h-4 rounded-full bg-raised text-[8px] font-bold text-slate-500 flex items-center justify-center uppercase">
                  {reply.authorName[0]}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold text-slate-400">{reply.authorName}</span>
                  <span className="text-[9px] text-slate-600">{relativeTime(reply.createdAt)}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="border-t border-border/60 bg-surface/40 px-3 py-2.5 space-y-2">
          <div className="flex items-center gap-2 pb-1">
            <div className="w-4 h-4 rounded-full bg-raised text-[8px] font-bold text-slate-500 flex items-center justify-center uppercase shrink-0">
              {currentUserName[0]}
            </div>
            <span className="text-[10px] text-slate-500">{currentUserName}</span>
          </div>
          <div className="flex gap-2">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              className="flex-1 bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber resize-none"
            />
            <button
              onClick={handleReply}
              disabled={!replyBody.trim()}
              className="shrink-0 self-end p-2 rounded-lg bg-amber hover:bg-amber-bright disabled:bg-raised disabled:text-slate-600 text-bg transition-all"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

function NotesTab({
  cue, canEdit,
  onUpdateCue,
}: {
  cue: Cue
  canEdit: boolean
  onUpdateCue: (id: string, updates: Partial<Cue>) => void
}) {
  return (
    <div className="p-4">
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notes</h4>
        <textarea
          value={cue.notes}
          onChange={(e) => onUpdateCue(cue.id, { notes: e.target.value })}
          readOnly={!canEdit}
          placeholder={canEdit ? 'Technical notes, blocking reminders, programmer instructions…' : 'No notes.'}
          rows={12}
          className="w-full bg-card border border-border rounded-xl px-3 py-3 text-xs leading-relaxed text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-amber resize-none custom-scroll read-only:opacity-70 read-only:cursor-default"
        />
      </div>
    </div>
  )
}

export default CueEditor
