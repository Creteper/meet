'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LocalUserChoices,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { getRequest, postRequest, verToken } from '@/lib/ver-user';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Video,
  Mic,
  MicOff,
  VideoOff,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomVideoConference from './components/VideoConference';
import { LoadingSpinner } from '@/components/ui/loading';
import { toast } from '@/hooks/use-toast';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';
let buttonDisabled = false;
// 在文件顶部添加新的类型定义
interface MediaDevice {
  deviceId: string;
  label: string;
}

interface VideoPreviewProps {
  deviceId: string;
  enabled: boolean;
}

// 添加视频预览组件
function VideoPreview({ deviceId, enabled }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startPreview() {
      try {
        // 如果已经有流在播放，先停止它
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        // 如果视频被禁用或没有设备ID，不启动预览
        if (!enabled || !deviceId) {
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
          return;
        }

        // 获取新的视频流
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('预览摄像头失败:', err);
      }
    }

    startPreview();

    // 清理函数
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId, enabled]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
      {enabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <VideoOff className="w-8 h-8" />
        </div>
      )}
    </div>
  );
}

// 自定义的预加入界面组件
function CustomPreJoin({ 
  onSubmit, 
  defaults,
  onError,
  type
}: { 
  onSubmit: (values: LocalUserChoices) => void;
  defaults: LocalUserChoices;
  onError: (error: Error) => void;
  type: string;
}) {
  const [username, setUsername] = useState(defaults.username);
  const [videoEnabled, setVideoEnabled] = useState(defaults.videoEnabled);
  const [audioEnabled, setAudioEnabled] = useState(defaults.audioEnabled);
  const [videoDeviceId, setVideoDeviceId] = useState(defaults.videoDeviceId || '');
  const [audioDeviceId, setAudioDeviceId] = useState(defaults.audioDeviceId || '');

  
  // 存储可用设备列表
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);

  // 获取设备列表
  useEffect(() => {
    async function getDevices() {
      try {
        // 请求权限
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoInputs = devices
          .filter(device => device.kind === 'videoinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `摄像头 ${videoDevices.length + 1}`
          }));
          
        const audioInputs = devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            label: device.label || `麦克风 ${audioDevices.length + 1}`
          }));

        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);
        
        // 自动选择第一个设备作为默认设备
        if (videoInputs.length > 0) {
          setVideoDeviceId(videoInputs[0].deviceId);
        }
        if (audioInputs.length > 0) {
          setAudioDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('获取设备失败:', err);
        onError(new Error('无法访问媒体设备'));
      }
    }
    getDevices();
  }, []); // 依赖数组为空，只在组件挂载时执行一次

  const handleSubmit = (e: React.FormEvent) => {
    buttonDisabled = true;
    e.preventDefault();
    if (!username.trim()) {
      onError(new Error('用户名不能为空'));
      buttonDisabled = false;
      return;
    }

    onSubmit({
      username,
      videoEnabled,
      audioEnabled,
      videoDeviceId,
      audioDeviceId,
    });
  };

  return (
    <Card className="w-[400px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <CardTitle>加入会议</CardTitle>
        <CardDescription>请设置您的会议参数</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              placeholder="请输入您的名字"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <Label>设备控制</Label>
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  variant={videoEnabled ? "default" : "secondary"}
                  size="icon"
                  onClick={() => setVideoEnabled(!videoEnabled)}
                >
                  {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <span className="text-sm">摄像头</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  type="button"
                  variant={audioEnabled ? "default" : "secondary"}
                  size="icon"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                >
                  {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <span className="text-sm">麦克风</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>摄像头预览</Label>
              <VideoPreview
                deviceId={videoDeviceId}
                enabled={videoEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoDevice">选择摄像头</Label>
              <Select
                disabled={!videoEnabled}
                value={videoDeviceId}
                onValueChange={setVideoDeviceId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择摄像头" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audioDevice">选择麦克风</Label>
              <Select
                disabled={!audioEnabled}
                value={audioDeviceId}
                onValueChange={setAudioDeviceId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择麦克风" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="pt-4">
            <Button type="submit" disabled={buttonDisabled} className="w-full">
              加入会议
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec?: VideoCodec;
  userChoices?: LocalUserChoices;
}) {
  const router = useRouter();
  
  // 获取会议类型（加入/创建）并立即清除
  const [meetingType, setMeetingType] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const type = sessionStorage.getItem('meetingType');
      sessionStorage.removeItem('meetingType'); // 立即清除
      return type || '';
    }
    return '';
  });

  // 检查会议类型和权限
  useEffect(() => {
    if(meetingType === ''){
      router.push('/');
      return;
    }
    
    if(meetingType === 'join'){
      if(props.roomName === '123123') {
        console.log('123123');
      }
    } else if(meetingType === 'create'){
      if(props.roomName === '123123') {
        console.log('123123');
      }
    }
  }, [meetingType, props.roomName, router]);

  // 添加默认值
  const defaultUserChoices: LocalUserChoices = {
    username: '',
    videoEnabled: true,
    audioEnabled: true,
    videoDeviceId: '',
    audioDeviceId: '',
  };

  // 合并默认值和传入的值
  const userChoices = {
    ...defaultUserChoices,
    ...props.userChoices,
  };

  const roomOptions = React.useMemo((): RoomOptions => {
    return {
      videoCaptureDefaults: {
        deviceId: userChoices?.videoDeviceId || '1',
        resolution: { width: 1280, height: 720 },
      },
      audioCaptureDefaults: {
        deviceId: userChoices?.audioDeviceId || '0',
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
    };
  }, [userChoices]);

  const room = React.useMemo(() => new Room(roomOptions), [roomOptions]);

  React.useEffect(() => {
    const verUser = async () => {
      try {
        await verToken();
      } catch (err) {
        router.push('/login');
      }
    };
    verUser();
  }, []);

  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: userChoices.username ?? '',
      videoEnabled: userChoices.videoEnabled ?? true,
      audioEnabled: userChoices.audioEnabled ?? true,
      videoDeviceId: userChoices.videoDeviceId ?? '',
      audioDeviceId: userChoices.audioDeviceId ?? '',
    };
  }, [userChoices]);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    try {
      if(meetingType === 'join'){
        fetch('/api/getroomusers?roomName=' + props.roomName).then(res => res.json()).then( async (datas) => {
          console.log(datas);
          if(datas.msg === '会议中没有用户'){
            console.log('会议中没有用户');
          } else{
            for(const user of datas.userList){
              if(user.identity === values.username){
                console.log('用户名已存在');
                toast({
                  title: '用户名已存在',
                  variant: 'destructive',
                })
                return;
              }
            }
          }
          console.log('用户名可用');
          setPreJoinChoices(values);
          const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
          url.searchParams.append('roomName', props.roomName);
          url.searchParams.append('participantName', values.username);
          url.searchParams.append('videoDeviceId', values.videoDeviceId);
          url.searchParams.append('audioDeviceId', values.audioDeviceId);
          if (props.region) {
            url.searchParams.append('region', props.region);
          }
          
          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error('获取会议连接信息失败');
          }
          
          const data: ConnectionDetails = await response.json();
          setConnectionDetails(data);
        });
      } else {
        postRequest('/upload_admin_info', {
          admin_in_room_name: values.username,
          room_id: props.roomName
        }).then(async (res) => {
          console.log(res);
          console.log('用户名可用');
          setPreJoinChoices(values);
          const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
          url.searchParams.append('roomName', props.roomName);
          url.searchParams.append('participantName', values.username);
          url.searchParams.append('videoDeviceId', values.videoDeviceId);
          url.searchParams.append('audioDeviceId', values.audioDeviceId);
          if (props.region) {
            url.searchParams.append('region', props.region);
          }
          
          const response = await fetch(url.toString());
          if (!response.ok) {
            throw new Error('获取会议连接信息失败');
          }
          
          const data: ConnectionDetails = await response.json();
          setConnectionDetails(data);
        })
        .catch((error) => {
          getRequest('/get_admin_info',{
            admin_in_room_name: values.username,
            room_id: props.roomName
          }).then(async (res) => {
            postRequest('/delete_admin_info', {
              admin_in_room_name: res.admin_in_room_name,
              room_id: props.roomName
            }).then(async (res) => {
              console.log(res);
              handlePreJoinSubmit(values);
            }).catch((error) => {
              toast({
                title: '管理员不存在',
                variant: 'destructive',
              })
            })
          })
        })

      }

      
    
    } catch (error) {
      console.error('加入会议失败:', error);
      // 这里可以添加错误提示UI
    }
    buttonDisabled = false;
  }, [props.roomName, props.region]);
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  return (
    <main data-lk-theme="default" className='h-screen'>
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div className='grid place-items-center h-full'>
          <CustomPreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
            type={meetingType}
          />
        </div>
      ) : (
        <CustomVideoConference 
          token={connectionDetails.participantToken}
          serverUrl={connectionDetails.serverUrl}
          audio={preJoinChoices.audioEnabled}
          video={preJoinChoices.videoEnabled}
          room={room}
          userPromission={meetingType === 'create' ? 'admin' : 'user'}
          roomName={props.roomName}
          userName={preJoinChoices.username}
        />
      )}
    </main>
  );
}

