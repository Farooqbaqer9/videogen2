export interface VideoGenerationParams {
  prompt: string;
  aspectRatio: string;
  resolution: string;
  duration: number;
  backgroundMusic: boolean;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  duration: number;
  aspectRatio: string;
  resolution: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}