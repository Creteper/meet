import { useIsRecording } from '@livekit/components-react';
import { toast } from "@/hooks/use-toast"
import * as React from 'react';

interface RecordingIndicatorProps {
  userPromission: String;
}

export function RecordingIndicator(props: RecordingIndicatorProps) {
  const isRecording = useIsRecording();
  const [wasRecording, setWasRecording] = React.useState(false);

  React.useEffect(() => {
    console.log(props.userPromission);
    if(props.userPromission === 'admin') {
      if (isRecording !== wasRecording) {
        setWasRecording(isRecording);
        if (isRecording) {
          toast({
            title: '会议正在录制中',
            variant: 'default',
          });
        }
      }
    }
  }, [isRecording]);
  return props.userPromission === 'admin' ? (
    <div
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        boxShadow: isRecording ? 'red 0px 0px 0px 2px inset' : 'none',
        pointerEvents: 'none',
      }}
    ></div>
  ) : (
    <></>
  );
}
