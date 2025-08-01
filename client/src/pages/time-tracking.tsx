import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import TimerWidget from "@/components/time-tracker/timer-widget";
import { 
  Clock, 
  Play, 
  Pause, 
  Search, 
  Calendar,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import type { TimeEntry, Project } from "@shared/schema";

export default function TimeTracking() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ["/api/time-entries"],
    enabled: true,
  });

  const { data: activeEntry } = useQuery({
    queryKey: ["/api/time-entries/active"],
    enabled: true,
  });

  const filteredEntries = timeEntries?.filter((entry: TimeEntry & { project: Project }) =>
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.project.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatDuration = (duration: string | null) => {
    if (!duration) return "0h 0m";
    const hours = parseFloat(duration);
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatTime = (time: string) => {
    return format(new Date(time), "HH:mm");
  };

  const formatDate = (time: string) => {
    return format(new Date(time), "MMM d, yyyy");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Time Tracking</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 animate-pulse">
            <CardContent className="p-6">
              <div className="h-96 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-96 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Time Tracking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Entries List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Time Entries</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">No time entries found</h3>
                <p className="text-slate-500">
                  {searchTerm ? "Try adjusting your search criteria" : "Start tracking time to see your entries here"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry: TimeEntry & { project: Project }) => (
                  <div key={entry.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">{entry.project.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{entry.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-800">
                          {formatDuration(entry.duration)}
                        </p>
                        {entry.isRunning ? (
                          <Badge className="bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                            Running
                          </Badge>
                        ) : (
                          <p className="text-sm text-slate-500">
                            {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : "Running"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-slate-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(entry.startTime)}
                      </div>
                      
                      {entry.softwareUsed && entry.softwareUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.softwareUsed.slice(0, 3).map((tool) => (
                            <Badge key={tool} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                          {entry.softwareUsed.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.softwareUsed.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {entry.problemsEncountered && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800">
                          <strong>Problems encountered:</strong> {entry.problemsEncountered}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timer Widget */}
        <TimerWidget />
      </div>
    </div>
  );
}
