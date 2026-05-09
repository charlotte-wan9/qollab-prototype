export interface DesignerInvite {
  id: string
  showId: string
  invitedEmail: string
  token: string
  acceptedAt: string | null
  createdAt: string
}

export async function sendDesignerInvite(_showId: string, _email: string): Promise<void> {
  // Prototype: email invites are not functional
}

export async function getDesignerInvites(_showId: string): Promise<DesignerInvite[]> {
  return []
}

export async function revokeDesignerInvite(_inviteId: string): Promise<void> {}

export async function getDesignerInviteByToken(_token: string): Promise<null> {
  return null
}

export async function acceptDesignerInvite(_inviteId: string): Promise<void> {}
