// frontend/src/components/VideoPlayer.tsx

import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { Upload, Play, Pause, Volume2, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        alert("Please select a valid video file");
        return;
      }

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setFileName(file.name);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="w-full space-y-3">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              onEnded={handleVideoEnded}
              onClick={togglePlay}
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between text-white">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <span className="text-xs truncate max-w-[200px]">
                  {fileName}
                </span>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => videoRef.current?.requestFullscreen()}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <Upload className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">No video uploaded</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer"
            asChild
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {videoUrl ? "Change Video" : "Upload Video"}
            </span>
          </Button>
        </label>

        {videoUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
                setVideoUrl(null);
                setFileName("");
                setIsPlaying(false);
              }
            }}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
