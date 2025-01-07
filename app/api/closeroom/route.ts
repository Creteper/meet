import { NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
export async function POST(request: Request) {
  const { roomName } = await request.json();
  console.log(roomName);
  const host = process.env.LIVEKIT_URL;
  if (!host || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    throw new Error('LiveKit configuration missing');
  }
  const roomServiceClient = new RoomServiceClient(host, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
  await roomServiceClient.deleteRoom(roomName);
  return NextResponse.json({ message: 'Room closed successfully' });
}