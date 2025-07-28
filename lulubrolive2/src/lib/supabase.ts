import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types'; // 타입 정의 파일 import

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey);

// Supabase 테이블 타입 정의 (이 파일에 직접 포함하거나 별도 파일로 관리)
// 예시:
// export type Database = {
//   public: {
//     Tables: {
//       rooms: { /* ... */ };
//       room_users: { /* ... */ };
//       messages: { /* ... */ };
//     };
//     // ... 기타 스키마 정보
//   };
// };
