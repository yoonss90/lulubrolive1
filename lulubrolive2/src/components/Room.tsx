import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Room as RoomType, RoomUser } from '../types';
import { VideoPlayer } from './room/VideoPlayer';
import { UserList } from './room/UserList';
import { Chat } from './room/Chat';
import { ArrowLeft, Settings, Loader2, AlertCircle } from 'lucide-react';

export function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  const [room, setRoom] = useState<RoomType | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 현재 사용자의 ID를 임시로 'anonymous_host' 또는 'anonymous'로 설정
  // 실제 인증 시스템이 있다면 로그인된 사용자의 ID를 사용해야 합니다.
  const currentUserId = 'anonymous'; // 임시 사용자 ID

  useEffect(() => {
    if (!roomId) return;
    fetchRoomAndUsers();
    subscribeToRoomChanges();
  }, [roomId]);

  const fetchRoomAndUsers = async () => {
    setLoading(true);
    setError('');
    try {
      // 방 정보 가져오기
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      if (!roomData) throw new Error('방을 찾을 수 없습니다.');
      setRoom(roomData);

      // 사용자 목록 가져오기
      const { data: usersData, error: usersError } = await supabase
        .from('room_users')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // 현재 사용자 찾기
      const current = usersData?.find(u => u.user_id === currentUserId) || null;
      setCurrentUser(current);

      if (!current) {
        // 방에 참여하지 않은 경우, 참여 시도 (username 입력 후)
        // 여기서는 일단 에러 메시지만 표시하고, 참여 로직은 JoinRoom에서 처리
        setError('이 방에 참여하지 않았습니다. 방 목록에서 참여해주세요.');
      }
    } catch (err: any) {
      setError(err.message || '방 정보를 불러오는 중 오류가 발생했습니다.');
      console.error("Error fetching room data:", err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRoomChanges = () => {
    const userSubscription = supabase
      .channel(`room_users:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_users',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setUsers(current => [...current, payload.new as RoomUser]);
          } else if (payload.eventType === 'UPDATE') {
            setUsers(current => 
              current.map(u => 
                u.id === payload.new.id ? payload.new as RoomUser : u
              )
            );
            // 현재 사용자 정보 업데이트
            if (payload.new.user_id === currentUserId) {
              setCurrentUser(payload.new as RoomUser);
            }
          } else if (payload.eventType === 'DELETE') {
            setUsers(current => current.filter(u => u.id !== payload.old.id));
            // 본인이 강퇴된 경우
            if (payload.old.user_id === currentUserId) {
              navigate('/'); // 홈으로 이동
            }
          }
        }
      )
      .subscribe();

    // TODO: Add subscription for messages if needed for real-time updates

    return () => {
      supabase.removeChannel(userSubscription);
      // supabase.removeChannel(messageSubscription); // if added
    };
  };

  // 관리자 기능 (호스트/공동 호스트만 사용 가능)
  const handleApproveUser = async (userId: string) => {
    if (!currentUser || (currentUser.role !== 'host' && currentUser.role !== 'co-host')) return;
    try {
      await supabase.from('room_users').update({ status: 'approved' }).eq('room_id', roomId!).eq('user_id', userId);
    } catch (err) { console.error("Error approving user:", err); }
  };

  const handleKickUser = async (userId: string) => {
    if (!currentUser || (currentUser.role !== 'host' && currentUser.role !== 'co-host')) return;
    try {
      await supabase.from('room_users').delete().eq('room_id', roomId!).eq('user_id', userId);
    } catch (err) { console.error("Error kicking user:", err); }
  };

  const handleMoveToWaiting = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'host') return; // 공동 호스트는 이동 불가
    try {
      await supabase.from('room_users').update({ status: 'waiting' }).eq('room_id', roomId!).eq('user_id', userId);
    } catch (err) { console.error("Error moving user to waiting:", err); }
  };

  const handleToggleCoHost = async (userId: string, isCoHost: boolean) => {
    if (!currentUser || currentUser.role !== 'host') return; // 호스트만 공동 호스트 지정/해제 가능
    try {
      await supabase.from('room_users').update({ role: isCoHost ? 'co-host' : 'guest' }).eq('room_id', roomId!).eq('user_id', userId);
    } catch (err) { console.error("Error toggling co-host:", err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-400">방을 불러오는 중...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">오류가 발생했습니다</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>홈으로 돌아가기</span>
        </button>
      </div>
    );
  }

  const isHostOrCoHost = currentUser?.role === 'host' || currentUser?.role === 'co-host';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>돌아가기</span>
          </button>
          
          {isHostOrCoHost && (
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-400">관리자 권한</span>
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-white">{room.name}</h1>
        <p className="text-gray-400 mt-1">
          참여자 {users.filter(u => u.status === 'approved').length}명 
          {users.filter(u => u.status === 'waiting').length > 0 && 
            ` (대기중 ${users.filter(u => u.status === 'waiting').length}명)`
          }
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VideoPlayer 
            youtubeUrl={room.youtube_url} 
            currentUser={currentUser}
            isHostOrCoHost={isHostOrCoHost}
          />
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg">
            <UserList
              users={users}
              currentUser={currentUser}
              onApproveUser={handleApproveUser}
              onKickUser={handleKickUser}
              onMoveToWaiting={handleMoveToWaiting}
              onToggleCoHost={handleToggleCoHost}
            />
          </div>

          <Chat roomId={roomId!} currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}
