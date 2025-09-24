import React, { useState } from 'react';
import { Play, Download, Share2, Loader, AlertCircle } from 'lucide-react';
import { VideoGenerationParams, GeneratedVideo } from '../types';
import { videoGenerationAPI } from '../api/videoGeneration';

export const VideoGenerationForm: React.FC = () => {
  const [params, setParams] = useState<VideoGenerationParams>({
    prompt: '',
    aspectRatio: '16:9',
    resolution: '720p',
    duration: 8,
    backgroundMusic: false,
  });

  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const aspectRatios = [
    { value: '16:9', label: '16:9 (Landscape)' },
    { value: '9:16', label: '9:16 (Portrait)' },
    { value: '1:1', label: '1:1 (Square)' },
  ];

  const resolutions = [
    { value: '480p', label: '480p' },
    { value: '720p', label: '720p (HD)' },
    { value: '1080p', label: '1080p (Full HD)' },
  ];

  const allowedDurations = [5, 10];

  const handleGenerate = async () => {
    if (!params.prompt.trim()) {
      setError('Please enter a video description');
      return;
    }

    setIsGenerating(true);
    setError('');
    setProgress(0);

    try {
      const response = await videoGenerationAPI.generateVideo(params);
      if (response.success && response.data) {
  let polling = true;
  let pollCount = 0;
  const maxPolls = 150; // ~5 minutes
  const pollInterval = 5000;
        const jobId = response.data.jobId;

        // Progress bar simulation
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 95) return 95;
            return prev + Math.random() * 2;
          });
        }, pollInterval);

        // Poll backend until job is completed and videoUrl is present
        const pollStatus = async () => {
          if (!polling || pollCount >= maxPolls) {
            clearInterval(interval);
            setIsGenerating(false);
            setError('Video generation timed out. Please try again.');
            return;
          }
          pollCount++;
          const statusResponse = await videoGenerationAPI.checkStatus(jobId);
          if (statusResponse.success && statusResponse.data) {
            if ((statusResponse.data.status === 'completed' || statusResponse.data.status === 'succeeded') && statusResponse.data.videoUrl) {
              setGeneratedVideo(statusResponse.data);
              setProgress(100);
              clearInterval(interval);
              setIsGenerating(false);
              polling = false;
              return;
            }
          }
          setTimeout(pollStatus, pollInterval);
        };
        pollStatus();
      }
    } catch (err) {
      setError('Failed to generate video. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedVideo?.videoUrl) {
      const a = document.createElement('a');
      a.href = generatedVideo.videoUrl;
      a.download = `generated-video-${generatedVideo.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleShare = async () => {
    if (generatedVideo?.videoUrl) {
      try {
        await navigator.share({
          title: 'Generated Video',
          text: generatedVideo.prompt,
          url: generatedVideo.videoUrl,
        });
      } catch (err) {
        navigator.clipboard.writeText(generatedVideo.videoUrl);
        alert('Video URL copied to clipboard!');
      }
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      {/* Main Generation Panel */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Text to Video AI</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prompt Input */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video Description
              </label>
              <textarea
                value={params.prompt}
                onChange={(e) => setParams({ ...params, prompt: e.target.value })}
                placeholder="Describe the video you want to generate. Be as detailed as possible..."
                rows={6}
                maxLength={2000}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {params.prompt.length}/2000 characters
                </span>
                {error && (
                  <span className="text-red-400 text-xs flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {error}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Options Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Generation Options</h3>
            
            {/* Aspect Ratio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Aspect Ratio
              </label>
              <select
                value={params.aspectRatio}
                onChange={(e) => setParams({ ...params, aspectRatio: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio.value} value={ratio.value} className="bg-gray-900">
                    {ratio.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resolution
              </label>
              <select
                value={params.resolution}
                onChange={(e) => setParams({ ...params, resolution: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {resolutions.map((res) => (
                  <option key={res.value} value={res.value} className="bg-gray-900">
                    {res.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </label>
                <select
                  value={params.duration}
                  onChange={(e) => setParams({ ...params, duration: parseInt(e.target.value) })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                >
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
              <div className="text-xs text-gray-500 mt-1">Frame Rate: 24 fps</div>
            </div>

            {/* Background Music */}
            {/*
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Background Music
              </label>
              <button
                onClick={() => setParams({ ...params, backgroundMusic: !params.backgroundMusic })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  params.backgroundMusic ? 'bg-cyan-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    params.backgroundMusic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            */}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !params.prompt.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating... {progress.toFixed(0)}%</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Generate Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Preview */}
      {(generatedVideo || isGenerating) && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            {isGenerating ? 'Generating Video...' : 'Generated Video'}
          </h3>
          
          {isGenerating ? (
            <div className="aspect-video bg-black/40 rounded-xl flex flex-col items-center justify-center">
              <Loader className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
              <div className="w-64 bg-white/10 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-300 text-sm">{progress.toFixed(0)}% Complete</p>
            </div>
          ) : (
            generatedVideo && (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    src={generatedVideo.videoUrl}
                    controls
                    className="w-full h-full object-cover"
                    poster={generatedVideo.thumbnailUrl}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{generatedVideo.prompt}</p>
                    <p className="text-gray-400 text-sm">
                      {generatedVideo.resolution} • {generatedVideo.aspectRatio} • {generatedVideo.duration}s
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDownload}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2 rounded-lg transition-all duration-200"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2 rounded-lg transition-all duration-200"
                      title="Share"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};