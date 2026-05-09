import React, { useState } from 'react'
import { X, Bell, Send, CheckCircle2, Info } from 'lucide-react'

interface FeedbackRequestModalProps {
  showId: string
  cueId: string
  cueNumber: number
  onClose: () => void
}

function displayNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

const PLACEHOLDER_COLLABORATORS = [
  { id: 'c1', name: 'Director', role: 'Director' },
  { id: 'c2', name: 'Stage Manager', role: 'Stage Manager' },
  { id: 'c3', name: 'Choreographer', role: 'Choreographer' },
]

const FeedbackRequestModal: React.FC<FeedbackRequestModalProps> = ({
  cueNumber, onClose,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [message, setMessage]   = useState('')
  const [sent, setSent]         = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSend = () => {
    if (selected.size === 0) return
    setSent(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber/15 border border-amber/25 flex items-center justify-center">
              <Bell size={13} className="text-amber" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Request Feedback</p>
              <p className="text-[11px] text-slate-500">Cue Q{displayNum(cueNumber)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-raised transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll px-5 py-4 space-y-4">

          {sent ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 size={28} className="text-approved" />
              <p className="text-sm font-semibold text-approved">Feedback request noted!</p>
            </div>
          ) : (
            <>
              {/* Prototype notice */}
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber/8 border border-amber/20">
                <Info size={12} className="text-amber shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber/80 leading-relaxed">
                  In the full version, this sends email notifications to your collaborators.
                </p>
              </div>

              {/* Placeholder collaborators */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Who to notify
                </label>
                <div className="space-y-1">
                  {PLACEHOLDER_COLLABORATORS.map((c) => {
                    const checked = selected.has(c.id)
                    const initials = c.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggle(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                          checked
                            ? 'bg-amber/8 border-amber/30'
                            : 'bg-surface border-border hover:border-border-strong'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          checked ? 'bg-amber border-amber' : 'border-border'
                        }`}>
                          {checked && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-bg"/>
                            </svg>
                          )}
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-raised border border-border flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-slate-400">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200">{c.name}</p>
                          <p className="text-[11px] text-slate-500">{c.role}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Message <span className="text-slate-700 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add context — what are you unsure about?"
                  rows={3}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber resize-none custom-scroll"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="shrink-0 px-5 py-4 border-t border-border">
            <button
              onClick={handleSend}
              disabled={selected.size === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber hover:bg-amber-bright disabled:bg-raised disabled:text-slate-600 text-bg text-xs font-bold transition-all"
            >
              <Send size={13} />
              {selected.size > 0
                ? `Send to ${selected.size} member${selected.size === 1 ? '' : 's'}`
                : 'Select recipients'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackRequestModal
