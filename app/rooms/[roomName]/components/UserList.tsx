import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Participant } from 'livekit-client';
import { useState, useEffect, useRef } from 'react';
import { Users, Crown, User, Ban, MicOff, VideoOff, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { getRequest } from '@/lib/ver-user';
import { delay } from 'framer-motion';


interface UserListProps {
  userPromission: String;
}

export function UserList({ userPromission }: UserListProps) {
  const params = useParams();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [adminName, setAdminName] = useState<string>('');

  // 计算有效的位置
  const calculateValidPosition = (x: number, y: number) => {
    if (!containerRef.current) return { x, y };
    
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const margin = 10;

    return {
      x: Math.min(Math.max(x, margin), windowWidth - containerWidth - margin),
      y: Math.min(Math.max(y, margin), windowHeight - containerHeight - margin)
    };
  };

  // 处理鼠标/触摸开始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    didDragRef.current = false;

    const point = 'touches' in e ? e.touches[0] : e;
    setDragStart({
      x: point.clientX - position.x,
      y: point.clientY - position.y
    });
  };

  // 处理点击/触摸事件
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!didDragRef.current) {
      setIsExpanded(prev => !prev);
    }
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (isDragging) {
        didDragRef.current = true;
        const point = 'touches' in e ? e.touches[0] : e;
        const newPosition = {
          x: point.clientX - dragStart.x,
          y: point.clientY - dragStart.y
        };
        
        const validPosition = calculateValidPosition(newPosition.x, newPosition.y);
        setPosition(validPosition);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    // 处理窗口大小改变
    const handleResize = () => {
      setPosition(prev => calculateValidPosition(prev.x, prev.y));
    };

    if (isDragging) {
      // 添加鼠标事件监听
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      // 添加触摸事件监听
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      // 防止触摸时页面滚动
      document.body.style.overflow = 'hidden';
    }

    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [isDragging, dragStart]);

  // 处理拉黑用户
  const handleBanUser = (participant: Participant) => {
    fetch(`/api/kickuser`, {
      method: 'POST',
      body: JSON.stringify({
        identity: participant.identity,
        roomName: params.roomName
      })
    }).then((res) => {
      toast({
        title: '拉黑用户成功' + participant.identity,
        variant: 'default',
      })
    }).catch((error) => {
      console.error('拉黑用户失败:', error);
      toast({
        title: '拉黑用户失败',
        variant: 'destructive',
      })
    })
  };

  // 渲染单个参与者
  const renderParticipant = (participant: Participant) => {
    const isLocal = participant.identity === localParticipant?.identity;
    const isRoomAdmin = adminName === participant.name;
    const handleMute = async (participant: Participant) => {
      const response = await fetch('/api/unmute_track', {
        method: 'POST',
        body: JSON.stringify({ roomName: params.roomName, participantName: participant.name, trackType: 'AUDIO' })
      });
      const data = await response.json();
      if(data.msg === 'success'){
        toast({
          title: '静音用户成功' + participant.name,
          variant: 'default',
        })
      }
    };
    return (
      <li 
        key={participant.identity} 
        className={`flex items-center gap-2 p-2 rounded transition-colors group
          ${isLocal ? 'bg-blue-500/20' : 'hover:bg-white/10'}`}
      >
        {/* 状态指示器 */}
        <div className="relative">
          <div className={`w-2 h-2 rounded-full ${
            participant.isSpeaking ? 'bg-green-500' : 'bg-gray-500'
          }`}/>
          {participant.isCameraEnabled && (
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </div>

        {/* 用户信息 */}
        <div className="flex-1 flex items-center gap-1 text-white">
          <span className="truncate">
            {participant.name || participant.identity}
          </span>
          {isLocal && (
            <span className="text-xs bg-blue-500/30 px-1.5 py-0.5 rounded">
              我
            </span>
          )}
          {isRoomAdmin && (
            <Crown className="w-4 h-4 text-yellow-500" />
          )}
        </div>

        {/* 状态图标 */}
        <div className="flex items-center gap-1">
          {participant.connectionQuality === 'poor' && (
            <span className="text-red-400 text-xs">信号差</span>
          )}
          {!participant.isMicrophoneEnabled && (
            <span className="text-red-400 text-xs">已静音</span>
          )}
        </div>

        {/* 操作按钮 - 只对非本地用户显示且需要管理员权限 */}
        {!isLocal && userPromission === 'admin' && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBanUser(participant);
              }}
              className="p-1 hover:bg-red-500/20 rounded"
              title="拉黑用户"
            >
              <Ban className="w-4 h-4 text-red-500" />
            </button>
            
            {participant.isMicrophoneEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMute(participant)
                }}
                className="p-1 hover:bg-yellow-500/20 rounded"
                title="静音用户"
              >
                <MicOff className="w-4 h-4 text-yellow-500" />
              </button>
            )}

            {participant.isCameraEnabled && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoMute(participant)
                }}
                className="p-1 hover:bg-yellow-500/20 rounded"
                title="禁用摄像头"
              >
                <VideoOff className="w-4 h-4 text-yellow-500" />
              </button>
            )}

            {(participant.isMicrophoneEnabled || participant.isCameraEnabled) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMuteAll(participant)
                }}
                className="p-1 hover:bg-red-500/20 rounded"
                title="禁用所有设备"
              >
                <XCircle className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  // 只在组件挂载时获取一次管理员信息
  useEffect(() => {
    const getRoomAdmin = async () => {
      try {
        const response = await getRequest('/get_admin_info', {
          admin_in_room_name: '',
          room_id: params.roomName
        });
        setAdminName(response.admin_in_room_name);
      } catch (error) {
        console.error('获取管理员信息失败:', error);
      }
    };

    getRoomAdmin();
  }, []); // 只在组件挂载时执行一次

  const handleVideoMute = async (participant: Participant) => {
    const response = await fetch('/api/unmute_track', {
      method: 'POST',
      body: JSON.stringify({ 
        roomName: params.roomName, 
        participantName: participant.name,
        trackType: 'VIDEO'
      })
    });
    const data = await response.json();
    if(data.msg === 'success'){
      toast({
        title: '已禁用摄像头 ' + participant.name,
        variant: 'default',
      })
    }
  };

  const handleMuteAll = async (participant: Participant) => {
    try {
      // 禁用麦克风
      await fetch('/api/unmute_track', {
        method: 'POST',
        body: JSON.stringify({ 
          roomName: params.roomName, 
          participantName: participant.name,
          trackType: 'AUDIO'
        })
      });
      await delay( async () => {
        // 禁用摄像头
        await fetch('/api/unmute_track', {
            method: 'POST',
            body: JSON.stringify({ 
            roomName: params.roomName, 
            participantName: participant.name,
            trackType: 'VIDEO'
            })
        });
      },1000);
      

      toast({
        title: '已禁用所有设备 ' + participant.name,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: '操作失败',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
        touchAction: 'none',
      }}
    >
      {isExpanded ? (
        <div 
          className="bg-black/90 rounded-lg shadow-md p-4 w-[400px] backdrop-blur-sm"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="flex items-center justify-between mb-4 cursor-move">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">
                参会者
              </h2>
              <span className="text-sm text-gray-400">
                ({participants.length})
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
            {/* 先显示本地用户 */}
            {participants
              .filter(p => p.identity === localParticipant?.identity)
              .map(renderParticipant)}
            
            {/* 再显示其他用户 */}
            {participants
              .filter(p => p.identity !== localParticipant?.identity)
              .map(renderParticipant)}
          </ul>
        </div>
      ) : (
        <button
          onClick={handleClick}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="bg-black/90 p-3 rounded-full shadow-lg hover:bg-black/70 transition-colors"
        >
          <Users className="w-6 h-6 text-white" />
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {participants.length}
          </span>
        </button>
      )}
    </div>
  );
}

