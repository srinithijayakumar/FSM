import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, X, Calendar, Clock, MapPin, User, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useServicesStore } from "@/store/servicesStore";
import { useProjectsStore } from "@/store/projectsStore";
import type { ServiceAppointment, Task, Attachment, AttachmentKind } from "@/store/servicesStore";
import type { WorkOrder } from "@/store/projectsStore";

const employees = [
  { id: 1, name: "Safeeq", phone: "9876543220", availability: "Available" },
  { id: 2, name: "Rajesh", phone: "9876543221", availability: "Available" },
  { id: 3, name: "Arun", phone: "9876543222", availability: "Busy" },
];

const AssignServicePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addAppointment, getNextAppointmentId } = useServicesStore();
  const { workOrders, getWorkOrder } = useProjectsStore();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [workOrderData, setWorkOrderData] = useState<WorkOrder | null>(null);

  const [formData, setFormData] = useState({
    workOrderId: "",
    customer: "",
    address: "",
    serviceType: "",
    appointmentDate: "",
    appointmentTime: "",
    employee: "",
    subject: "",
    salesExecutive: "",
    refNo: "",
    warrantyPeriod: "",
    technicians: [] as string[],
    instructions: "",
    tasks: [] as Task[]
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskClosingDateTime, setNewTaskClosingDateTime] = useState("");
  const [newTaskBranch, setNewTaskBranch] = useState("");
  const [newTaskStaff, setNewTaskStaff] = useState("");
  const [newTaskAttachments, setNewTaskAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    const workOrderId = searchParams.get("workOrderId");
    if (workOrderId) {
      const workOrder = getWorkOrder(workOrderId);
      if (workOrder) {
        setWorkOrderData(workOrder);
        setFormData(prev => ({
          ...prev,
          workOrderId: workOrder.id,
          customer: workOrder.customer,
          address: workOrder.address,
          serviceType: workOrder.serviceType,
          subject: workOrder.subject ?? workOrder.serviceType,
          salesExecutive: workOrder.salesExecutive ?? "",
          refNo: workOrder.reference ?? "",
          appointmentDate: new Date().toISOString().split('T')[0]
        }));
      }
    }
  }, [searchParams, getWorkOrder]);

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: `TSK-${Date.now()}`,
        title: newTaskTitle,
        completed: false,
        closingDateTime: newTaskClosingDateTime || undefined,
        attachments: newTaskAttachments.length ? newTaskAttachments : undefined,
        branch: newTaskBranch || undefined,
        staff: newTaskStaff || undefined,
      };
      setFormData(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask]
      }));
      setNewTaskTitle("");
      setNewTaskClosingDateTime("");
      setNewTaskBranch("");
      setNewTaskStaff("");
      setNewTaskAttachments([]);
    }
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    }));
  };

  const handleAssignService = () => {
    if (!formData.workOrderId) {
      toast.error("Please select a work order");
      return;
    }
    if (!formData.employee) {
      toast.error("Please select a technician");
      return;
    }

    const hasDate = Boolean(formData.appointmentDate);
    const hasTime = Boolean(formData.appointmentTime);
    if (hasDate !== hasTime) {
      toast.error("Select both date and time, or leave both empty for unscheduled work.");
      return;
    }

    const technicians = Array.from(new Set([formData.employee, ...formData.technicians].filter(Boolean)));
    
    const newAppointment = {
      id: getNextAppointmentId(),
      workOrderId: formData.workOrderId,
      date: hasDate ? formData.appointmentDate : "",
      time: hasTime ? formData.appointmentTime : "",
      employeeId: formData.employee,
      employeeName: formData.employee,
      subject: formData.subject || undefined,
      salesExecutive: formData.salesExecutive || undefined,
      refNo: formData.refNo || undefined,
      warrantyPeriod: formData.warrantyPeriod || undefined,
      technicians,
      instructions: formData.instructions,
      tasks: formData.tasks,
      status: (hasDate && hasTime ? "Scheduled" : "Unscheduled") as const,
      completedAt: undefined,
      completionNotes: undefined,
      cancelledAt: undefined,
      cancellationReason: undefined,
    };

    addAppointment(newAppointment);
    setSuccessMessage(`Service assigned to ${formData.employee} for ${formData.customer}`);
    toast.success("Service appointment created successfully!");
    setShowSuccessMessage(true);
    
    setTimeout(() => {
      navigate("/services");
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-sm font-medium text-success">
            ✓ {successMessage}. Employee will receive the task in their mobile app.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/services")}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-card-foreground">Assign Service</h2>
          <p className="text-sm text-muted-foreground">Schedule and assign a service to a technician</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-card rounded-xl border border-border shadow-lg">
        <div className="p-6 space-y-6">
          {/* Work Order Information */}
          {workOrderData && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-xs font-medium text-primary mb-2">Work Order</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-card-foreground">{workOrderData.id}</span>
                  <span className="text-sm font-semibold text-card-foreground">{workOrderData.customer}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {workOrderData.address}
                </div>
              </div>
            </div>
          )}

          {!workOrderData && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 block">
                  Select Work Order <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.workOrderId}
                  onChange={(e) => {
                    const workOrderId = e.target.value;
                    const workOrder = workOrderId ? getWorkOrder(workOrderId) : undefined;
                    if (!workOrder) {
                      setWorkOrderData(null);
                      setFormData((prev) => ({
                        ...prev,
                        workOrderId: workOrderId,
                        customer: "",
                        address: "",
                        serviceType: "",
                        subject: "",
                        salesExecutive: "",
                        refNo: "",
                      }));
                      return;
                    }
                    setWorkOrderData(workOrder);
                    setFormData((prev) => ({
                      ...prev,
                      workOrderId: workOrder.id,
                      customer: workOrder.customer,
                      address: workOrder.address,
                      serviceType: workOrder.serviceType,
                      subject: workOrder.subject ?? workOrder.serviceType,
                      salesExecutive: workOrder.salesExecutive ?? "",
                      refNo: workOrder.reference ?? "",
                      appointmentDate: prev.appointmentDate || new Date().toISOString().split("T")[0],
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Choose a work order...</option>
                  {workOrders.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.id} — {wo.customer}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Appointment Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-card-foreground">Appointment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 block">
                  <Calendar className="w-3 h-3" />
                  Date
                </label>
                <input 
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 block">
                  <Clock className="w-3 h-3" />
                  Time
                </label>
                <input 
                  type="time"
                  value={formData.appointmentTime}
                  onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave Date/Time empty to create an unscheduled assignment.</p>
          </div>

          {/* Employee Assignment */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-card-foreground">Assign Employee</h4>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1 block">
                <User className="w-3 h-3" />
                Select Technician <span className="text-destructive">*</span>
              </label>
              <select 
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Choose a technician...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} {emp.availability === "Busy" ? "(Busy)" : "(Available)"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-border">
          <button 
            onClick={() => navigate("/services")}
            className="flex-1 h-10 border border-border text-card-foreground text-sm font-medium hover:text-primary transition-colors rounded-lg"
          >
            Cancel
          </button>
          <button 
            onClick={handleAssignService}
            className="flex-1 h-10 text-sm font-semibold hover:opacity-90 text-white shadow-[0px_5px_12px_rgba(39,47,158,0.2)] transition-all rounded-lg" 
            style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}
          >
            Assign Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignServicePage;