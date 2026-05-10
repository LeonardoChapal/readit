import type { Book } from './book'
import type { User } from './auth'

export interface Review {
  id: number
  title: string
  content: string
  score: number
  rating: number | null
  status: string
  created_at: string
  book: Book
  user: User
}

export interface ReviewCreate {
  book_id: number
  title: string
  content: string
}

export interface SearchResults {
  books: import('./book').Book[]
  reviews: Review[]
}
