/// <reference types="vite/client" />

// YouTube Player API 타입 정의
interface YouTubePlayer {
  new (elementId: string, options: object): any;
  new (element: HTMLElement, options: object): any;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    VIDEO_CUED: 5;
  };
  prototype: any;
}

interface Window {
  YT: {
    Player: YouTubePlayer;
    PlayerState: {
      UNSTARTED: -1;
      ENDED: 0;
      PLAYING: 1;
      PAUSED: 2;
      BUFFERING: 3;
      VIDEO_CUED: 5;
    };
  };
}
