import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTimer } from "@/hooks/use-timer";
import { Bell, Pause } from "lucide-react";

export default function Header() {
  const { data: activeEntry } = useQuery({
    queryKey: ["/api/time-entries/active"],
    enabled: true,
    refetchInterval: 1000, // Refetch every second to update timer
  });

  const { formatElapsedTime, stopTimer } = useTimer();

  const handleStopTimer = () => {
    if (activeEntry?.id) {
      stopTimer.mutate(activeEntry.id);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold text-slate-800">Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Active Timer Display */}
          {activeEntry && (
            <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-slate-500">Current:</span>
                <span className="font-medium text-slate-700 ml-1">
                  {activeEntry.project?.name || "Unknown Project"}
                </span>
              </div>
              <div className="text-lg font-mono text-primary">
                {formatElapsedTime(activeEntry.startTime)}
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="w-8 h-8 p-0 rounded-full"
                onClick={handleStopTimer}
                disabled={stopTimer.isPending}
              >
                <Pause className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs bg-red-500">
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
}
