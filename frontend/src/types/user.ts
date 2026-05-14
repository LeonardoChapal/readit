export interface UserProfile {
  id: number
  username: string
  role: string
  created_at: string
  review_count: number
  comment_count: number
  follower_count: number
  following_count: number
}

export interface UserStats {
  avg_rating_given: number | null
  total_votes_received: number
  favorite_genre: string | null
}
