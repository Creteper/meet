'use client';
import * as React from 'react';
import { Track } from 'livekit-client';
import {
  useMaybeLayoutContext,
  MediaDeviceMenu,
  TrackToggle,
  useRoomContext,
  useIsRecording,
} from '@livekit/components-react';
import { useKrispNoiseFilter } from '@livekit/components-react/krisp';
import styles from '../styles/SettingsMenu.module.css';
import { useState, useEffect } from 'react';
import { RoomEvent, Room } from 'livekit-client';

import { toast } from '@/hooks/use-toast';

/**
 * @alpha
 */
export interface SettingsMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * @alpha
 */
export function SettingsMenu(props: SettingsMenuProps) {
  const layoutContext = useMaybeLayoutContext();
  const room = useRoomContext();
  const recordingEndpoint = process.env.NEXT_PUBLIC_LK_RECORD_ENDPOINT;

  const settings = React.useMemo(() => {
    return {
      media: { camera: true, microphone: true, label: '媒体设备', speaker: true },
      effects: { label: '音频' },
      recording: recordingEndpoint ? { label: '录制' } : undefined,
    };
  }, []);

  const tabs = React.useMemo(
    () => Object.keys(settings).filter((t) => t !== undefined) as Array<keyof typeof settings>,
    [settings],
  );
  const [activeTab, setActiveTab] = React.useState(tabs[0]);

  const { isNoiseFilterEnabled, setNoiseFilterEnabled, isNoiseFilterPending } =
    useKrispNoiseFilter();

  React.useEffect(() => {
    // enable Krisp by default
    setNoiseFilterEnabled(true);
  }, []);

  const isRecording = useIsRecording();
  const [initialRecStatus, setInitialRecStatus] = React.useState(isRecording);
  const [processingRecRequest, setProcessingRecRequest] = React.useState(false);

  React.useEffect(() => {
    if (initialRecStatus !== isRecording) {
      setProcessingRecRequest(false);
    }
  }, [isRecording, initialRecStatus]);

  const [isStoppingRecording, setIsStoppingRecording] = useState(false);

  const toggleRoomRecording = async () => {
    if (!recordingEndpoint) {
      throw TypeError('No recording endpoint specified');
    }
    if (room.isE2EEEnabled) {
      throw Error('Recording of encrypted meetings is currently not supported');
    }
    setProcessingRecRequest(true);
    setInitialRecStatus(isRecording);
    let response: Response;
    
    try {
      if (isRecording) {
        setIsStoppingRecording(true);
        response = await fetch(recordingEndpoint + `/stop?roomName=${room.name}`);
      } else {
        response = await fetch(recordingEndpoint + `/start?roomName=${room.name}`);
      }

      if (response.ok) {
        if (isRecording) {
          await new Promise(resolve => {
            const checkStatus = () => {
              if (!isRecording) {
                resolve(true);
              } else {
                setTimeout(checkStatus, 1000);
              }
            };
            checkStatus();
          });
        }
      } else {
        const errorText = await response.text();
        if (errorText === 'Meeting is already being recorded') {
          toast({
            title: "录制失败",
            description: "会议已经在录制中",
            variant: "destructive"
          });
        } else {
          toast({
            title: "录制失败",
            description: errorText,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('录制操作失败:', error);
      toast({
        title: "录制失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsStoppingRecording(false);
      setProcessingRecRequest(false);
    }
  };

  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      room.on(RoomEvent.RecordingStatusChanged, async (status: boolean) => {
        if (!status) {
          try {
            const response = await fetch(`/api/recordings/${room.name}/latest`, {
              method: 'GET',
            });
            const data = await response.json();
            setRecordingUrl(data.url);
            
            toast({
              title: "录制完成",
              description: "视频已保存到云端"
            });
          } catch (error) {
            console.error('获取录制URL失败:', error);
          }
        }
      });
    }
  }, [room]);

  const downloadRecording = async (url: string) => {
    try {
      if (!url) {
        toast({
          title: "下载失败",
          description: "无效的下载链接",
          variant: "destructive"
        });
        return;
      }

      // 通过后端API下载
      const response = await fetch('/api/recordings/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }

      const blob = await response.blob();
      const fileName = decodeURIComponent(url.split('/').pop() || 'recording.mp4');
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 100);

      toast({
        title: "开始下载",
        description: "文件下载已开始",
        duration: 3000,
      });

    } catch (error) {
      console.error('下载失败:', error);
      toast({
        title: "下载失败",
        description: error instanceof Error ? error.message : "无法下载录制文件",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="settings-menu" style={{ width: '100%' }} {...props}>
      <div className={styles.tabs}>
        {tabs.map(
          (tab) =>
            settings[tab] && (
              <button
                className={`${styles.tab} lk-button`}
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={tab === activeTab}
              >
                {
                  // @ts-ignore
                  settings[tab].label
                }
              </button>
            ),
        )}
      </div>
      <div className="tab-content flex flex-col">
        {activeTab === 'media' && (
          <>
            {settings.media && settings.media.camera && (
              <>
                <h3 className='text-lg font-bold mt-4 mb-4'>摄像头</h3>
                <section className="lk-button-group mt-4">
                  <TrackToggle source={Track.Source.Camera}>摄像头</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="videoinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media && settings.media.microphone && (
              <>
                <h3 className='text-lg font-bold mt-4 mb-4'>麦克风</h3>
                <section className="lk-button-group mt-4">
                  <TrackToggle source={Track.Source.Microphone}>麦克风</TrackToggle>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audioinput" />
                  </div>
                </section>
              </>
            )}
            {settings.media && settings.media.speaker && (
              <>
                <h3 className='text-lg font-bold mt-4 mb-4'>扬声器和耳机</h3>
                <section className="lk-button-group mt-4">
                  <span className="lk-button">扬声器</span>
                  <div className="lk-button-group-menu">
                    <MediaDeviceMenu kind="audiooutput"></MediaDeviceMenu>
                  </div>
                </section>
              </>
            )}
          </>
        )}
        {activeTab === 'effects' && (
          <>
            <h3 className='text-lg font-bold mt-4 mb-4'>音频</h3>
            <section className='mt-4 flex items-center gap-2'>
              <input
                type="checkbox"
                style={{marginLeft: '20px'}}
                id="noise-filter"
                onChange={(ev) => setNoiseFilterEnabled(ev.target.checked)}
                checked={isNoiseFilterEnabled}
                disabled={isNoiseFilterPending}
              ></input>
              <label className='' htmlFor="noise-filter">增强型噪音消除</label>
            </section>
          </>
        )}
        {activeTab === 'recording' && (
          <>
            <div className='flex items-center gap-4'>
              <h3 className='text-lg font-bold mt-4 mb-4'>记录会议</h3>
              <div className='text-xs' style={{backgroundColor: '#FF4500', borderRadius: '4px', padding: '4px 8px'}}>
                BETA
              </div>
              
            </div>
            <p className='text-xs text-gray-500'>测试版。录制时间越长，保存时间相比越长，不要着急退出会议。每次创建会议只能录制一次，请勿重复创建会议。</p>
            <section className='flex flex-col gap-2'>
              <p className='text-sm text-gray-500 mt-4'>
                {isRecording
                  ? '正在录制会议...'
                  : '当前没有进行中的录制'}
              </p>
              <button 
                className='lk-button mt-4' 
                disabled={processingRecRequest || isStoppingRecording} 
                onClick={() => toggleRoomRecording()}
              >
                {isRecording ? (isStoppingRecording ? '正在停止...' : '停止') : '开始'} 录制
              </button>
              
              {recordingUrl && !isRecording && (
                <div className="mt-4 flex flex-col gap-2">
                  <p className='text-sm text-gray-500'>最新录制:</p>
                  <div className="flex gap-2">
                    <a 
                      href={recordingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      在线观看
                    </a>
                    <button
                      onClick={() => downloadRecording(recordingUrl)}
                      className="px-3 py-1 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      下载视频
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <button
        className={`lk-button ${styles.settingsCloseButton}`}
        onClick={() => layoutContext?.widget.dispatch?.({ msg: 'toggle_settings' })}
      >
        关闭
      </button>
    </div>
  );
}
