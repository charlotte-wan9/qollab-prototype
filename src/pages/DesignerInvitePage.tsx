import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Drama, Loader2, Crown, CheckCircle2, Zap } from 'lucide-react'
import { joinShow } from '../services/memberService'
import { getDesignerInviteByToken, acceptDesignerInvite } from '../services/designerInviteService'
import { useSession } from '../hooks/useSession'
import AuthModal from '../components/AuthModal'

type PageState = 'loading' | 'error' | 'already_accepted' | 'owner' | 'already_member' | 'join'

export default function DesignerInvitePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, loading: sessionLoading } = useSession()

  const [invite, setInvite] = useState<{
    id: string; showId: string; showTitle: string; showOwnerId: string
    invitedEmail: string; acceptedAt: string | null
  } | null>(null)
  const [fetchError, setFetchError]   = useState('')
  const [pageState, setPageState]     = useState<PageState>('loading')
  const [joining, setJoining]         = useState(false)
  const [joinError, setJoinError]     = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const pendingJoin = useRef(false)

  // Step 1: resolve token
  useEffect(() => {
    if (!token) { setFetchError('Invalid invite link.'); setPageState('error'); return }
    getDesignerInviteByToken(token).then((inv) => {
      if (!inv) { setFetchError('This invite link is invalid or has expired.'); setPageState('error'); return }
      setInvite(inv)
    }).catch(() => { setFetchError('This invite link is invalid or has expired.'); setPageState('error') })
  }, [token])

  // Step 2: determine page state once we have invite + session
  useEffect(() => {
    if (!invite || sessionLoading) return

    if (invite.acceptedAt) { setPageState('already_accepted'); return }

    if (!user) { setPageState('join'); return }

    if (user.id === invite.showOwnerId) { setPageState('owner'); return }

    // Check if already a member with lighting_designer role — just go to join
    // (joinShow ignores duplicate via 23505 error code)
    setPageState('join')
  }, [invite, user, sessionLoading])

  // Auto-join after signing in
  useEffect(() => {
    if (user && pendingJoin.current) {
      pendingJoin.current = false
      doJoin()
    }
  }, [user])

  const doJoin = async () => {
    if (!invite || !user) return
    setJoining(true)
    setJoinError('')
    try {
      await joinShow(invite.showId, 'lighting_designer')
      await acceptDesignerInvite(invite.id)
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

  // ── Shared card ────────────────────────────────────────────────────────────
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

  if (pageState === 'loading') return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <Loader2 size={24} className="text-amber animate-spin" />
    </div>
  )

  if (pageState === 'error') return (
    <div className="h-screen bg-bg flex flex-col items-center justify-center gap-4">
      <p className="text-sm text-red">{fetchError}</p>
      <button onClick={() => navigate('/')} className="text-xs text-amber hover:underline">Go to workspace</button>
    </div>
  )

  if (pageState === 'already_accepted') return (
    <Card>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em]">Already accepted</p>
        <h1 className="font-display italic text-2xl font-semibold text-slate-100">{invite!.showTitle}</h1>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-approved/10 border border-approved/20">
        <CheckCircle2 size={14} className="text-approved shrink-0" />
        <span className="text-xs text-approved font-medium">You've already joined this show</span>
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

  if (pageState === 'owner') return (
    <Card>
      <div className="text-center space-y-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em]">You own this show</p>
        <h1 className="font-display italic text-2xl font-semibold text-slate-100">{invite!.showTitle}</h1>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber/10 border border-amber/20">
        <Crown size={14} className="text-amber shrink-0" />
        <span className="text-xs text-amber font-medium">You're already the owner</span>
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

  // ── Join form ──────────────────────────────────────────────────────────────
  return (
    <>
      <Card>
        <div className="text-center space-y-1 w-full">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.18em]">
            You're invited to co-design
          </p>
          <h1 className="font-display italic text-2xl font-semibold text-slate-100 leading-snug">
            {invite!.showTitle}
          </h1>
        </div>

        {/* Role badge — locked */}
        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber/10 border border-amber/20">
          <div className="w-8 h-8 rounded-lg bg-amber/20 flex items-center justify-center shrink-0">
            <Zap size={14} className="text-amber" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber">Lighting Designer</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Full access to cues, AI tools, and suggestions
            </p>
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
          {user ? 'Accept & Join Show' : 'Sign in to Accept'}
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
