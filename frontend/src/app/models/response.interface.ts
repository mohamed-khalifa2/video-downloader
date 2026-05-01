export interface Format {
  format_id: string;
  quality: string;
  size: number;
  fps: number;
}

export interface Video {
  title: string;
  duration: number;
  thumbnail: string;
  videoUrl: string;
  formats: Format[];
}

export interface ApiResponse {
  title: string;
  page: number;
  totalItems: number;
  totalPages: number;
  items: Video[];
}