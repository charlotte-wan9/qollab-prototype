import React from 'react'
import { Drama, Zap, Users, FileText } from 'lucide-react'

interface LandingPageProps {
  onSignIn: () => void
  onSignUp: () => void
}

const FEATURES = [
  {
    icon: FileText,
    title: 'Script-first workflow',
    body: 'Load your script and place cues directly on lines, lyrics, and stage directions.',
  },
  {
    icon: Zap,
    title: 'AI-assisted design',
    body: 'Generate lighting descriptions and mood previews from your cue elements with Gemini.',
  },
  {
    icon: Users,
    title: 'Built for collaboration',
    body: 'Invite your director, stage manager, and choreographer to review and suggest changes.',
  },
]

const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp }) => {
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
          <button
            onClick={onSignIn}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-100 hover:bg-raised border border-border transition-all"
          >
            Sign In
          </button>
          <button
            onClick={onSignUp}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber hover:bg-amber-bright text-bg text-sm font-semibold transition-all active:scale-95"
            style={{ boxShadow: '0 0 20px rgba(76,198,254,0.3), 0 4px 12px rgba(0,0,0,0.3)' }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 overflow-y-auto custom-scroll">
        <section className="flex flex-col items-center justify-center text-center px-8 py-24 gap-8">
          {/* Glow orb */}
          <div className="relative">
            <div
              className="w-20 h-20 rounded-3xl bg-amber flex items-center justify-center"
              style={{ boxShadow: '0 0 60px rgba(76,198,254,0.5), 0 0 120px rgba(76,198,254,0.2), 0 4px 24px rgba(0,0,0,0.5)' }}
            >
              <Drama size={36} className="text-bg" />
            </div>
          </div>

          <div className="space-y-4 max-w-lg">
            <h1 className="font-display italic text-5xl font-semibold text-slate-100 leading-tight">
              Lighting design,{' '}
              <span className="text-amber">together.</span>
            </h1>
            <p className="text-base text-slate-500 leading-relaxed">
              Qollab is a pre-rehearsal collaboration tool for theatrical lighting designers.
              Map cues to your script, generate AI previews, and get feedback from your whole creative team — before you ever set foot in the theatre.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSignUp}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber hover:bg-amber-bright text-bg text-sm font-semibold transition-all active:scale-95"
              style={{ boxShadow: '0 0 24px rgba(76,198,254,0.35), 0 4px 16px rgba(0,0,0,0.3)' }}
            >
              Create free account
            </button>
            <button
              onClick={onSignIn}
              className="px-6 py-3 rounded-xl border border-border text-sm font-semibold text-slate-400 hover:text-slate-100 hover:border-border-strong transition-all"
            >
              Sign in
            </button>
          </div>
        </section>

        {/* Feature cards */}
        <section className="px-8 pb-20">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-muted border border-amber/20 flex items-center justify-center">
                  <Icon size={16} className="text-amber" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default LandingPage
