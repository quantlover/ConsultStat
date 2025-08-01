import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TimerWidget from "@/components/time-tracker/timer-widget";
import ProjectModal from "@/components/modals/project-modal";
import InvoiceModal from "@/components/modals/invoice-modal";
import { useState } from "react";
import { 
  FolderOpen, 
  Clock, 
  DollarSign, 
  GraduationCap, 
  Plus, 
  File,
  UserPlus, 
  Download,
  ChartLine,
  Database,
  Brain
} from "lucide-react";

export default function Dashboard() {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    enabled: true,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    enabled: true,
  });

  const recentProjects = projects?.slice(0, 3) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProjectIcon = (index: number) => {
    const icons = [ChartLine, Database, Brain];
    const colors = ["text-primary", "text-amber-500", "text-purple-600"];
    const bgColors = ["bg-primary/10", "bg-amber-100", "bg-purple-100"];
    
    const Icon = icons[index % icons.length];
    return {
      Icon,
      color: colors[index % colors.length],
      bgColor: bgColors[index % bgColors.length],
    };
  };

  if (metricsLoading || projectsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Projects</p>
                <p className="text-3xl font-bold text-slate-800">{metrics?.activeProjects || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FolderOpen className="text-primary text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+{Math.floor(Math.random() * 5) + 1}</span>
              <span className="text-slate-500 ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Hours This Month</p>
                <p className="text-3xl font-bold text-slate-800">{metrics?.hoursThisMonth || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">+12.3%</span>
              <span className="text-slate-500 ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Invoices</p>
                <p className="text-3xl font-bold text-slate-800">${metrics?.pendingInvoicesAmount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-amber-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-slate-500">5 invoices</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Students Assigned</p>
                <p className="text-3xl font-bold text-slate-800">{metrics?.studentsAssigned || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">3 new</span>
              <span className="text-slate-500 ml-1">this semester</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Projects</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FolderOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p>No projects yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowProjectModal(true)}
                >
                  Create your first project
                </Button>
              </div>
            ) : (
              recentProjects.map((project, index) => {
                const { Icon, color, bgColor } = getProjectIcon(index);
                return (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`${color}`} size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{project.name}</h4>
                        <p className="text-sm text-slate-500">{project.clientName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-800">0 hrs</p>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Time Tracking Widget */}
        <TimerWidget />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 border-dashed hover:border-primary"
              onClick={() => setShowProjectModal(true)}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="text-primary text-xl" />
              </div>
              <div className="text-center">
                <h4 className="font-medium">New Project</h4>
                <p className="text-sm text-slate-500">Create a new consulting project</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 border-dashed hover:border-green-500"
              onClick={() => setShowInvoiceModal(true)}
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <File className="text-green-600 text-xl" />
              </div>
              <div className="text-center">
                <h4 className="font-medium">Generate Invoice</h4>
                <p className="text-sm text-slate-500">Create invoice from logged hours</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 border-dashed hover:border-amber-500"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <UserPlus className="text-amber-600 text-xl" />
              </div>
              <div className="text-center">
                <h4 className="font-medium">Add Student</h4>
                <p className="text-sm text-slate-500">Assign student to project</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2 border-dashed hover:border-purple-500"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Download className="text-purple-600 text-xl" />
              </div>
              <div className="text-center">
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-slate-500">Download project reports</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ProjectModal 
        isOpen={showProjectModal} 
        onClose={() => setShowProjectModal(false)} 
      />
      <InvoiceModal 
        isOpen={showInvoiceModal} 
        onClose={() => setShowInvoiceModal(false)} 
      />
    </div>
  );
}
