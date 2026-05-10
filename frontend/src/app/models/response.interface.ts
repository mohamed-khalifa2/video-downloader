export interface ApiResponse {
  title: string
  totalItems: number
  items: Video[]
}

export interface Video {
  title: string
  duration: number
  thumbnail: string
  videoUrl: string
  formats: Format[]
}

export interface Format {
  format_id: string
  quality: string
  fps: number
  size: number
}