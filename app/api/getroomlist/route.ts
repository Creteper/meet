import { Room, RoomServiceClient } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
    const roomServiceClient = new RoomServiceClient( process.env.LIVEKIT_URL! ,process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!);
    const rooms = await roomServiceClient.listRooms();
    return NextResponse.json(rooms);
}
