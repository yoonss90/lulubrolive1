export function extractVideoId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function createEmbedUrl(videoId: string): string {
  // 게스트는 제어 불가, 자동 재생, 볼륨 조절, 전체 화면만 가능
  // controls=0: 기본 컨트롤 숨김
  // disablekb=1: 키보드 컨트롤 비활성화
  // fs=0: 전체화면 버튼 숨김 (별도 버튼으로 처리)
  // modestbranding=1: YouTube 로고 최소화
  // rel=0: 관련 동영상 표시 안 함
  // enablejsapi=1: JavaScript API 사용 가능하게 설정 (볼륨 조절 등)
  // origin: 보안을 위해 현재 도메인 설정 (Vite 개발 서버 포트 고려)
  const origin = window.location.origin; 
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&enablejsapi=1&origin=${origin}`;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
