import { useAuth } from './useAuth'
import { api } from '../lib/api'

type ActivityType =
  | 'view_book' | 'write_review' | 'edit_review' | 'vote'
  | 'comment' | 'add_to_list' | 'change_list_status'
  | 'search' | 'click_recommendation'

interface ActivityPayload {
  activity_type: ActivityType
  entity_type?: string
  entity_id?: number
  metadata?: Record<string, unknown>
  session_id?: string
}

export function useActivity() {
  const { user } = useAuth()

  function track(payload: ActivityPayload) {
    if (!user) return
    api.post('/api/v1/activity', payload).catch(() => {})
  }

  return { track }
}
