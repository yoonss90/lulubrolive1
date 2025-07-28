import React, { useState, useRef, useEffect, useCallback } from 'react';
import { extractVideoId, createEmbedUrl } from '../../utils/youtube';
import { RoomUser } from '../../types';
import { Maximize, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  youtubeUrl: string;
  currentUser: RoomUser | null;
  isHostOrCoHost: boolean; // 호스트 또는 공동 호스트인지 여부
}

export function VideoPlayer({ youtubeUrl, currentUser, isHostOrCoHost }: VideoPlayerProps) {
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // 재생 상태
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null); // YouTube Player API 인스턴스 저장

  const videoId = extractVideoId(youtubeUrl);

  // YouTube Player API 로드 및 초기화
  useEffect(() => {
    const loadYouTubeIframeAPI = () => {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    };
    loadYouTubeIframeAPI();
  }, []);

  // Player API 로드 후 플레이어 인스턴스 생성
  useEffect(() => {
    if (!window.YT || !iframeRef.current || !videoId) return;

    playerRef.current = new window.YT.Player(iframeRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1, // 자동 재생
        mute: isMuted ? 1 : 0, // 음소거 상태 반영
        controls: 0, // 기본 컨트롤 숨김
        disablekb: 1, // 키보드 컨트롤 비활성화
        fs: 0, // 전체화면 버튼 숨김 (별도 버튼으로 처리)
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });

    return () => {
      // 컴포넌트 언마운트 시 플레이어 파괴
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [videoId, isMuted]); // isMuted 변경 시 플레이어 재생성

  // 플레이어 준비 완료 시
  const onPlayerReady = useCallback((event: any) => {
    // 초기 볼륨 설정
    event.target.setVolume(volume);
    setIsPlaying(true); // 자동 재생으로 인해 준비 완료 시 재생 중으로 간주
  }, [volume]);

  // 플레이어 상태 변경 시
  const onPlayerStateChange = useCallback((event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
    }
  }, []);

  // 볼륨 변경 핸들러
  const handleVolumeChange = (newVolume: number) => {
    const vol = Math.max(0, Math.min(100, newVolume)); // 0-100 범위 제한
    setVolume(vol);
    setIsMuted(vol === 0);
    if (playerRef.current) {
      playerRef.current.setVolume(vol);
      if (vol > 0 && isMuted) { // 음소거 해제 시
        playerRef.current.unMute();
      } else if (vol === 0) { // 음소거 시
        playerRef.current.mute();
      }
    }
  };

  // 음소거 토글 핸들러
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (playerRef.current) {
      if (newMutedState) {
        playerRef.current.mute();
        setVolume(0); // 볼륨도 0으로 설정
      } else {
        // 이전 볼륨으로 복원하거나 기본값 사용
        const currentVolume = volume > 0 ? volume : 50; 
        playerRef.current.unMute();
        playerRef.current.setVolume(currentVolume);
        setVolume(currentVolume);
      }
    }
  };

  // 재생/일시정지 핸들러 (호스트/공동 호스트만 가능)
  const handlePlayPause = () => {
    if (!isHostOrCoHost || !playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying); // UI 상태 업데이트
  };

  // 전체 화면 핸들러
  const handleFullscreen = () => {
    if (iframeRef.current?.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    } else if (iframeRef.current?.webkitRequestFullscreen) { // Safari
      iframeRef.current.webkitRequestFullscreen();
    } else if (iframeRef.current?.mozRequestFullScreen) { // Firefox
      iframeRef.current.mozRequestFullScreen();
    } else if (iframeRef.current?.msRequestFullscreen) { // IE11
      iframeRef.current.msRequestFullscreen();
    }
  };

  // YouTube URL이 유효하지 않은 경우
  if (!videoId) {
    return (
      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 shadow-lg">
        <p className="text-gray-400">올바르지 않은 YouTube URL입니다</p>
      </div>
    );
  }

  const embedUrl = createEmbedUrl(videoId);

  return (
    <div className="relative">
      {/* YouTube iframe */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen={false} // 별도 버튼으로 처리하므로 false
          title="YouTube Video Player"
        />
        
        {/* 게스트용 오버레이 (영상 제어 방지) */}
        {!isHostOrCoHost && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed z-10 flex items-center justify-center">
            {/* 게스트에게는 재생/일시정지 버튼을 보여주지 않음 */}
            {/* 볼륨 및 전체화면은 외부 컨트롤에서 처리 */}
          </div>
        )}
      </div>

      {/* 외부 컨트롤 */}
      <div className="mt-4 flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700 shadow-md">
        <div className="flex items-center space-x-3">
          {/* 재생/일시정지 버튼 (호스트/공동 호스트만) */}
          {isHostOrCoHost && (
            <button
              onClick={handlePlayPause}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}

          {/* 볼륨 컨트롤 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-24 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
              style={{
                background: `linear-gradient(to right, #ef4444 ${isMuted ? 0 : volume}%, #4b5563 ${isMuted ? 0 : volume}%)`
              }}
            />
          </div>
        </div>

        {/* 전체 화면 버튼 */}
        <button
          onClick={handleFullscreen}
          className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          cursor: pointer;
          margin-top: -6px; /* Center the thumb vertically */
        }
        .slider-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          cursor: pointer;
          border: none; /* Remove default border */
        }
        /* Style for the track */
        .slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 8px; /* Track height */
          background: linear-gradient(to right, #ef4444 ${isMuted ? 0 : volume}%, #4b5563 ${isMuted ? 0 : volume}%);
          border-radius: 4px;
          width: 96px; /* Width of the slider */
        }
      `}</style>
    </div>
  );
}
