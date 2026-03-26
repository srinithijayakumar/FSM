import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, X, Calendar, Clock, MapPin, User, CheckCircle2, Eye, Check, Pencil, AlertCircle, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useServicesStore } from "@/store/servicesStore";
import { useProjectsStore } from "@/store/projectsStore";
import type { ServiceAppointment } from "@/store/servicesStore";
import type { WorkOrder } from "@/store/projectsStore";

const employees = [
  { id: 1, name: "Safeeq", phone: "9876543220", availability: "Available" },
  { id: 2, name: "Rajesh", phone: "9876543221", availability: "Available" },
  { id: 3, name: "Arun", phone: "9876543222", availability: "Busy" },
];

const statusMap = { Scheduled: "info", Unscheduled: "neutral", Completed: "success", Cancelled: "error" } as const;

type SelectedService = ServiceAppointment & { workOrder?: WorkOrder };

const ServicesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { appointments, updateAppointment } = useServicesStore();
  const { workOrders, getWorkOrder } = useProjectsStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Scheduled" | "Unscheduled" | "Overdue" | "Completed" | "Cancelled">("All");
  const [dateFilter, setDateFilter] = useState<"All" | "Today" | "Week" | "Month">("All");
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedService, setSelectedService] = useState<SelectedService | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ServiceAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  const todayISO = new Date().toISOString().split("T")[0];

  const getDateTime = (date: string, time: string) => {
    const d = new Date(`${date}T${time || "00:00"}:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateTime = (date: string, time: string) => {
    const d = getDateTime(date, time);
    if (!d) return `${date} ${time}`.trim();
    const formattedDate = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(d);
    const formattedTime = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(d);
    return `${formattedDate} • ${formattedTime}`;
  };

  const isOverdue = (a: ServiceAppointment) => {
    if (a.status !== "Scheduled") return false;
    const d = getDateTime(a.date, a.time);
    if (!d) return false;
    return d.getTime() < Date.now();
  };
  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const shouldIncludeByDate = (a: ServiceAppointment) => {
    if (dateFilter === "All") return true;
    if (!a.date) return false;
    if (dateFilter === "Today") return a.date === todayISO;

    const parts = a.date.split("-").map((x) => Number(x));
    if (parts.length !== 3) return false;
    const [y, m, d] = parts;
    if (!y || !m || !d) return false;
    const appointmentUTC = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(appointmentUTC.getTime())) return false;

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (dateFilter === "Month") {
      return appointmentUTC.getUTCFullYear() === todayUTC.getUTCFullYear() && appointmentUTC.getUTCMonth() === todayUTC.getUTCMonth();
    }

    const dow = todayUTC.getUTCDay();
    const diff = (dow + 6) % 7;
    const start = new Date(todayUTC);
    start.setUTCDate(todayUTC.getUTCDate() - diff);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
    return appointmentUTC.getTime() >= start.getTime() && appointmentUTC.getTime() < end.getTime();
  };

  const openAssignNew = () => {
    navigate("/assign-service");
  };

  const openAssignForWorkOrder = (wo: WorkOrder) => {
    navigate(`/assign-service?workOrderId=${wo.id}`);
  };

  const openEditAppointment = (apt: ServiceAppointment) => {
    navigate(`/assign-service?appointmentId=${apt.id}`);
  };

  const closeServiceModal = () => {
    setSelectedService(null);
  };

  const openCancel = (apt: ServiceAppointment) => {
    setCancelTarget(apt);
  };

  const closeCancel = () => {
    setCancelTarget(null);
    setCancelReason("");
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    updateAppointment(cancelTarget.id, {
      status: "Cancelled",
      cancelledAt: new Date().toISOString(),
      cancellationReason: cancelReason || "No reason provided",
    });
    toast.success("Service appointment cancelled");
    closeCancel();
  };
  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch = !search || 
      a.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      getWorkOrder(a.workOrderId)?.customer.toLowerCase().includes(search.toLowerCase()) ||
      getWorkOrder(a.workOrderId)?.serviceType.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || 
      (statusFilter === "Overdue" ? isOverdue(a) : a.status === statusFilter);

    const matchesDate = shouldIncludeByDate(a);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const unscheduledWorkOrders = workOrders.filter(wo => 
    !appointments.some(apt => apt.workOrderId === wo.id)
  );

  const scheduledCount = appointments.filter(a => a.status === "Scheduled").length;
  const unscheduledCount = appointments.filter(a => a.status === "Unscheduled").length;
  const completedCount = appointments.filter(a => a.status === "Completed").length;
  const cancelledCount = appointments.filter(a => a.status === "Cancelled").length;

  return (
    <div className="p-6 space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Service Appointments</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track service appointments</p>
        </div>
        <button
          onClick={openAssignNew}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm hover:opacity-90 transition-all"
          style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}
        >
          <Plus className="w-4 h-4" />
          Assign Service
        </button>
      </div>

      {/* Unscheduled Work Orders */}
      {unscheduledWorkOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-800">Unscheduled Work Orders</h3>
            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              {unscheduledWorkOrders.length} pending
            </span>
          </div>
          <div className="space-y-2">
            {unscheduledWorkOrders.slice(0, 3).map((wo) => (
              <div key={wo.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{wo.customer}</p>
                  <p className="text-xs text-muted-foreground">{wo.serviceType} • {wo.id}</p>
                </div>
                <button
                  onClick={() => openAssignForWorkOrder(wo)}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  Assign Service
                </button>
              </div>
            ))}
            {unscheduledWorkOrders.length > 3 && (
              <p className="text-xs text-amber-600 text-center pt-2">
                +{unscheduledWorkOrders.length - 3} more work orders need assignment
              </p>
            )}
          </div>
        </div>
      )}
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Scheduled</p>
          <p className="text-lg font-bold text-card-foreground mt-1">{scheduledCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Unscheduled</p>
          <p className="text-lg font-bold text-card-foreground mt-1">{unscheduledCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-lg font-bold text-card-foreground mt-1">{completedCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Cancelled</p>
          <p className="text-lg font-bold text-card-foreground mt-1">{cancelledCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Unscheduled Work Orders</p>
          <p className="text-lg font-bold text-card-foreground mt-1">{unscheduledWorkOrders.length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {(["All", "Scheduled", "Unscheduled", "Overdue", "Completed", "Cancelled"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setStatusFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
                statusFilter === t
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:ml-auto sm:justify-end">
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setShowDateDropdown((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                showDateDropdown ? "border-primary/30 ring-2 ring-primary/10" : "border-border"
              } bg-card hover:bg-secondary`}
              aria-haspopup="listbox"
              aria-expanded={showDateDropdown}
            >
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-card-foreground">{dateFilter}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showDateDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDateDropdown && (
              <div className="absolute left-0 top-full mt-2 bg-card border border-border rounded-xl shadow-lg z-20 min-w-[160px] p-1">
                {(["All", "Today", "Week", "Month"] as const).map((opt) => {
                  const active = dateFilter === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setDateFilter(opt);
                        setShowDateDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                        active ? "bg-primary/5 text-primary font-semibold" : "text-card-foreground hover:bg-secondary"
                      }`}
                      role="option"
                      aria-selected={active}
                    >
                      <span>{opt}</span>
                      {active && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-border bg-card text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>
      {/* Appointments Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technician</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schedule</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm">No appointments found</p>
                      <p className="text-xs">Try adjusting your filters or create a new appointment</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const workOrder = getWorkOrder(apt.workOrderId);
                  const overdue = isOverdue(apt);
                  
                  return (
                    <tr key={apt.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-card-foreground">
                            {workOrder?.serviceType || "Unknown Service"}
                          </p>
                          <p className="text-xs text-muted-foreground">{apt.workOrderId}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-card-foreground">
                            {workOrder?.customer || "Unknown Customer"}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">
                              {workOrder?.address || "No address"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-card-foreground">{apt.employeeName}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {apt.date && apt.time ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-card-foreground">
                                {formatDateTime(apt.date, apt.time)}
                              </span>
                            </div>
                            {overdue && (
                              <div className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-destructive" />
                                <span className="text-xs text-destructive font-medium">Overdue</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unscheduled</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge 
                          status={overdue ? "error" : statusMap[apt.status]} 
                          text={overdue ? "Overdue" : apt.status} 
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedService({ ...apt, workOrder })}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditAppointment(apt)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit Appointment"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {apt.status !== "Cancelled" && apt.status !== "Completed" && (
                            <button
                              onClick={() => openCancel(apt)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              title="Cancel Appointment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Service Details Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-300 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen p-4">
            <div className="bg-card rounded-xl shadow-lg w-full max-w-2xl max-h-[95vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden my-4">
              <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">Service Details</h3>
                  <p className="text-sm text-muted-foreground mt-1">View appointment information</p>
                </div>
                <button 
                  onClick={closeServiceModal}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                {/* Work Order Info */}
                {selectedService.workOrder && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs font-medium text-primary mb-2">Work Order</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-card-foreground">{selectedService.workOrder.id}</span>
                        <span className="text-sm font-semibold text-card-foreground">{selectedService.workOrder.customer}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {selectedService.workOrder.address}
                      </div>
                    </div>
                  </div>
                )}

                {/* Appointment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Service Type</label>
                    <p className="text-sm text-card-foreground">{selectedService.workOrder?.serviceType || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Technician</label>
                    <p className="text-sm text-card-foreground">{selectedService.employeeName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Date & Time</label>
                    <p className="text-sm text-card-foreground">
                      {selectedService.date && selectedService.time 
                        ? formatDateTime(selectedService.date, selectedService.time)
                        : "Unscheduled"
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                    <StatusBadge 
                      status={statusMap[selectedService.status]} 
                      text={selectedService.status} 
                    />
                  </div>
                </div>

                {/* Additional Info */}
                {(selectedService.subject || selectedService.instructions) && (
                  <div className="space-y-4">
                    {selectedService.subject && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Subject</label>
                        <p className="text-sm text-card-foreground">{selectedService.subject}</p>
                      </div>
                    )}
                    {selectedService.instructions && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">Instructions</label>
                        <p className="text-sm text-card-foreground whitespace-pre-wrap">{selectedService.instructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tasks */}
                {selectedService.tasks && selectedService.tasks.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-3">Tasks ({selectedService.tasks.length})</label>
                    <div className="space-y-2">
                      {selectedService.tasks.map((task, idx) => (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/20">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-card-foreground">{task.title}</p>
                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                              {task.closingDateTime && <span>Close: {new Date(task.closingDateTime).toLocaleString()}</span>}
                              {task.branch && <span>Branch: {task.branch}</span>}
                              {task.staff && <span>Staff: {task.staff}</span>}
                              {task.attachments && task.attachments.length > 0 && <span>Attachments: {task.attachments.length}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Appointment Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/20 z-50 animate-in fade-in duration-300 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-card rounded-xl shadow-lg w-full max-w-md animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-bold text-card-foreground">Cancel Appointment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to cancel this service appointment?
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-sm font-medium text-card-foreground">
                    {getWorkOrder(cancelTarget.workOrderId)?.customer} - {getWorkOrder(cancelTarget.workOrderId)?.serviceType}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Technician: {cancelTarget.employeeName}
                  </p>
                  {cancelTarget.date && cancelTarget.time && (
                    <p className="text-xs text-muted-foreground">
                      Scheduled: {formatDateTime(cancelTarget.date, cancelTarget.time)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">
                    Cancellation Reason (Optional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-border">
                <button
                  onClick={closeCancel}
                  className="flex-1 h-10 border border-border text-card-foreground text-sm font-medium hover:text-primary transition-colors rounded-lg"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 h-10 border border-destructive/20 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors rounded-lg inline-flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;