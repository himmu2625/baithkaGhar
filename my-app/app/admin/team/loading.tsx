import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-brownTan" />
        <p className="text-mediumGreen">Loading team management...</p>
      </div>
    </div>
  );
} 