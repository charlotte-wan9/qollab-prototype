const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@qollab.app',
  user_metadata: { display_name: 'Demo User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

export function useSession() {
  return { session: null, user: DEMO_USER as any, loading: false }
}
