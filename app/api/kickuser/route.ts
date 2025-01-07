import { Room, RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
const livekitHost = process.env.LIVEKIT_URL!;
const roomService = new RoomServiceClient(livekitHost, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

export async function POST(req: NextRequest) {
    const { roomName, identity } = await req.json();
    await roomService.removeParticipant(roomName, identity);
    return NextResponse.json({ message: 'User kicked successfully' });
}
