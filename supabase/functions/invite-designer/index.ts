import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Decode the JWT payload to extract the user's `sub` (UUID).
 *  verify_jwt: true already validates the signature at the gateway level,
 *  so we only need to read the payload — no extra network call required. */
function getUserIdFromJwt(authHeader: string | null): string | null {
  try {
    const jwt = authHeader?.replace('Bearer ', '')
    if (!jwt) return null
    const [, payload] = jwt.split('.')
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded.sub ?? null
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { show_id, email, app_url } = await req.json()
    if (!show_id || !email) {
      return new Response(JSON.stringify({ error: 'Missing show_id or email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Decode caller's user ID directly from the JWT (no extra API round-trip)
    const userId = getUserIdFromJwt(req.headers.get('Authorization'))
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client (bypasses RLS for writing the invite)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller owns the show
    const { data: show } = await admin
      .from('shows')
      .select('id, title, owner_id')
      .eq('id', show_id)
      .single()

    if (!show || show.owner_id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get inviter display name
    const { data: profile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()
    const inviterName = profile?.display_name ?? email.split('@')[0] ?? 'Your collaborator'

    // Create the invite record
    const { data: invite, error: inviteErr } = await admin
      .from('designer_invites')
      .insert({ show_id, invited_email: email, invited_by: userId })
      .select()
      .single()

    if (inviteErr) throw inviteErr

    const baseUrl = app_url ?? 'http://localhost:5173'
    const joinUrl = `${baseUrl}/join-designer/${invite.token}`

    // Send email via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Qollab <onboarding@resend.dev>',
        to: email,
        subject: `${inviterName} invited you to co-design "${show.title}"`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0f0f17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:40px auto;padding:0 20px;">
    <tr><td>
      <div style="background:#1a1a2e;border:1px solid #2a2a40;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <div style="background:#1a1a2e;padding:32px 32px 24px;border-bottom:1px solid #2a2a40;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;background:#4CC6FE;border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <span style="color:#0f0f17;font-size:16px;font-weight:900;">Q</span>
            </div>
            <span style="color:#e2e8f0;font-size:15px;font-weight:700;letter-spacing:-0.3px;">Qollab</span>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;">
            You're invited as
          </p>
          <p style="margin:0 0 4px;color:#4CC6FE;font-size:13px;font-weight:700;">
            ✦ Lighting Designer
          </p>
          <h1 style="margin:12px 0 0;color:#f1f5f9;font-size:24px;font-style:italic;font-weight:700;line-height:1.2;">
            ${show.title}
          </h1>

          <p style="margin:20px 0 28px;color:#94a3b8;font-size:14px;line-height:1.6;">
            <strong style="color:#e2e8f0;">${inviterName}</strong> has invited you to collaborate on the lighting design for <em>${show.title}</em> in Qollab.
          </p>

          <a href="${joinUrl}"
             style="display:inline-block;background:#4CC6FE;color:#0f0f17;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:12px;">
            Accept Invitation →
          </a>

          <p style="margin:24px 0 0;color:#475569;font-size:11px;">
            Or copy this link: <span style="color:#64748b;">${joinUrl}</span>
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid #2a2a40;">
          <p style="margin:0;color:#334155;font-size:11px;">
            If you weren't expecting this, you can ignore it.
          </p>
        </div>
      </div>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    })

    if (!emailRes.ok) {
      const err = await emailRes.text()
      console.error('Resend error:', err)
      // Still return the invite token so the owner can share the link manually
      return new Response(
        JSON.stringify({ warning: 'Email failed but invite created', token: invite.token }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true, token: invite.token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
