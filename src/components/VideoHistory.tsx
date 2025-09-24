import React, { useEffect, useState } from 'react';
import { Play, Download, Trash2, Calendar, Clock, Ratio as AspectRatio } from 'lucide-react';
import { GeneratedVideo } from '../types';
import { videoGenerationAPI } from '../api/videoGeneration';

export const VideoHistory: React.FC = () => {
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await videoGenerationAPI.getHistory();
      if (response.success && response.data) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        await videoGenerationAPI.deleteVideo(videoId);
        setVideos(videos.filter(video => video.id !== videoId));
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(null);
        }
      } catch (error) {
        console.error('Failed to delete video:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-gray-400">Loading your video history...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Video History</h2>
        <p className="text-gray-400">Your previously generated videos ({videos.length})</p>
      </div>

      {videos.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
          <Play className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No videos generated yet</h3>
          <p className="text-gray-400">Start creating amazing videos with AI!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedVideo(video)}
                >
                  <div className="aspect-video relative">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}s
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <p className="text-white font-medium text-sm line-clamp-2 mb-2">
                      {video.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{video.resolution}</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video Player */}
          <div className="lg:col-span-1">
            {selectedVideo ? (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sticky top-6">
                <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
                  <video
                    src={selectedVideo.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={selectedVideo.thumbnailUrl}
                    key={selectedVideo.id}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white line-clamp-2">
                    {selectedVideo.prompt}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-300">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(selectedVideo.createdAt)}
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Clock className="w-4 h-4 mr-2" />
                      {selectedVideo.duration} seconds
                    </div>
                    <div className="flex items-center text-gray-300">
                      <AspectRatio className="w-4 h-4 mr-2" />
                      {selectedVideo.resolution} • {selectedVideo.aspectRatio}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-4 border-t border-white/10">
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = selectedVideo.videoUrl;
                        a.download = `video-${selectedVideo.id}.mp4`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleDelete(selectedVideo.id)}
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 p-2 rounded-lg transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center sticky top-6">
                <Play className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a video to preview</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};