import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient } from 'livekit-server-sdk';
const livekitHost = process.env.LIVEKIT_URL!;
const roomService = new RoomServiceClient(livekitHost, process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const roomName = searchParams.get('roomName');
        if(!roomName) return NextResponse.json({error: 'roomName is required'});

        const res = await roomService.listParticipants(roomName);
        return NextResponse.json({
            msg: res.length > 0 ? 'success' : '会议中没有用户',
            userList: res
        });
    } catch (error) {
        // 房间不存在时返回特定消息
        return NextResponse.json({
            msg: '会议中没有用户',
            userList: []
        });
    }
}