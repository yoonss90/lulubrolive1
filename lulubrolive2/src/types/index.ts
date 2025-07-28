export interface Room {
  id: string;
  name: string;
  youtube_url: string;
  host_id: string; // 익명 호스트 ID 사용
  is_active: boolean;
  created_at: string;
}

export interface RoomUser {
  id: string;
  room_id: string;
  user_id: string; // 익명 사용자 ID 또는 실제 사용자 ID
  username: string;
  role: 'host' | 'co-host' | 'guest';
  status: 'waiting' | 'approved' | 'kicked';
  joined_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string; // 익명 사용자 ID 또는 실제 사용자 ID
  username: string;
  content: string;
  created_at: string;
}

// Supabase 테이블 타입 정의 (자동 생성 또는 수동 정의)
export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at'>;
        Update: Partial<Room>;
      };
      room_users: {
        Row: RoomUser;
        Insert: Omit<RoomUser, 'id' | 'joined_at'>;
        Update: Partial<RoomUser>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Message>;
      };
    };
  };
};
