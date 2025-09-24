import { VideoGenerationParams, GeneratedVideo, APIResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api'; // Python backend URL

export const videoGenerationAPI = {
  // Generate new video
  generateVideo: async (params: VideoGenerationParams): Promise<APIResponse<{ jobId: string }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return await response.json();
    } catch (error) {
      // Mock response for development
      return {
        success: true,
        data: { jobId: `job_${Date.now()}` }
      };
    }
  },

  // Check generation status
  checkStatus: async (jobId: string): Promise<APIResponse<GeneratedVideo>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
      return await response.json();
    } catch (error) {
      // Mock response for development
      return {
        success: true,
        data: {
          id: jobId,
          prompt: 'A cat playing in a garden',
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          thumbnailUrl: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=300',
          createdAt: new Date().toISOString(),
          duration: 8,
          aspectRatio: '16:9',
          resolution: '720p',
          status: 'completed'
        }
      };
    }
  },

  // Get user's video history
  getHistory: async (): Promise<APIResponse<GeneratedVideo[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/history`);
      return await response.json();
    } catch (error) {
      // Mock response for development
      const mockVideos: GeneratedVideo[] = [
        {
          id: '1',
          prompt: 'A majestic eagle soaring through mountain peaks at sunset',
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          thumbnailUrl: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=300',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          duration: 10,
          aspectRatio: '16:9',
          resolution: '1080p',
          status: 'completed'
        },
        {
          id: '2',
          prompt: 'Ocean waves crashing against rocky cliffs during a storm',
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          thumbnailUrl: 'https://images.pexels.com/photos/1367192/pexels-photo-1367192.jpeg?auto=compress&cs=tinysrgb&w=300',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          duration: 15,
          aspectRatio: '9:16',
          resolution: '720p',
          status: 'completed'
        },
        {
          id: '3',
          prompt: 'A bustling cyberpunk city street at night with neon lights',
          videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          thumbnailUrl: 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=300',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          duration: 12,
          aspectRatio: '16:9',
          resolution: '1080p',
          status: 'completed'
        },
      ];
      
      return {
        success: true,
        data: mockVideos
      };
    }
  },

  // Delete video
  deleteVideo: async (videoId: string): Promise<APIResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/video/${videoId}`, {
        method: 'DELETE',
      });
      return await response.json();
    } catch (error) {
      return { success: true };
    }
  }
};