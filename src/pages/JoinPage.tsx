import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Drama, Loader2, Crown, CheckCircle2, ChevronDown } from 'lucide-react'
import type { ShowRole } from '../types'
import { SHOW_ROLE_LABELS } from '../types'
import { getShowByInviteToken } from '../services/showService'
import { joinShow, getMyMembership } from '../services/memberService'
import { useSession } from '../hooks/useSession'
import AuthModal from '../components/AuthModal'

type PageState = 'loading' | 'error' | 'owner' | 'already_member' | 'join'

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, loading: sessionLoading } = useSession()

  const [show, setShow] = useState<{ id: string; title: string; ownerId: string } | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [pageState, setPageState] = useState<PageState>('loading')
  const [existingRole, setExistingRole] = useState<ShowRole | null>(null)
  const [selectedRole, setSelectedRole] = useState<ShowRole>('director')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const pendingJoin = useRef(false)

  // Step 1: Resolve the token (runs once)
  useEffect(() => {
    if (!token) { setFetchError('Invalid invite link.'); setPageState('error'); return }
    getShowByInviteToken(token)
      .then((s) => {
        if (!s) { setFetchError('This invite link is invalid or has expired.'); setPageState('error') }
        else setShow(s)
      })
      .catch(() => { setFetchError('This invite link is invalid or has expired.'); setPageState('error') })
  }, [token])

  // Step 2: Once we have both the show and the session, figure out which state to show
  useEffect(() => {
    if (!show) return
    if (sessionLoading) return

    if (!user) {
      // Not signed in — show the join form (will prompt auth on click)
      setPageState('join')
      return
    }

    // Signed in — check ownership and existing membership
    if (user.id === show.ownerId) {
      setPageState('owner')
      return
    }

    getMyMembership(show.id).then((membership) => {
      if (membership) {
        setExistingRole(membership.role)
        setPageState('already_member')
      } else {
        setPageState('join')
      }
    }).catch(() => setPageState('join'))
  }, [show, user, sessionLoading])

  // Auto-join after signing in via the auth modal
  useEffect(() => {
    if (user && pendingJoin.current) {
      pendingJoin.current = false
      doJoin()
    }
  }, [user])

  const doJoin = async () => {
    if (!show || !user) return
    setJoining(true)
    setJoinError('')
    try {
      await joinShow(show.id, selectedRole)
      navigate('/', { replace: true })
    } catch (e) {
      console.error(e)
      setJoinError('Could not join show. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const handleJoinClick = () => {
    if (!user) {
      pendingJoin.current = true
      setShowAuthModal(true)
      return
    }
    doJoin()
  }

  // ── Shared card shell ──────────────────────────────────────────────────────
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-8 flex flex-col items-center gap-6">
        <div
          className="w-12 h-12 rounded-2xl bg-amber flex items-center justify-center"
          style={{ boxShadow: '0 0 16px rgba(76,198,254,0.45), 0 2px 8px rgba(0,0,0,0.4)' }}
        >
          <Drama size={20} className="text-bg" />
        </div>
        {children}
      </div>
    </div>
  )

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="h-screen bg-bg flex items-center justify-center">
        <Loader2 size={24} className="text-amber animate-spin" />
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    return (
      <div className="h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red">{fetchError}</p>
        <button onClick={() => navigate('/')} className="text-xs text-amber hover:underline">
          Go to workspace
        </button>
      </div>
    )
  }

  // ── You own this show ──────────────────────────────────────────────────────
  if (pageState === 'owner') {
    return (
      <Card>
        <div className="text-center space-y-1">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em]">
            You own this show
          </p>
          <h1 className="font-display italic text-2xl font-semibold text-slate-100">
            {show!.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber/10 border border-amber/20">
          <Crown size={14} className="text-amber shrink-0" />
          <span className="text-xs text-amber font-medium">Lighting Designer · Owner</span>
        </div>
        <p className="text-xs text-slate-600 text-center">
          This is your invite link. Share it with your collaborators — you can't join your own show.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 rounded-xl bg-amber hover:bg-amber-bright text-bg text-sm font-semibold transition-all active:scale-95"
          style={{ boxShadow: '0 0 20px rgba(76,198,254,0.25)' }}
        >
          Go to workspace
        </button>
      </Card>
    )
  }

  // ── Already a member ───────────────────────────────────────────────────────
  if (pageState === 'already_member') {
    return (
      <Card>
        <div className="text-center space-y-1">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em]">
            You're already in
          </p>
          <h1 className="font-display italic text-2xl font-semibold text-slate-100">
            {show!.title}
          </h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-approved/10 border border-approved/20">
          <CheckCircle2 size={14} className="text-approved shrink-0" />
          <span className="text-xs text-approved font-medium">
            {existingRole ? SHOW_ROLE_LABELS[existingRole] : 'Collaborator'}
          </span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 rounded-xl bg-amber hover:bg-amber-bright text-bg text-sm font-semibold transition-all active:scale-95"
          style={{ boxShadow: '0 0 20px rgba(76,198,254,0.25)' }}
        >
          Go to workspace
        </button>
      </Card>
    )
  }

  // ── Join form ──────────────────────────────────────────────────────────────
  return (
    <>
      <Card>
        <div className="w-full text-center space-y-1">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em]">
            You're invited to
          </p>
          <h1 className="font-display italic text-2xl font-semibold text-slate-100">
            {show!.title}
          </h1>
        </div>

        <div className="w-full space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your Role
          </label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as ShowRole)}
              className="w-full appearance-none bg-surface border border-border rounded-xl px-4 py-2.5 pr-9 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber focus:border-amber transition-all cursor-pointer"
            >
              {(Object.entries(SHOW_ROLE_LABELS) as [ShowRole, string][])
                .filter(([value]) => value !== 'lighting_designer')
                .map(([value, label]) => (
                  <option key={value} value={value} className="bg-surface">{label}</option>
                ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {joinError && <p className="text-xs text-red w-full">{joinError}</p>}

        <button
          onClick={handleJoinClick}
          disabled={joining}
          className="w-full py-3 rounded-xl bg-amber hover:bg-amber-bright disabled:bg-raised disabled:text-slate-600 text-bg text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{ boxShadow: '0 0 20px rgba(76,198,254,0.25)' }}
        >
          {joining && <Loader2 size={14} className="animate-spin" />}
          {user ? 'Join Show' : 'Sign in to Join'}
        </button>

        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Go to workspace instead
        </button>
      </Card>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); pendingJoin.current = false }}
      />
    </>
  )
}
