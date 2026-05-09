import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Landing page for Supabase email-confirmation links.
 * Supabase appends ?code=... to the redirect URL; we exchange it for a session
 * then send the user to the workspace.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth
      .exchangeCodeForSession(window.location.search)
      .finally(() => navigate('/', { replace: true }))
  }, [navigate])

  return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <p className="text-sm text-slate-500 animate-pulse">Confirming your email…</p>
    </div>
  )
}
