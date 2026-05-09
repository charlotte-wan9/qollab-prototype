import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

type AuthTab = 'sign-in' | 'sign-up'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: AuthTab
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'sign-in' }) => {
  const [tab, setTab] = useState<AuthTab>(defaultTab)

  // Sync tab whenever the modal is opened with a different defaultTab
  useEffect(() => {
    if (isOpen) setTab(defaultTab)
  }, [isOpen, defaultTab])
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const reset = () => {
    setDisplayName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const switchTab = (t: AuthTab) => {
    setTab(t)
    setError('')
    setSuccess('')
  }

  const handleSignIn = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      handleClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    if (!displayName.trim() || !email || !password) return
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() } },
      })
      if (error) throw error

      if (data.user && data.session) {
        // No email confirmation — upsert profile and close
        await supabase.from('profiles').upsert({
          id: data.user.id,
          display_name: displayName.trim(),
        })
        handleClose()
      } else {
        // Email confirmation required
        setSuccess('Check your inbox for a confirmation link.')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    !loading &&
    email.trim().length > 0 &&
    password.length > 0 &&
    (tab === 'sign-in' || (displayName.trim().length > 0 && confirmPassword.length > 0))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-slate-100">
            {tab === 'sign-in' ? 'Sign in to Qollab' : 'Create your account'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-raised transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['sign-in', 'sign-up'] as AuthTab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                tab === t
                  ? 'text-amber border-b-2 border-amber -mb-px'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'sign-in' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {success ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm font-medium text-approved">{success}</p>
              <p className="text-xs text-slate-500">Once confirmed, come back and sign in.</p>
              <button
                onClick={() => { setSuccess(''); switchTab('sign-in') }}
                className="text-xs text-amber hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              {tab === 'sign-up' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Shown to your collaborators"
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  autoFocus={tab === 'sign-in'}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && tab === 'sign-in') handleSignIn() }}
                  placeholder="you@example.com"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && tab === 'sign-in') handleSignIn() }}
                  placeholder={tab === 'sign-up' ? 'At least 6 characters' : ''}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber transition-all"
                />
              </div>

              {tab === 'sign-up' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSignUp() }}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber transition-all"
                  />
                </div>
              )}

              {error && <p className="text-xs text-red">{error}</p>}

              <button
                onClick={tab === 'sign-in' ? handleSignIn : handleSignUp}
                disabled={!canSubmit}
                className="w-full py-2.5 rounded-xl bg-amber hover:bg-amber-bright disabled:bg-raised disabled:text-slate-600 text-bg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{ boxShadow: loading ? 'none' : '0 0 20px rgba(76,198,254,0.15)' }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {tab === 'sign-in' ? 'Sign In' : 'Create Account'}
              </button>

              <p className="text-center text-xs text-slate-600">
                {tab === 'sign-in' ? (
                  <>No account?{' '}
                    <button className="text-amber hover:underline" onClick={() => switchTab('sign-up')}>
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>Have an account?{' '}
                    <button className="text-amber hover:underline" onClick={() => switchTab('sign-in')}>
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal
