import React, { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { X, Link, Copy, Check, Crown, Info } from 'lucide-react'
import { Show } from '../types'

interface ShareModalProps {
  show: Show
  user: User
  onClose: () => void
  onTokenRotated: (showId: string, newToken: string) => void
}

const ShareModal: React.FC<ShareModalProps> = ({ show, user, onClose }) => {
  const [copied, setCopied] = useState(false)

  const inviteUrl = show.inviteToken
    ? `${window.location.origin}/join/${show.inviteToken}`
    : null

  const displayName: string =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Demo User'

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Invite Collaborators</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">{show.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-raised transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5 space-y-6">

          {/* Prototype notice */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber/8 border border-amber/20">
            <Info size={13} className="text-amber shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber/80 leading-relaxed">
              This is a prototype — real-time collaboration and email invites are not active.
              Cue data is stored locally in your browser session.
            </p>
          </div>

          {/* Invite Link */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Link size={11} />
              Invite Link
            </label>

            {inviteUrl ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-slate-500 font-mono truncate opacity-60">
                  {inviteUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                    copied
                      ? 'bg-approved/10 text-approved border-approved/20'
                      : 'bg-raised text-slate-300 border-border hover:border-border-strong'
                  }`}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">No invite link available.</p>
            )}

            <p className="text-[11px] text-slate-600 leading-relaxed">
              In the full version, anyone with this link can join the show and choose their role.
            </p>
          </div>

          {/* Team */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Team — 1 person
            </label>

            <div className="space-y-1">
              {/* Owner row */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface border border-border">
                <div className="w-7 h-7 rounded-lg bg-amber/20 border border-amber/30 flex items-center justify-center shrink-0">
                  <Crown size={12} className="text-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200">
                    {displayName}
                    <span className="ml-1.5 text-[10px] font-normal text-slate-500">(you)</span>
                  </p>
                  <p className="text-[11px] text-amber">Lighting Designer · Owner</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 italic text-center py-3">
                Collaborators appear here in the full version.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ShareModal
