import React from 'react';
import { RoomUser } from '../../types';
import { 
  Crown, 
  Star, 
  User, 
  UserCheck, 
  UserX, 
  Users, 
  MoreVertical,
  Shield,
  Clock
} from 'lucide-react';

interface UserListProps {
  users: RoomUser[];
  currentUser: RoomUser | null;
  onApproveUser: (userId: string) => void;
  onKickUser: (userId: string) => void;
  onMoveToWaiting: (userId: string) => void;
  onToggleCoHost: (userId: string, isCoHost: boolean) => void;
}

export function UserList({ 
  users, 
  currentUser, 
  onApproveUser, 
  onKickUser, 
  onMoveToWaiting,
  onToggleCoHost 
}: UserListProps) {
  // 호스트 또는 공동 호스트만 사용자 관리 가능
  const canManageUsers = currentUser?.role === 'host' || currentUser?.role === 'co-host';
  
  const waitingUsers = users.filter(u => u.status === 'waiting');
  const approvedUsers = users.filter(u => u.status === 'approved');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'co-host':
        return <Star className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const UserCard = ({ user, isWaiting = false }: { user: RoomUser; isWaiting?: boolean }) => (
    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3 overflow-hidden">
        {getRoleIcon(user.role)}
        <div className="flex-1 min-w-0">
          <span className="text-white font-medium truncate">{user.username}</span>
          {user.role !== 'guest' && (
            <span className="ml-2 text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded whitespace-nowrap">
              {user.role === 'host' ? '호스트' : '공동호스트'}
            </span>
          )}
        </div>
      </div>

      {canManageUsers && user.user_id !== currentUser?.user_id && (
        <div className="flex items-center space-x-1">
          {isWaiting ? (
            <button
              onClick={() => onApproveUser(user.user_id)}
              className="p-1 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-colors"
              title="승인"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          ) : (
            <>
              {/* 공동 호스트 지정/해제 (호스트만 가능) */}
              {user.role === 'guest' && currentUser?.role === 'host' && (
                <button
                  onClick={() => onToggleCoHost(user.user_id, true)}
                  className="p-1 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
                  title="공동호스트로 지정"
                >
                  <Shield className="h-4 w-4" />
                </button>
              )}
              
              {user.role === 'co-host' && currentUser?.role === 'host' && (
                <button
                  onClick={() => onToggleCoHost(user.user_id, false)}
                  className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded transition-colors"
                  title="공동호스트 해제"
                >
                  <User className="h-4 w-4" />
                </button>
              )}
              
              {/* 대기실로 이동 (호스트만 가능) */}
              {user.role !== 'host' && currentUser?.role === 'host' && (
                <button
                  onClick={() => onMoveToWaiting(user.user_id)}
                  className="p-1 text-yellow-400 hover:text-yellow-300 hover:bg-gray-600 rounded transition-colors"
                  title="대기실로 이동"
                >
                  <Clock className="h-4 w-4" />
                </button>
              )}
            </>
          )}
          
          {/* 강퇴 (호스트, 공동 호스트 가능) */}
          <button
            onClick={() => onKickUser(user.user_id)}
            className="p-1 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-colors"
            title="강퇴"
          >
            <UserX className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 대기실 사용자 */}
      {waitingUsers.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">
              대기실 ({waitingUsers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {waitingUsers.map(user => (
              <UserCard key={user.id} user={user} isWaiting={true} />
            ))}
          </div>
        </div>
      )}

      {/* 승인된 사용자 */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <UserCheck className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-white">
            참여자 ({approvedUsers.length})
          </h3>
        </div>
        <div className="space-y-2">
          {approvedUsers.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>
    </div>
  );
}
