import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertInvoiceSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Download, Send, File } from "lucide-react";
import { format } from "date-fns";
import type { Invoice, Project, TimeEntry } from "@shared/schema";

const invoiceFormSchema = insertInvoiceSchema.extend({
  projectId: z.string().min(1, "Project is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  taxRate: z.string().optional(),
  dueDate: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
}

export default function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const { toast } = useToast();

  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      projectId: "",
      fromDate: "",
      toDate: "",
      taxRate: "8.5",
      dueDate: "",
      notes: "",
    },
  });

  const projectId = watch("projectId");
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");
  const taxRate = watch("taxRate");

  // Fetch time entries for selected project and date range
  useEffect(() => {
    if (projectId && fromDate && toDate) {
      const fetchTimeEntries = async () => {
        try {
          const response = await apiRequest("GET", `/api/projects/${projectId}/time-entries`);
          const entries = await response.json();
          
          // Filter entries by date range
          const filteredEntries = entries.filter((entry: TimeEntry) => {
            const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
            return entryDate >= fromDate && entryDate <= toDate && !entry.isRunning && entry.duration;
          });
          
          setTimeEntries(filteredEntries);
        } catch (error) {
          console.error("Failed to fetch time entries:", error);
        }
      };
      
      fetchTimeEntries();
    }
  }, [projectId, fromDate, toDate]);

  // Update selected project when projectId changes
  useEffect(() => {
    if (projectId && projects) {
      const project = projects.find((p: Project) => p.id === projectId);
      setSelectedProject(project || null);
    }
  }, [projectId, projects]);

  // Calculate invoice totals
  const subtotal = timeEntries.reduce((acc, entry) => {
    const hours = parseFloat(entry.duration || "0");
    const rate = parseFloat(selectedProject?.hourlyRate || "0");
    return acc + (hours * rate);
  }, 0);

  const taxAmount = subtotal * (parseFloat(taxRate || "0") / 100);
  const total = subtotal + taxAmount;

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const invoiceNumber = generateInvoiceNumber();
      
      // Create invoice items from time entries
      const items = timeEntries.map(entry => ({
        timeEntryId: entry.id,
        description: entry.description,
        hours: entry.duration,
        rate: selectedProject?.hourlyRate || "0",
        amount: (parseFloat(entry.duration || "0") * parseFloat(selectedProject?.hourlyRate || "0")).toString(),
      }));

      const invoiceData = {
        invoiceNumber,
        projectId: data.projectId,
        clientName: selectedProject?.clientName || "",
        fromDate: new Date(data.fromDate).toISOString(),
        toDate: new Date(data.toDate).toISOString(),
        subtotal: subtotal.toString(),
        taxRate: data.taxRate || "0",
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        status: "draft",
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        notes: data.notes,
      };

      const response = await apiRequest("POST", "/api/invoices", {
        ...invoiceData,
        items,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    reset();
    setSelectedProject(null);
    setTimeEntries([]);
    onClose();
  };

  const onSubmit = (data: InvoiceFormData) => {
    if (timeEntries.length === 0) {
      toast({
        title: "Error",
        description: "No billable hours found for the selected period",
        variant: "destructive",
      });
      return;
    }
    createInvoiceMutation.mutate(data);
  };

  const handleDownloadPDF = () => {
    if (!selectedProject || timeEntries.length === 0) return;
    
    const invoiceData = {
      invoiceNumber: generateInvoiceNumber(),
      clientName: selectedProject.clientName,
      projectName: selectedProject.name,
      fromDate,
      toDate,
      items: timeEntries.map(entry => ({
        date: format(new Date(entry.startTime), "yyyy-MM-dd"),
        description: entry.description,
        hours: parseFloat(entry.duration || "0"),
        rate: parseFloat(selectedProject.hourlyRate),
        amount: parseFloat(entry.duration || "0") * parseFloat(selectedProject.hourlyRate),
      })),
      subtotal,
      taxRate: parseFloat(taxRate || "0"),
      taxAmount,
      total,
    };
    
    generateInvoicePDF(invoiceData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Generate Invoice</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Configuration */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-slate-800">Invoice Configuration</h4>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Select Project *</Label>
                <Select
                  value={projectId}
                  onValueChange={(value) => setValue("projectId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project: Project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} - {project.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.projectId && (
                  <p className="text-sm text-red-600">{errors.projectId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromDate">From Date *</Label>
                  <Input
                    id="fromDate"
                    type="date"
                    {...register("fromDate")}
                  />
                  {errors.fromDate && (
                    <p className="text-sm text-red-600">{errors.fromDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toDate">To Date *</Label>
                  <Input
                    id="toDate"
                    type="date"
                    {...register("toDate")}
                  />
                  {errors.toDate && (
                    <p className="text-sm text-red-600">{errors.toDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  {...register("taxRate")}
                  placeholder="8.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register("dueDate")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  {...register("notes")}
                  placeholder="Additional notes for the invoice"
                />
              </div>

              {/* Billable Hours Summary */}
              {selectedProject && timeEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Billable Hours Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Total Hours:</span>
                      <span className="font-medium">
                        {timeEntries.reduce((acc, entry) => acc + parseFloat(entry.duration || "0"), 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Hourly Rate:</span>
                      <span className="font-medium">${selectedProject.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tax ({taxRate}%):</span>
                      <span className="font-medium">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleDownloadPDF}
                  disabled={!selectedProject || timeEntries.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || createInvoiceMutation.isPending || timeEntries.length === 0}
                >
                  <File className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>
            </form>
          </div>

          {/* Invoice Preview */}
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-slate-800">Invoice Preview</h4>
            
            <Card className="border border-slate-200">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">INVOICE</h2>
                  <p className="text-slate-600">Invoice #{generateInvoiceNumber()}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h6 className="font-medium text-slate-800 mb-2">From:</h6>
                    <div className="text-sm text-slate-600">
                      <p className="font-medium">Dr. Sarah Chen</p>
                      <p>Statistical Consultant</p>
                      <p>123 University Ave</p>
                      <p>City, State 12345</p>
                      <p>sarah.chen@email.com</p>
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium text-slate-800 mb-2">To:</h6>
                    <div className="text-sm text-slate-600">
                      {selectedProject ? (
                        <>
                          <p className="font-medium">{selectedProject.clientName}</p>
                          <p>Client Address</p>
                          <p>City, State 12345</p>
                        </>
                      ) : (
                        <p className="text-slate-400">Select a project to see client details</p>
                      )}
                    </div>
                  </div>
                </div>

                {timeEntries.length > 0 ? (
                  <>
                    <div className="mb-6">
                      <div className="bg-slate-50 px-4 py-2 rounded-t-lg">
                        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-700">
                          <span>Date</span>
                          <span>Description</span>
                          <span>Hours</span>
                          <span>Amount</span>
                        </div>
                      </div>
                      <div className="border border-t-0 border-slate-200 rounded-b-lg divide-y divide-slate-200">
                        {timeEntries.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="grid grid-cols-4 gap-4 px-4 py-3 text-sm">
                            <span className="text-slate-600">
                              {format(new Date(entry.startTime), "yyyy-MM-dd")}
                            </span>
                            <span className="text-slate-800 truncate">{entry.description}</span>
                            <span className="text-slate-600">{parseFloat(entry.duration || "0").toFixed(1)}</span>
                            <span className="text-slate-800">
                              ${(parseFloat(entry.duration || "0") * parseFloat(selectedProject?.hourlyRate || "0")).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {timeEntries.length > 5 && (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            ... and {timeEntries.length - 5} more entries
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Subtotal:</span>
                          <span className="text-slate-800">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tax ({taxRate}%):</span>
                          <span className="text-slate-800">${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t border-slate-200 pt-2">
                          <span>Total:</span>
                          <span className="text-primary">${total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <File className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p>Select a project and date range to see billable hours</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
