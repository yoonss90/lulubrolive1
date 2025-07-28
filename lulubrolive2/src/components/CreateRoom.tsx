import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { isValidYouTubeUrl } from '../utils/youtube';
import { ArrowLeft, Plus, Loader2, AlertCircle } from 'lucide-react';

interface CreateRoomProps {
  onBack: () => void;
}

// 임시 인증 키 (실제 운영 시에는 더 안전한 방법 사용)
const TEMP_AUTH_KEY = 'lulubrolivekey'; 

export function CreateRoom({ onBack }: CreateRoomProps) {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 입력값 검증
    if (!roomName.trim()) {
      setError('방 이름을 입력해주세요.');
      setLoading(false);
      return;
    }
    if (!username.trim()) {
      setError('사용자명을 입력해주세요.');
      setLoading(false);
      return;
    }
    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError('올바른 YouTube URL을 입력해주세요.');
      setLoading(false);
      return;
    }
    if (authKey !== TEMP_AUTH_KEY) {
      setError('인증 키가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      // 방 생성 (Supabase)
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName.trim(),
          youtube_url: youtubeUrl.trim(),
          host_id: 'anonymous_host', // 인증 제거 후 익명 호스트 ID 사용
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // 호스트 사용자 정보 추가 (Supabase)
      const { error: userError } = await supabase
        .from('room_users')
        .insert({
          room_id: room.id,
          user_id: 'anonymous_host', // 호스트 ID와 동일하게 설정
          username: username.trim(),
          role: 'host',
          status: 'approved', // 호스트는 바로 승인
        });

      if (userError) throw userError;

      // 생성된 방으로 이동
      navigate(`/room/${room.id}`);
    } catch (err: any) {
      setError(err.message || '방 생성 중 오류가 발생했습니다.');
      console.error("Error creating room:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>돌아가기</span>
        </button>
        <h1 className="text-3xl font-bold text-white">새로운 방 만들기</h1>
        <p className="text-gray-400 mt-2">
          YouTube Live 스트림으로 새로운 방을 만들어보세요
        </p>
      </div>

      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              방 이름
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
              placeholder="예: 함께 보는 콘서트"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              사용자명 (호스트)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
              placeholder="방에서 사용할 이름"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              YouTube Live URL
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              YouTube Live 또는 일반 동영상 URL을 입력하세요
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              인증 키
            </label>
            <input
              type="password"
              value={authKey}
              onChange={(e) => setAuthKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
              placeholder="방 생성 인증 키"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              방을 만들기 위한 인증 키를 입력하세요 (lulubrolivekey)
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-900 border border-red-600 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                <div className="text-sm text-red-300">
                  {error}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                방 만들기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
