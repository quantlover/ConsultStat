import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Download, 
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  FileText
} from "lucide-react";

export default function Reports() {
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: true,
  });

  const { data: timeEntries } = useQuery({
    queryKey: ["/api/time-entries"],
    enabled: true,
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: true,
  });

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    enabled: true,
  });

  // Calculate summary statistics
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter(p => p.status === "active").length || 0;
  const completedProjects = projects?.filter(p => p.status === "completed").length || 0;
  
  const totalHours = timeEntries?.reduce((acc, entry) => {
    return acc + (entry.duration ? parseFloat(entry.duration) : 0);
  }, 0) || 0;

  const totalRevenue = invoices?.reduce((acc, invoice) => {
    return acc + parseFloat(invoice.total || 0);
  }, 0) || 0;

  const paidRevenue = invoices?.reduce((acc, invoice) => {
    return invoice.status === "paid" ? acc + parseFloat(invoice.total || 0) : acc;
  }, 0) || 0;

  const pendingRevenue = invoices?.reduce((acc, invoice) => {
    return invoice.status === "sent" ? acc + parseFloat(invoice.total || 0) : acc;
  }, 0) || 0;

  // Project status distribution
  const projectsByStatus = projects?.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Software usage statistics
  const softwareUsage = projects?.reduce((acc, project) => {
    project.softwareTools?.forEach(tool => {
      acc[tool] = (acc[tool] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>) || {};

  const topSoftware = Object.entries(softwareUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Projects</p>
                <p className="text-2xl font-bold text-slate-800">{totalProjects}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              {activeProjects} active, {completedProjects} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Hours</p>
                <p className="text-2xl font-bold text-slate-800">{totalHours.toFixed(1)}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Across all projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-600" />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              ${paidRevenue.toFixed(2)} collected
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Students</p>
                <p className="text-2xl font-bold text-slate-800">{students?.length || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              Active students
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(projectsByStatus).map(([status, count]) => {
                const percentage = totalProjects > 0 ? (count / totalProjects) * 100 : 0;
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case "active": return "bg-green-500";
                    case "completed": return "bg-blue-500";
                    case "on-hold": return "bg-yellow-500";
                    case "cancelled": return "bg-red-500";
                    default: return "bg-gray-500";
                  }
                };

                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                      <span className="capitalize font-medium">{status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-500">{percentage.toFixed(1)}%</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Software Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Top Software Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSoftware.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No software tools recorded yet</p>
              ) : (
                topSoftware.map(([software, count]) => {
                  const maxCount = Math.max(...Object.values(softwareUsage));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <div key={software} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{software}</span>
                        <Badge variant="outline">{count} projects</Badge>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">Paid Revenue</span>
                <span className="text-green-800 font-bold">${paidRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">Pending Revenue</span>
                <span className="text-blue-800 font-bold">${pendingRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="font-medium text-slate-800">Total Revenue</span>
                <span className="text-slate-800 font-bold">${totalRevenue.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="font-medium">Projects Created</p>
                  <p className="text-slate-500">{projects?.filter(p => {
                    const created = new Date(p.createdAt);
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return created > lastMonth;
                  }).length || 0} in the last 30 days</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Clock className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="font-medium">Time Logged</p>
                  <p className="text-slate-500">{timeEntries?.filter(t => {
                    const logged = new Date(t.startTime);
                    const lastWeek = new Date();
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    return logged > lastWeek;
                  }).length || 0} entries this week</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <FileText className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="font-medium">Invoices Generated</p>
                  <p className="text-slate-500">{invoices?.filter(i => {
                    const created = new Date(i.createdAt);
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return created > lastMonth;
                  }).length || 0} in the last 30 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
