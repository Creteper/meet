
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LiveKitRoom } from '@livekit/components-react';
import { Room, RoomOptions } from 'livekit-client';
import { VideoConference } from '@livekit/components-react';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { UserList } from './UserList';
import { postRequest } from '@/lib/ver-user';

interface CustomVideoConferenceProps {
  token: string;
  serverUrl: string;
  audio: boolean;
  video: boolean;
  room: Room;
  userPromission: String;
  roomName: string;
  userName: string;
}

export default function CustomVideoConference({ 
  token, 
  serverUrl, 
  audio, 
  video, 
  room,
  userPromission,
  roomName,userName
}: CustomVideoConferenceProps) {
  const roomOptions: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: {
      deviceId: localStorage.getItem('preferredVideoDeviceId') || undefined,
      resolution: { width: 1280, height: 720 },
    },
    audioCaptureDefaults: {
      deviceId: localStorage.getItem('preferredAudioDeviceId') || undefined,
    },
  };
  console.log(userPromission);
  const router = useRouter();
  const handleOnLeave = React.useCallback( async () => {
    if(userPromission === 'admin'){
      await postRequest('/delete_admin_info', {
        admin_in_room_name: userName,
        room_id: roomName
      }).then(async (res) => {
        console.log(res);
        await fetch('/api/closeroom', {
            method: 'POST',
            body: JSON.stringify({ roomName: roomName })
        }).then(res => {
            console.log(res);
            router.push('/');
        })
      }).catch((error) => {
        console.error('删除管理员信息失败:', error);
        fetch('/api/closeroom', {
          method: 'POST',
          body: JSON.stringify({ roomName: roomName })
        }).then(res => {
          console.log(res);
          router.push('/');
        })
      })
    } else {
        router.push('/');
    }
  }, [router]);

  return (
    <LiveKitRoom 
      room={room} 
      token={token} 
      serverUrl={serverUrl} 
      audio={audio} 
      video={video}
      onDisconnected={handleOnLeave}
      options={roomOptions}
    >
      <VideoConference
        SettingsComponent={userPromission === 'admin' ? SettingsMenu : undefined}
      />
      <RecordingIndicator userPromission={userPromission} />
      <div className='flex flex-col absolute bottom-0 right-0'>
        <div className='w-64'>
            <UserList userPromission={userPromission} />
        </div>
      </div>
    </LiveKitRoom>
  );
}

