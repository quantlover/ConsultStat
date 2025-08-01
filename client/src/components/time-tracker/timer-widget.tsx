import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTimer } from "@/hooks/use-timer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Project, TimeEntry } from "@shared/schema";

export default function TimerWidget() {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [problemsEncountered, setProblemsEncountered] = useState("");
  const { toast } = useToast();

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: true,
  });

  const { data: activeEntry, refetch: refetchActiveEntry } = useQuery({
    queryKey: ["/api/time-entries/active"],
    enabled: true,
    refetchInterval: 1000, // Refetch every second to update timer
  });

  const { data: todayEntries } = useQuery({
    queryKey: ["/api/time-entries"],
    enabled: true,
    select: (data: (TimeEntry & { project: Project })[]) => {
      const today = new Date().toISOString().split('T')[0];
      return data.filter(entry => {
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        return entryDate === today && !entry.isRunning;
      });
    },
  });

  const { formatElapsedTime, startTimer, stopTimer } = useTimer();

  const handleStartTimer = () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project before starting the timer",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task description",
        variant: "destructive",
      });
      return;
    }

    startTimer.mutate({
      projectId: selectedProjectId,
      description: description.trim(),
      problemsEncountered: problemsEncountered.trim() || null,
    });
  };

  const handleStopTimer = () => {
    if (activeEntry?.id) {
      stopTimer.mutate(activeEntry.id);
      setDescription("");
      setProblemsEncountered("");
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Timer Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-slate-800 mb-2">
            {activeEntry ? formatElapsedTime(activeEntry.startTime) : "00:00:00"}
          </div>
          {activeEntry ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-slate-500">Working on: {activeEntry.project?.name}</p>
            </div>
          ) : (
            <p className="text-slate-500">Ready to start tracking</p>
          )}
        </div>

        {/* Timer Controls */}
        <div className="space-y-4">
          {!activeEntry ? (
            <>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.filter((p: Project) => p.status === "active").map((project: Project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - {project.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Task Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you're working on..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Problems Encountered (Optional)</Label>
                <Textarea
                  value={problemsEncountered}
                  onChange={(e) => setProblemsEncountered(e.target.value)}
                  placeholder="Note any issues or challenges..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleStartTimer} 
                className="w-full" 
                size="lg"
                disabled={startTimer.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Current Session</h4>
                <p className="text-sm text-green-700">{activeEntry.description}</p>
                {activeEntry.problemsEncountered && (
                  <p className="text-sm text-green-600 mt-1">
                    <strong>Issues:</strong> {activeEntry.problemsEncountered}
                  </p>
                )}
              </div>

              <Button 
                onClick={handleStopTimer} 
                variant="destructive" 
                className="w-full" 
                size="lg"
                disabled={stopTimer.isPending}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause Timer
              </Button>
            </div>
          )}
        </div>

        {/* Today's Sessions */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="font-medium text-slate-800 mb-3 flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Today's Sessions
          </h4>
          
          {todayEntries && todayEntries.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {todayEntries.map((entry: TimeEntry & { project: Project }) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 text-sm">{entry.project.name}</p>
                    <p className="text-xs text-slate-500 truncate">{entry.description}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-medium text-slate-800 text-sm">
                      {formatDuration(entry.duration)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : "Running"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm">No time entries for today</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
