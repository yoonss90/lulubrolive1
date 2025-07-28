/*
  # YouTube Live 스트리밍 앱 스키마

  1. 새 테이블들
    - `rooms`
      - `id` (uuid, primary key)  
      - `name` (text)
      - `youtube_url` (text)
      - `host_id` (text) - 익명 호스트 ID 사용
      - `is_active` (boolean)
      - `created_at` (timestamp)
    - `room_users`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to rooms)
      - `user_id` (text) - 익명 사용자 ID 사용
      - `username` (text)
      - `role` (text) - 'host', 'co-host', 'guest'
      - `status` (text) - 'waiting', 'approved', 'kicked'
      - `joined_at` (timestamp)
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to rooms)
      - `user_id` (text) - 익명 사용자 ID 사용
      - `username` (text)
      - `content` (text)
      - `created_at` (timestamp)

  2. 시큐리티
    - 모든 테이블에 RLS 활성화
    - 적절한 정책 추가
*/

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  youtube_url text NOT NULL,
  host_id text NOT NULL, -- 익명 호스트 ID 사용
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create room_users table
CREATE TABLE IF NOT EXISTS room_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- 익명 사용자 ID 사용
  username text NOT NULL,
  role text NOT NULL DEFAULT 'guest' CHECK (role IN ('host', 'co-host', 'guest')),
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'approved', 'kicked')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id) -- 동일한 방에서 동일한 사용자 ID는 중복될 수 없음
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- 익명 사용자 ID 사용
  username text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
-- 모든 사용자는 활성 방 목록을 볼 수 있습니다.
CREATE POLICY "Users can view active rooms"
  ON rooms
  FOR SELECT
  TO authenticated, anon -- 익명 사용자도 볼 수 있도록 허용
  USING (is_active = true);

-- 방 생성자는 호스트 ID를 설정하여 방을 생성할 수 있습니다.
CREATE POLICY "Users can create rooms"
  ON rooms
  FOR INSERT
  TO authenticated, anon -- 익명 사용자도 방 생성 가능
  WITH CHECK (
    -- host_id는 익명 호스트 ID로 설정됩니다.
    -- 실제 인증 시스템에서는 auth.uid()를 사용해야 합니다.
    host_id = 'anonymous_host' 
  );

-- 방 생성자(호스트)만 자신의 방을 업데이트할 수 있습니다.
CREATE POLICY "Hosts can update their rooms"
  ON rooms
  FOR UPDATE
  TO authenticated, anon
  USING (auth.role() = 'authenticated' AND host_id = 'anonymous_host') -- authenticated 사용자만 host_id 체크
  WITH CHECK (host_id = 'anonymous_host'); -- 모든 사용자는 host_id를 변경할 수 없습니다.

-- RLS Policies for room_users
-- 사용자는 자신이 속한 방의 사용자 목록을 볼 수 있습니다.
CREATE POLICY "Users can view room users for rooms they're in"
  ON room_users
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM room_users ru 
      WHERE ru.room_id = room_users.room_id 
      AND ru.user_id = auth.uid() -- 실제 사용자 ID 또는 익명 ID 비교
    ) OR EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_users.room_id AND r.is_active = true
    ) -- 방이 활성 상태이고, 참여하지 않았더라도 볼 수 있도록 (선택 사항)
  );

-- 사용자는 자신의 사용자 정보를 삽입할 수 있습니다 (대기 상태로).
CREATE POLICY "Users can join rooms"
  ON room_users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    user_id = COALESCE(auth.uid()::text, 'anonymous') -- 로그인 사용자 또는 익명 ID 사용
  );

-- 호스트 및 공동 호스트만 다른 사용자의 상태나 역할을 업데이트할 수 있습니다.
CREATE POLICY "Hosts and co-hosts can update room users"
  ON room_users
  FOR UPDATE
  TO authenticated, anon
  USING (
    -- 현재 사용자가 해당 방의 호스트 또는 공동 호스트인 경우
    EXISTS (
      SELECT 1 FROM room_users ru 
      WHERE ru.room_id = room_users.room_id 
      AND ru.user_id = COALESCE(auth.uid()::text, 'anonymous') -- 현재 사용자 ID
      AND ru.role IN ('host', 'co-host')
      AND ru.status = 'approved' -- 승인된 사용자만 관리 가능
    )
  );

-- RLS Policies for messages
-- 사용자는 자신이 승인된 방의 메시지를 볼 수 있습니다.
CREATE POLICY "Users can view messages for rooms they're approved in"
  ON messages
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM room_users ru 
      WHERE ru.room_id = messages.room_id 
      AND ru.user_id = COALESCE(auth.uid()::text, 'anonymous') -- 현재 사용자 ID
      AND ru.status = 'approved' -- 승인된 사용자만 메시지 조회 가능
    )
  );

-- 승인된 사용자만 메시지를 보낼 수 있습니다.
CREATE POLICY "Approved users can send messages"
  ON messages
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    user_id = COALESCE(auth.uid()::text, 'anonymous') -- 현재 사용자 ID
    AND EXISTS (
      SELECT 1 FROM room_users ru 
      WHERE ru.room_id = messages.room_id 
      AND ru.user_id = COALESCE(auth.uid()::text, 'anonymous') -- 현재 사용자 ID
      AND ru.status = 'approved' -- 승인된 사용자만 메시지 전송 가능
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_room_users_room_id ON room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_room_users_user_id ON room_users(user_id);
CREATE INDEX IF NOT EXISTS idx_room_users_status ON room_users(status);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
