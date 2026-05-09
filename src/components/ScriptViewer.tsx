import React, { useState, useRef, useCallback } from 'react'
import { ScriptBlock, Cue, ScriptBlockType } from '../types'
import { Plus, Highlighter, X } from 'lucide-react'

interface ScriptViewerProps {
  blocks: ScriptBlock[]
  cues: Cue[]
  selectedCueId: string | undefined
  canEdit?: boolean
  onAddCue: (scriptBlockId: string, selection?: { start: number; end: number }) => void
  onSelectCue: (cueId: string) => void
}

// ─── Helper: display cue number ───────────────────────────────────────────────

function displayNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

// ─── Block type styling ───────────────────────────────────────────────────────

const BLOCK_STYLE: Record<ScriptBlockType, string> = {
  act:             'pt-10 pb-2',
  scene:           'pt-6 pb-1',
  location:        'py-1',
  song_header:     'py-2',
  dialogue:        'py-1',
  lyric:           'py-0.5',
  stage_direction: 'py-1',
}

// ─── Rendered text with inline cue markers ────────────────────────────────────

function TextWithCues({
  block,
  cues,
  selectedCueId,
  onSelectCue,
}: {
  block: ScriptBlock
  cues: Cue[]
  selectedCueId: string | undefined
  onSelectCue: (id: string) => void
}) {
  const rangeCues = cues
    .filter(
      (c) =>
        c.scriptBlockId === block.id &&
        c.selectionStart !== undefined &&
        c.selectionEnd !== undefined,
    )
    .sort((a, b) => (a.selectionStart ?? 0) - (b.selectionStart ?? 0))

  if (rangeCues.length === 0) {
    return (
      <span data-block-id={block.id} className="select-text cursor-text">
        {block.lineText}
      </span>
    )
  }

  const parts: React.ReactNode[] = []
  let last = 0

  for (const cue of rangeCues) {
    const s = cue.selectionStart!
    const e = cue.selectionEnd!
    if (s > last) parts.push(<span key={`t-${last}`}>{block.lineText.slice(last, s)}</span>)

    const active = selectedCueId === cue.id
    parts.push(
      <span
        key={cue.id}
        onClick={(ev) => { ev.stopPropagation(); onSelectCue(cue.id) }}
        className={`relative inline cursor-pointer rounded-sm px-0.5 border-b-2 transition-all ${
          active
            ? 'bg-amber/20 border-amber text-slate-100'
            : 'bg-amber/8 border-amber/30 text-slate-300 hover:bg-amber/15'
        }`}
      >
        {block.lineText.slice(s, e)}
        <span
          className={`absolute -top-4 left-0 text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap shadow ${
            active ? 'bg-amber text-bg' : 'bg-panel text-amber border border-amber/30'
          }`}
        >
          Q{displayNum(cue.cueNumber)}
        </span>
      </span>,
    )
    last = Math.max(last, e)
  }

  if (last < block.lineText.length) {
    parts.push(<span key="tail">{block.lineText.slice(last)}</span>)
  }

  return (
    <span data-block-id={block.id} className="select-text cursor-text relative">
      {parts}
    </span>
  )
}

// ─── ScriptViewer ─────────────────────────────────────────────────────────────

const ScriptViewer: React.FC<ScriptViewerProps> = ({
  blocks,
  cues,
  selectedCueId,
  canEdit = true,
  onAddCue,
  onSelectCue,
}) => {
  const [textSelection, setTextSelection] = useState<{
    blockId: string
    start: number
    end: number
    rect: DOMRect
  } | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  const getCharOffset = (container: HTMLElement, node: Node, offset: number): number => {
    let total = 0
    const iter = document.createNodeIterator(container, NodeFilter.SHOW_TEXT)
    let cur: Node | null
    while ((cur = iter.nextNode())) {
      if (cur === node) return total + offset
      total += cur.textContent?.length ?? 0
    }
    return total
  }

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setTextSelection(null)
      return
    }
    const range = sel.getRangeAt(0)

    // Walk up to find the element with data-block-id
    let el = range.startContainer.parentElement
    while (el && !el.dataset.blockId) el = el.parentElement
    if (!el?.dataset.blockId) { setTextSelection(null); return }

    const blockId = el.dataset.blockId
    const start = getCharOffset(el, range.startContainer, range.startOffset)
    const end   = getCharOffset(el, range.endContainer,   range.endOffset)
    if (start >= end) { setTextSelection(null); return }

    setTextSelection({ blockId, start, end, rect: range.getBoundingClientRect() })
  }, [])

  if (blocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-600 text-sm bg-surface">
        No script loaded
      </div>
    )
  }

  return (
    <div
      ref={viewerRef}
      className="h-full overflow-y-auto custom-scroll bg-surface relative"
      onMouseUp={canEdit ? handleMouseUp : undefined}
      style={{ '--selection-bg': 'rgba(76,198,254,0.25)' } as React.CSSProperties}
    >
      <div className="max-w-2xl mx-auto px-8 pb-36 pt-8 space-y-0">
        <p className="text-[9px] font-semibold text-slate-700 uppercase tracking-[0.22em] mb-8 font-mono">
          Production Script
        </p>

        {blocks.map((block) => {
          const fullLineCues = cues.filter(
            (c) => c.scriptBlockId === block.id && c.selectionStart === undefined,
          )
          const canAddCue = canEdit && ['dialogue', 'lyric', 'stage_direction', 'location'].includes(block.type)

          return (
            <BlockRow
              key={block.id}
              block={block}
              cues={cues}
              fullLineCues={fullLineCues}
              canAddCue={canAddCue}
              selectedCueId={selectedCueId}
              onAddCue={onAddCue}
              onSelectCue={onSelectCue}
            />
          )
        })}
      </div>

      {/* Floating selection tooltip — only for editors */}
      {canEdit && textSelection && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: textSelection.rect.top - 48,
            left: textSelection.rect.left + textSelection.rect.width / 2,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="pointer-events-auto flex items-center gap-2 bg-panel border border-amber/40 rounded-xl px-3 py-2 shadow-2xl shadow-black/50">
            <Highlighter size={13} className="text-amber" />
            <span className="text-xs font-medium text-slate-300">Map selection</span>
            <button
              onClick={() => {
                if (!textSelection) return
                onAddCue(textSelection.blockId, {
                  start: textSelection.start,
                  end: textSelection.end,
                })
                setTextSelection(null)
                window.getSelection()?.removeAllRanges()
              }}
              className="px-2.5 py-1 rounded-lg bg-amber hover:bg-amber-bright text-bg text-[11px] font-bold transition-all active:scale-95"
            >
              <Plus size={11} className="inline mr-0.5 -mt-0.5" />
              Add cue
            </button>
            <button
              onClick={() => {
                setTextSelection(null)
                window.getSelection()?.removeAllRanges()
              }}
              className="p-0.5 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
          {/* Arrow */}
          <div className="w-2.5 h-2.5 bg-panel border-r border-b border-amber/40 rotate-45 mx-auto -mt-1.5" />
        </div>
      )}
    </div>
  )
}

// ─── BlockRow ─────────────────────────────────────────────────────────────────

function BlockRow({
  block,
  cues,
  fullLineCues,
  canAddCue,
  selectedCueId,
  onAddCue,
  onSelectCue,
}: {
  block: ScriptBlock
  cues: Cue[]
  fullLineCues: Cue[]
  canAddCue: boolean
  selectedCueId: string | undefined
  onAddCue: (id: string, sel?: { start: number; end: number }) => void
  onSelectCue: (id: string) => void
}) {
  const { type } = block

  // ── Act header ──
  if (type === 'act') {
    return (
      <div className={BLOCK_STYLE.act}>
        <div className="flex items-center gap-5">
          <span className="font-display text-2xl italic font-semibold text-amber/90 leading-none whitespace-nowrap">
            {block.lineText}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber/20 to-transparent" />
        </div>
      </div>
    )
  }

  // ── Scene header ──
  if (type === 'scene') {
    return (
      <div className={BLOCK_STYLE.scene}>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] font-mono">
          {block.lineText}
        </span>
      </div>
    )
  }

  // ── Location ──
  if (type === 'location') {
    return (
      <div className={`group flex items-baseline gap-2 ${BLOCK_STYLE.location}`}>
        <CueBadges cues={fullLineCues} selectedCueId={selectedCueId} onSelectCue={onSelectCue} />
        <span className="text-xs italic text-slate-500 flex-1">{block.lineText}</span>
        {canAddCue && (
          <AddCueBtn blockId={block.id} onAddCue={onAddCue} />
        )}
      </div>
    )
  }

  // ── Song header ──
  if (type === 'song_header') {
    return (
      <div className={`${BLOCK_STYLE.song_header} mt-5`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raised border border-border-strong">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {block.lineText}
          </span>
        </div>
      </div>
    )
  }

  // ── Stage direction ──
  if (type === 'stage_direction') {
    return (
      <div className={`group flex items-baseline gap-2 ${BLOCK_STYLE.stage_direction}`}>
        <CueBadges cues={fullLineCues} selectedCueId={selectedCueId} onSelectCue={onSelectCue} />
        <p className="text-sm italic text-slate-500 leading-relaxed flex-1">{block.lineText}</p>
        {canAddCue && (
          <AddCueBtn blockId={block.id} onAddCue={onAddCue} />
        )}
      </div>
    )
  }

  // ── Dialogue / Lyric ──
  const isLyric = type === 'lyric'
  return (
    <div className={`group grid grid-cols-[110px_1fr] gap-4 items-start ${BLOCK_STYLE.dialogue} ${isLyric ? 'pl-4' : ''}`}>
      {/* Left: speaker name + hover add button */}
      <div className="flex flex-col items-end gap-1 pt-0.5">
        {block.speaker && (
          <span className={`text-[10px] font-bold uppercase tracking-wider text-right leading-none ${isLyric ? 'text-slate-600' : 'text-amber/70'}`}>
            {block.speaker}
          </span>
        )}
        {canAddCue && (
          <AddCueBtn blockId={block.id} onAddCue={onAddCue} />
        )}
      </div>

      {/* Right: cue badges at the very start, then text */}
      <div className={`text-sm leading-relaxed ${isLyric ? 'italic text-slate-400' : 'text-slate-200'}`}>
        {fullLineCues.length > 0 && (
          <span className="inline-flex items-center gap-1 mr-1.5 align-middle translate-y-[-1px]">
            {fullLineCues.map((cue) => {
              const active = selectedCueId === cue.id
              return (
                <button
                  key={cue.id}
                  onClick={() => onSelectCue(cue.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                    active
                      ? 'bg-amber text-bg shadow-md shadow-amber/20'
                      : 'bg-raised text-amber border border-amber/20 hover:border-amber/50'
                  }`}
                >
                  Q{displayNum(cue.cueNumber)}
                </button>
              )
            })}
          </span>
        )}
        <TextWithCues
          block={block}
          cues={cues}
          selectedCueId={selectedCueId}
          onSelectCue={onSelectCue}
        />
      </div>
    </div>
  )
}

// ─── CueBadges — inline badges before text (location / stage_direction) ──────

function CueBadges({
  cues,
  selectedCueId,
  onSelectCue,
}: {
  cues: Cue[]
  selectedCueId: string | undefined
  onSelectCue: (id: string) => void
}) {
  if (cues.length === 0) return null
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      {cues.map((cue) => {
        const active = selectedCueId === cue.id
        return (
          <button
            key={cue.id}
            onClick={() => onSelectCue(cue.id)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
              active
                ? 'bg-amber text-bg shadow-md shadow-amber/20'
                : 'bg-raised text-amber border border-amber/20 hover:border-amber/50'
            }`}
          >
            Q{displayNum(cue.cueNumber)}
          </button>
        )
      })}
    </span>
  )
}

// ─── AddCueBtn — hover-only + button ─────────────────────────────────────────

function AddCueBtn({
  blockId,
  onAddCue,
}: {
  blockId: string
  onAddCue: (id: string) => void
}) {
  return (
    <button
      onClick={() => onAddCue(blockId)}
      className="opacity-0 group-hover:opacity-100 w-5 h-5 shrink-0 flex items-center justify-center rounded text-slate-600 hover:text-amber hover:bg-amber-muted transition-all"
      title="Add lighting cue"
    >
      <Plus size={13} />
    </button>
  )
}

export default ScriptViewer
