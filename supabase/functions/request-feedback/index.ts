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
    const { show_id, cue_id, recipient_ids, message, app_url } = await req.json()
    if (!show_id || !cue_id || !recipient_ids?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller is a member of this show (owner or member)
    const { data: show } = await admin
      .from('shows')
      .select('id, title, owner_id')
      .eq('id', show_id)
      .single()

    if (!show) {
      return new Response(JSON.stringify({ error: 'Show not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isOwner = show.owner_id === userId
    if (!isOwner) {
      const { data: membership } = await admin
        .from('show_members')
        .select('role')
        .eq('show_id', show_id)
        .eq('user_id', userId)
        .maybeSingle()
      if (!membership) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Get cue number for the email
    const { data: cue } = await admin
      .from('cues')
      .select('cue_number')
      .eq('id', cue_id)
      .single()

    const cueLabel = cue
      ? (Number.isInteger(cue.cue_number) ? `Q${cue.cue_number}` : `Q${cue.cue_number.toFixed(1)}`)
      : 'a cue'

    // Get requester display name
    const { data: requesterProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()
    const requesterName = requesterProfile?.display_name ?? 'Your collaborator'

    const baseUrl = app_url ?? 'https://qollab.app'
    const showUrl = `${baseUrl}/`

    // Send email to each recipient
    const emailErrors: string[] = []
    for (const recipientId of recipient_ids as string[]) {
      const { data: { user: recipientUser } } = await admin.auth.admin.getUserById(recipientId)
      if (!recipientUser?.email) continue

      const { data: recipientProfile } = await admin
        .from('profiles')
        .select('display_name')
        .eq('id', recipientId)
        .single()
      const recipientName = recipientProfile?.display_name ?? recipientUser.email.split('@')[0]

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Qollab <onboarding@resend.dev>',
          to: recipientUser.email,
          subject: `${requesterName} wants your feedback on ${cueLabel} — "${show.title}"`,
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
            Feedback requested
          </p>
          <h1 style="margin:0 0 4px;color:#f1f5f9;font-size:22px;font-style:italic;font-weight:700;line-height:1.2;">
            ${show.title}
          </h1>
          <p style="margin:4px 0 0;color:#4CC6FE;font-size:13px;font-weight:600;">${cueLabel}</p>

          <p style="margin:20px 0;color:#94a3b8;font-size:14px;line-height:1.6;">
            Hi ${recipientName}, <strong style="color:#e2e8f0;">${requesterName}</strong> is asking for your feedback on lighting ${cueLabel} in <em>${show.title}</em>.
          </p>

          ${message ? `
          <div style="background:#0f0f17;border:1px solid #2a2a40;border-radius:10px;padding:14px 16px;margin:0 0 24px;">
            <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;font-style:italic;">"${message}"</p>
          </div>
          ` : ''}

          <a href="${showUrl}"
             style="display:inline-block;background:#4CC6FE;color:#0f0f17;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:12px;">
            Open in Qollab →
          </a>

          <p style="margin:24px 0 0;color:#475569;font-size:11px;">
            Go to your workspace and open <em>${show.title}</em> to leave your feedback.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid #2a2a40;">
          <p style="margin:0;color:#334155;font-size:11px;">
            You're receiving this because you're a collaborator on this show. If this seems wrong, you can ignore it.
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
        console.error(`Failed to email ${recipientUser.email}:`, err)
        emailErrors.push(recipientUser.email)
      }
    }

    // Store the feedback_request record
    await admin.from('feedback_requests').insert({
      cue_id,
      show_id,
      requester_id: userId,
      recipient_ids,
      message: message ?? '',
      email_sent_at: emailErrors.length < recipient_ids.length ? new Date().toISOString() : null,
    })

    if (emailErrors.length > 0 && emailErrors.length === recipient_ids.length) {
      return new Response(
        JSON.stringify({ warning: 'Request saved but all emails failed', errors: emailErrors }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
