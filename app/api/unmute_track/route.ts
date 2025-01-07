import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { RoomServiceClient, TrackType } from 'livekit-server-sdk';

export async function POST(request: NextRequest) {
    const { roomName, participantName, trackType } = await request.json();
    if (!roomName || !participantName) {
        return NextResponse.json({ error: 'roomName and participantName are required' });
    }
    
    const roomServiceClient = new RoomServiceClient(
        process.env.LIVEKIT_URL!,
        process.env.LIVEKIT_API_KEY!, 
        process.env.LIVEKIT_API_SECRET!
    );
    
    const participant = await roomServiceClient.getParticipant(roomName, participantName);

    if (!participant) {
        return NextResponse.json({ error: 'Participant not found' });
    }
    let _Track;
    if(trackType === 'AUDIO'){
        _Track = participant.tracks[1];
    }else{
        _Track = participant.tracks[0];
    }
    
    if (!_Track) {
        return NextResponse.json({ error: `No ${trackType} track found` });
    }
    console.log(_Track);

    const tracksInfo = await roomServiceClient.mutePublishedTrack(
        roomName, 
        participantName, 
        _Track.sid, 
        true
    );

    return NextResponse.json({msg: 'success', tracksInfo: tracksInfo});
}

