export interface Genre {
  id: number
  name: string
}

export interface Book {
  id: number
  title: string
  author: string
  year: number | null
  genre: Genre | null
}

export interface BookDetail extends Book {
  avg_rating: number | null
  rating_count: number
  tags: { id: number; name: string }[]
}

export interface BookCreate {
  title: string
  author: string
  year?: number
  genre_id?: number
}
