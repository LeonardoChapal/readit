import type { Book } from './book'

export type ReadingStatus = 'want_to_read' | 'reading' | 'read'

export interface ReadingListEntry {
  id: number
  book_id: number
  status: ReadingStatus
  book: Book
}
