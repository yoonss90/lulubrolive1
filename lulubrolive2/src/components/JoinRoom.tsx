import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Room } from '../types';
import { ArrowLeft, Users, Loader2, AlertCircle } from 'lucide-react';

interface JoinRoomProps {
  onBack: () => void;
}

export function JoinRoom({ onBack }: JoinRoomProps) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!username.trim()) {
      setError('사용자명을 입력해주세요.');
      return;
    }

    setJoiningRoom(roomId);
    setError('');

    try {
      // 사용자 이름과 방 ID를 사용하여 방 참여 시도
      // 실제 Supabase 연동 시, user_id 대신 임시 username을 사용할 수도 있습니다.
      // 여기서는 username만으로 참여를 시도하고, Supabase 테이블에 저장합니다.

      // 임시 사용자 정보 생성 (실제로는 로그인된 사용자 정보 사용)
      // const tempUserId = `temp_${Date.now()}`; // 임시 ID 생성

      const { error } = await supabase
        .from('room_users')
        .insert({
          room_id: roomId,
          // user_id: tempUserId, // 임시 사용자 ID 사용
          user_id: 'anonymous', // 익명 사용자로 처리
          username: username.trim(),
          role: 'guest',
          status: 'waiting', // 기본적으로 대기 상태
        });

      if (error) {
        // 이미 참여한 경우 (UNIQUE 제약 조건 위반 등)
        if (error.message.includes('duplicate key value violates unique constraint')) {
           // 이미 참여한 방이면 바로 이동
           navigate(`/room/${roomId}`);
           return;
        }
        throw error;
      }

      // 방으로 이동 (대기실 상태)
      navigate(`/room/${roomId}`);
    } catch (err: any) {
      setError(err.message || '방 참여 중 오류가 발생했습니다.');
      console.error("Error joining room:", err);
    } finally {
      setJoiningRoom(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">방 목록을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>돌아가기</span>
        </button>
        <h1 className="text-3xl font-bold text-white">방 참여하기</h1>
        <p className="text-gray-400 mt-2">
          활성화된 방 목록에서 참여할 방을 선택하세요
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          사용자명
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full max-w-md px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          placeholder="방에서 사용할 이름"
          required
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-900 border border-red-600 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-300">
              {error}
            </div>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-400 mb-2">
            활성화된 방이 없습니다
          </h3>
          <p className="text-gray-500">
            새로운 방이 생성될 때까지 기다려주세요
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-2">
                    {room.name}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">
                    {room.youtube_url}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    생성일: {new Date(room.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={joiningRoom === room.id || !username.trim()}
                  className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {joiningRoom === room.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    '참여하기'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
