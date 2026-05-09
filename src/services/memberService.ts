import type { ShowMember, ShowRole } from '../types'

export async function joinShow(_showId: string, _role: ShowRole): Promise<void> {}
export async function getMyMembership(_showId: string): Promise<null> { return null }
export async function getShowMembers(_showId: string): Promise<ShowMember[]> { return [] }
export async function getMyMemberships(): Promise<{ showId: string; role: ShowRole }[]> { return [] }
export async function updateMemberRole(_showId: string, _userId: string, _role: ShowRole): Promise<void> {}
export async function leaveShow(_showId: string): Promise<void> {}
export async function removeMember(_showId: string, _userId: string): Promise<void> {}
