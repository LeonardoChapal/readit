import type { Book } from './book'

export interface Recommendation {
  id: number
  book: Book
  score: number
  reason_code: string | null
  was_clicked: boolean
}

export interface Tag {
  id: number
  name: string
}
