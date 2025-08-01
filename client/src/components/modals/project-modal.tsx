import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertProjectSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import type { Project } from "@shared/schema";

const projectFormSchema = insertProjectSchema.extend({
  name: z.string().min(1, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  hourlyRate: z.string().min(1, "Hourly rate is required"),
  estimatedHours: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  softwareTools: z.array(z.string()).default([]),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
}

const SOFTWARE_OPTIONS = [
  "R", "Python", "SPSS", "SAS", "Stata", "Excel", "Tableau", "MATLAB", "Julia", "SQL"
];

export default function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      clientName: "",
      description: "",
      hourlyRate: "",
      estimatedHours: "",
      status: "active",
      startDate: "",
      deadline: "",
      softwareTools: [],
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const projectData = {
        ...data,
        hourlyRate: data.hourlyRate,
        estimatedHours: data.estimatedHours || undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        softwareTools: selectedSoftware,
      };
      const response = await apiRequest("POST", "/api/projects", projectData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      if (!project) throw new Error("No project to update");
      const projectData = {
        ...data,
        hourlyRate: data.hourlyRate,
        estimatedHours: data.estimatedHours || undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : undefined,
        softwareTools: selectedSoftware,
      };
      const response = await apiRequest("PUT", `/api/projects/${project.id}`, projectData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (project) {
      setValue("name", project.name);
      setValue("clientName", project.clientName);
      setValue("description", project.description || "");
      setValue("hourlyRate", project.hourlyRate);
      setValue("estimatedHours", project.estimatedHours || "");
      setValue("status", project.status);
      setValue("startDate", project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "");
      setValue("deadline", project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : "");
      setSelectedSoftware(project.softwareTools || []);
    } else {
      reset();
      setSelectedSoftware([]);
    }
  }, [project, setValue, reset]);

  const handleClose = () => {
    reset();
    setSelectedSoftware([]);
    onClose();
  };

  const onSubmit = (data: ProjectFormData) => {
    if (project) {
      updateProjectMutation.mutate(data);
    } else {
      createProjectMutation.mutate(data);
    }
  };

  const handleSoftwareToggle = (software: string) => {
    setSelectedSoftware(prev => 
      prev.includes(software) 
        ? prev.filter(s => s !== software)
        : [...prev, software]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {project ? "Edit Project" : "Create New Project"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter project name"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                {...register("clientName")}
                placeholder="Enter client name"
              />
              {errors.clientName && (
                <p className="text-sm text-red-600">{errors.clientName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe the project scope and objectives"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                {...register("hourlyRate")}
                placeholder="150.00"
              />
              {errors.hourlyRate && (
                <p className="text-sm text-red-600">{errors.hourlyRate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                {...register("estimatedHours")}
                placeholder="40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                {...register("deadline")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Project Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Software Tools</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SOFTWARE_OPTIONS.map((software) => (
                <div key={software} className="flex items-center space-x-2">
                  <Checkbox
                    id={software}
                    checked={selectedSoftware.includes(software)}
                    onCheckedChange={() => handleSoftwareToggle(software)}
                  />
                  <Label
                    htmlFor={software}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {software}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || createProjectMutation.isPending || updateProjectMutation.isPending}
            >
              {isSubmitting ? "Saving..." : project ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
