import React, { useState } from 'react';
import { Plus, LogIn, Tv } from 'lucide-react';
import { CreateRoom } from './CreateRoom';
import { JoinRoom } from './JoinRoom';

export function Home() {
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  if (showCreateRoom) {
    return <CreateRoom onBack={() => setShowCreateRoom(false)} />;
  }

  if (showJoinRoom) {
    return <JoinRoom onBack={() => setShowJoinRoom(false)} />;
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-12">
        <div className="mx-auto h-24 w-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
          <Tv className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          YouTube Live 함께 보기
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          친구들과 함께 YouTube Live를 시청하고 실시간으로 채팅하세요
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-gray-600 transition-colors shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 bg-red-600 rounded-lg mb-4 mx-auto">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">방 만들기</h3>
          <p className="text-gray-400 mb-6">
            YouTube Live 스트림으로 새로운 방을 만들고 친구들을 초대하세요
          </p>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            방 만들기
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-gray-600 transition-colors shadow-lg">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4 mx-auto">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">방 참여하기</h3>
          <p className="text-gray-400 mb-6">
            기존 방에 참여해서 다른 사람들과 함께 스트림을 시청하세요
          </p>
          <button
            onClick={() => setShowJoinRoom(true)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            방 참여하기
          </button>
        </div>
      </div>

      <div className="mt-16 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-lg">
        <h4 className="text-lg font-semibold text-white mb-3">주요 기능</h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-400">
          <div>📺 YouTube Live 스트림 시청</div>
          <div>💬 실시간 채팅</div>
          <div>👥 대기실 및 승인 시스템</div>
          <div>🎯 호스트 및 공동호스트 권한</div>
          <div>🔧 사용자 관리 도구</div>
          <div>📱 반응형 디자인</div>
        </div>
      </div>
    </div>
  );
}
