import React from 'react'
import { Show, Cue, CueStatus } from '../types'
import { ChevronLeft, Printer } from 'lucide-react'

interface CueSheetProps {
  show: Show
  onBack: () => void
}

function displayNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

const STATUS_LABELS: Record<CueStatus, string> = {
  draft:    'Draft',
  pending:  'Pending',
  approved: 'Approved',
}

const CueSheet: React.FC<CueSheetProps> = ({ show, onBack }) => {
  const sortedCues = [...show.cues].sort((a, b) => a.cueNumber - b.cueNumber)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Toolbar — hidden on print */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Editor
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          <Printer size={15} />
          Print Cue Sheet
        </button>
      </div>

      {/* Printable content */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-900">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Lighting Cue Sheet</p>
          <h1 className="text-3xl font-bold text-gray-900">{show.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })} · {sortedCues.length} cue{sortedCues.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Stats summary */}
        <div className="flex gap-6 mb-8">
          {(['approved', 'pending', 'draft'] as CueStatus[]).map((s) => {
            const count = sortedCues.filter((c) => c.status === s).length
            return (
              <div key={s} className="text-center">
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{STATUS_LABELS[s]}</p>
              </div>
            )
          })}
        </div>

        {/* Cue table */}
        {sortedCues.length === 0 ? (
          <p className="text-gray-400 text-sm italic text-center py-12">No cues in this show yet.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-12">Q#</th>
                <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-48">Script Ref</th>
                <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-400">Description</th>
                <th className="text-left py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-28">Lights</th>
                <th className="text-center py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-16">Up</th>
                <th className="text-center py-2 pr-4 text-xs font-bold uppercase tracking-wider text-gray-400 w-16">Down</th>
                <th className="text-center py-2 text-xs font-bold uppercase tracking-wider text-gray-400 w-20">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedCues.map((cue, i) => {
                const block = show.scriptBlocks.find((b) => b.id === cue.scriptBlockId)
                const scriptRef = block
                  ? `${block.actLabel ? block.actLabel + ' / ' : ''}${block.sceneLabel}\n${block.speaker ? block.speaker + ': ' : ''}${
                      cue.selectionStart !== undefined
                        ? block.lineText.slice(cue.selectionStart, cue.selectionEnd)
                        : block.lineText
                    }`
                  : '—'

                const description = [cue.aiDescription, cue.notes].filter(Boolean).join('\n\n')

                return (
                  <CueRow
                    key={cue.id}
                    cue={cue}
                    scriptRef={scriptRef}
                    description={description}
                    isEven={i % 2 === 0}
                  />
                )
              })}
            </tbody>
          </table>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
          <span>Qollab · Collaborative Lighting Design</span>
          <span>{show.title}</span>
        </div>
      </div>
    </div>
  )
}

function CueRow({
  cue,
  scriptRef,
  description,
  isEven,
}: {
  cue: Cue
  scriptRef: string
  description: string
  isEven: boolean
}) {
  const statusStyle: Record<CueStatus, string> = {
    approved: 'bg-green-100 text-green-800',
    pending:  'bg-orange-100 text-orange-800',
    draft:    'bg-gray-100 text-gray-600',
  }

  return (
    <tr className={`border-b border-gray-100 ${isEven ? 'bg-white' : 'bg-gray-50/50'}`}>
      {/* Cue number */}
      <td className="py-3 pr-4 align-top">
        <span className="font-bold text-gray-900">Q{displayNum(cue.cueNumber)}</span>
      </td>

      {/* Script reference */}
      <td className="py-3 pr-4 align-top">
        <pre className="text-xs text-gray-600 font-sans whitespace-pre-wrap leading-relaxed">{scriptRef}</pre>
      </td>

      {/* Description */}
      <td className="py-3 pr-4 align-top">
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{description || '—'}</p>
      </td>

      {/* Light elements */}
      <td className="py-3 pr-4 align-top">
        <div className="space-y-1">
          {cue.elements.map((el) => (
            <div key={el.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-gray-200"
                style={{ background: el.gelColor }}
              />
              <span className="text-[11px] text-gray-600 leading-tight">
                {el.label}
                {el.gelCode && <span className="text-gray-400"> · {el.gelCode}</span>}
                <span className="text-gray-400"> {el.intensity}%</span>
              </span>
            </div>
          ))}
        </div>
      </td>

      {/* Timing */}
      <td className="py-3 pr-4 align-top text-center">
        <span className="text-xs text-gray-600">{cue.timingUp}s</span>
      </td>
      <td className="py-3 pr-4 align-top text-center">
        <span className="text-xs text-gray-600">{cue.timingDown}s</span>
      </td>

      {/* Status */}
      <td className="py-3 align-top text-center">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusStyle[cue.status]}`}>
          {STATUS_LABELS[cue.status]}
        </span>
      </td>
    </tr>
  )
}

export default CueSheet
