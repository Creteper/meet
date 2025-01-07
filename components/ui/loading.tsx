import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="h-screen grid place-items-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">正在加入会议...</p>
      </div>
    </div>
  );
} 