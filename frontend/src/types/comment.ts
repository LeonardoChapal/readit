import type { User } from './auth'

export interface Comment {
  id: number
  content: string
  status: string
  created_at: string
  user: User
  parent_comment_id: number | null
  review_id: number
}

export interface CommentNode extends Comment {
  replies: CommentNode[]
}
