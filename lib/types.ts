import { LocalAudioTrack, LocalVideoTrack, videoCodecs } from 'livekit-client';
import { VideoCodec } from 'livekit-client';

export interface SessionProps {
  roomName: string;
  identity: string;
  audioTrack?: LocalAudioTrack;
  videoTrack?: LocalVideoTrack;
  region?: string;
  turnServer?: RTCIceServer;
  forceRelay?: boolean;
}

export interface TokenResult {
  identity: string;
  accessToken: string;
}

export interface UserInfo {
  user: {
      username: string;
      email: string;
      create_at: string;
      done: number;
      id: number;
      token: string;
  }
}

export interface LoginRequest {
  message: string;
  token: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export function isVideoCodec(codec: string): codec is VideoCodec {
  return videoCodecs.includes(codec as VideoCodec);
}

export interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantToken: string;
  participantName: string;
}
