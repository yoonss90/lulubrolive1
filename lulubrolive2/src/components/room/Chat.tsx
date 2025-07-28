import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Message, RoomUser } from '../../types';
import { Send, MessageCircle, Loader2, AlertCircle } from 'lucide-react';

interface ChatProps {
  roomId: string;
  currentUser: RoomUser | null;
}

export function Chat({ roomId, currentUser }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 현재 사용자가 승인되었는지 확인
  const isApproved = currentUser?.status === 'approved';

  useEffect(() => {
    if (!roomId || !isApproved) return; // 승인되지 않았으면 메시지 로드/구독 안 함

    fetchMessages();
    subscribeToMessages();
  }, [roomId, isApproved]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50); // 최근 50개 메시지 로드

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // 새 메시지가 도착하면 상태 업데이트
          setMessages(current => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription); // 구독 해제
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || loading || !isApproved) return;

    setLoading(true);
    try {
      await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: currentUser.user_id, // 현재 사용자의 ID 사용
          username: currentUser.username,
          content: newMessage.trim(),
        });
      setNewMessage(''); // 입력 필드 초기화
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 승인되지 않은 사용자는 채팅 UI를 다르게 표시
  if (!isApproved) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-lg flex flex-col justify-center items-center h-96">
        <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">
          승인을 기다리고 있습니다...
        </p>
        <p className="text-sm text-gray-500 mt-1 text-center">
          호스트가 승인하면 채팅에 참여할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-96 shadow-lg">
      {/* 채팅 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">채팅</h3>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center text-sm">
            아직 메시지가 없습니다. 첫 번째 메시지를 보내보세요!
          </p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-400">
                  {message.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-white text-sm pl-2 border-l-2 border-gray-600">
                {message.content}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            disabled={loading || !isApproved}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading || !isApproved}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
