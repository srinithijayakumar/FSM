import { StatusBadge } from "@/components/StatusBadge";
import { Search, X, Edit2, Plus, Clipboard, Calendar, User, MapPin, Phone, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useProjectsStore, type WorkOrder, type WorkOrderStatus } from "@/store/projectsStore";
import { useLeadsStore } from "@/store/leadsStore";
import { CustomerFormModal } from "@/components/CustomerFormModal";
import { useCustomersStore, type Customer } from "@/store/customersStore";

function buildCustomerName(c: Customer) {
  return `${c.firstName} ${c.lastName}`.trim().replace(/\s+/g, " ");
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/g).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

const statusMap = {
  Scheduled: "success",
  Open: "warning",
  Completed: "neutral",
} as const;

const statusLabels = {
  Scheduled: "Scheduled & Active",
  Open: "Not Yet Scheduled",
  Completed: "Completed",
} as const;

const ProjectsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { workOrders, addWorkOrder, getNextWorkOrderId, updateWorkOrder } = useProjectsStore();
  const { getLead, updateLead } = useLeadsStore();
  const { customers } = useCustomersStore();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"All" | "Due Today">("All");
  const [selectedProject, setSelectedProject] = useState<WorkOrder | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProject, setEditingProject] = useState<WorkOrder | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [convertedLeadName, setConvertedLeadName] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [customerPrefill, setCustomerPrefill] = useState<Partial<Omit<Customer, "id">> | undefined>(undefined);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    services: [] as string[],
    contract: "",
    estimatedValue: "",
    notes: ""
  });
  const [newService, setNewService] = useState("");

  // Edit form data
  const [editFormData, setEditFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    serviceType: "",
    frequency: "",
    totalValue: "",
    paidAmount: "",
    assignedTech: "",
    notes: "",
    status: "Open" as WorkOrderStatus
  });

  useEffect(() => {
    const convertLeadId = searchParams.get("convertLeadId");
    if (convertLeadId) {
      const lead = getLead(parseInt(convertLeadId));
      if (lead) {
        const metaLines: string[] = [];
        if (lead.urgencyLevel) metaLines.push(`Urgency: ${lead.urgencyLevel}`);
        if (lead.leadSource) metaLines.push(`Lead Source: ${lead.leadSource}`);
        if (lead.branch) metaLines.push(`Branch: ${lead.branch}`);
        if (lead.salesExecutive) metaLines.push(`Sales Executive: ${lead.salesExecutive}`);
        if (lead.expectedDateTime) metaLines.push(`Expected Date & Time: ${new Date(lead.expectedDateTime).toLocaleString()}`);
        const baseNotes = lead.quoteNotes || lead.notes || "";
        const notes = metaLines.length ? (baseNotes ? `${baseNotes}\n${metaLines.join("\n")}` : metaLines.join("\n")) : baseNotes;
        const value = typeof lead.quoteAmount === "number" ? lead.quoteAmount : typeof lead.amount === "number" ? lead.amount : null;
        setSelectedCustomerId(null);
        setFormData({
          customerName: lead.name || "",
          phone: lead.phone || "",
          address: lead.address || "",
          services: lead.services || [],
          contract: lead.quoteContract || "",
          estimatedValue: value !== null ? value.toString() : "",
          notes
        });
        setShowCreateForm(true);
      }
    }
  }, [searchParams, getLead]);

  const selectedCustomer = selectedCustomerId ? customers.find((c) => c.id === selectedCustomerId) : undefined;
  const customerQuery = formData.customerName.trim().toLowerCase();
  const customerSuggestions =
    customerQuery.length === 0
      ? []
      : customers
          .map((c) => {
            const name = buildCustomerName(c);
            const nameLower = name.toLowerCase();
            const idLower = c.id.toLowerCase();
            const mobileLower = c.mobile.toLowerCase();
            const score =
              (nameLower.startsWith(customerQuery) ? 3 : nameLower.includes(customerQuery) ? 2 : 0) +
              (idLower.includes(customerQuery) ? 1 : 0) +
              (mobileLower.includes(customerQuery) ? 1 : 0);
            return { c, name, score };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);

  const applyCustomerToForm = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setFormData((prev) => ({
      ...prev,
      customerName: buildCustomerName(c),
      phone: c.mobile || prev.phone,
      address: c.siteAddress || prev.address,
    }));
  };

  const today = new Date();
  const isSameLocalDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const parseNextServiceDate = (value: string) => {
    const ts = Date.parse(value);
    if (Number.isNaN(ts)) return null;
    return new Date(ts);
  };

  const isDueToday = (wo: WorkOrder) => {
    const date = parseNextServiceDate(wo.nextService);
    if (!date) return false;
    return isSameLocalDay(date, today);
  };

  const filtered = workOrders.filter((wo) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      wo.customer.toLowerCase().includes(q) ||
      wo.id.toLowerCase().includes(q) ||
      wo.address.toLowerCase().includes(q);

    const matchDate = dateFilter === "All" ? true : isDueToday(wo);

    return matchSearch && matchDate;
  });

  const closeModal = () => setSelectedProject(null);

  const handleAddService = () => {
    if (newService.trim() && !formData.services.includes(newService)) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, newService]
      }));
      setNewService("");
    }
  };

  const handleRemoveService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const getPaymentProgress = (project: WorkOrder) => {
    const total = parseInt(project.totalValue.replace(/[₹,\s]/g, ""));
    const paid = parseInt(project.paidAmount.replace(/[₹,\s]/g, ""));
    return Math.round((paid / total) * 100);
  };

  const handleEditProject = (project: WorkOrder) => {
    setEditingProject(project);
    setEditFormData({
      customerName: project.customer,
      phone: project.phone,
      address: project.address,
      serviceType: project.serviceType,
      frequency: project.frequency,
      totalValue: project.totalValue.replace(/[₹,\s]/g, ""),
      paidAmount: project.paidAmount.replace(/[₹,\s]/g, ""),
      assignedTech: project.assignedTech,
      notes: project.notes,
      status: project.status
    });
    setShowEditForm(true);
  };

  const handleUpdateProject = () => {
    if (!editFormData.customerName.trim() || !editFormData.phone.trim() || !editFormData.address.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingProject) {
      updateWorkOrder(editingProject.id, {
        customer: editFormData.customerName,
        phone: editFormData.phone,
        address: editFormData.address,
        serviceType: editFormData.serviceType,
        frequency: editFormData.frequency,
        totalValue: `₹ ${parseInt(editFormData.totalValue).toLocaleString()}`,
        paidAmount: `₹ ${parseInt(editFormData.paidAmount).toLocaleString()}`,
        assignedTech: editFormData.assignedTech,
        notes: editFormData.notes,
        status: editFormData.status
      });

      toast.success("Work order updated successfully!");
      setShowEditForm(false);
      setEditingProject(null);
      setEditFormData({
        customerName: "",
        phone: "",
        address: "",
        serviceType: "",
        frequency: "",
        totalValue: "",
        paidAmount: "",
        assignedTech: "",
        notes: "",
        status: "Open"
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-sm font-medium text-success">
            ✓ Lead "{convertedLeadName}" has been converted to a Work Order. Now assign a technician to start the service.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-card-foreground">Work Orders</h2>
          <p className="text-sm text-muted-foreground">View and manage all work orders and AMCs.</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 text-white shadow-[0px_5px_12px_rgba(39,47,158,0.2)] transition-all"
                style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}>
          <Plus className="w-4 h-4" />
          Create Work Order
        </button>
      </div>

      {/* Create Work Order Form */}
      {showCreateForm && (
        <div className="bg-card rounded-xl border border-border shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-card-foreground">Create New Work Order</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="text-xs font-medium text-muted-foreground block">Customer Name</label>
                  <button
                    type="button"
                    onClick={() => {
                      const { firstName, lastName } = splitName(formData.customerName);
                      setCustomerPrefill({
                        firstName,
                        lastName,
                        mobile: formData.phone,
                        siteAddress: formData.address,
                      });
                      setShowAddCustomer(true);
                    }}
                    className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                  >
                    Add Customer
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={(e) => {
                      setSelectedCustomerId(null);
                      setFormData({ ...formData, customerName: e.target.value });
                      setIsCustomerPickerOpen(true);
                    }}
                    onFocus={() => setIsCustomerPickerOpen(true)}
                    onBlur={() => setTimeout(() => setIsCustomerPickerOpen(false), 120)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
                  />

                  {isCustomerPickerOpen && selectedCustomerId === null && customerSuggestions.length > 0 && (
                    <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                      {customerSuggestions.map(({ c, name }) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            applyCustomerToForm(c);
                            setIsCustomerPickerOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-card-foreground truncate">{name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.mobile || "—"} • {c.siteAddress || "—"}</p>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">{c.id}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="mt-2 flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-card-foreground truncate">
                        {selectedCustomer.id} • {selectedCustomer.customerType}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{selectedCustomer.emailAddress || "—"}{selectedCustomer.gstNumber ? ` • ${selectedCustomer.gstNumber}` : ""}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowEditCustomer(true)}
                        className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerId(null)}
                        className="text-xs font-semibold text-muted-foreground hover:text-card-foreground transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
                />
                {selectedCustomer && (
                  <p className="text-xs text-muted-foreground mt-1">Linked to {selectedCustomer.id}. Editing here won’t update customer profile.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Service Address</label>
                <input
                  type="text"
                  placeholder="Enter service address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
                />
                {selectedCustomer && (
                  <p className="text-xs text-muted-foreground mt-1">Auto-filled from customer Site Address. Update if this job is at a different site.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Services (add or remove)</label>
                <div className="flex gap-2 mb-3">
                  <select 
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border">
                    <option value="">Select service to add</option>
                    <option>Cockroach Control</option>
                    <option>Termite Control</option>
                    <option>Bed Bug Treatment</option>
                    <option>Rodent Control</option>
                    <option>General Pest</option>
                    <option>Fumigation</option>
                    <option>Preventive Spray</option>
                    <option>Commercial Pest Control</option>
                    <option>Kitchen Deep Clean</option>
                  </select>
                  <button 
                    onClick={handleAddService}
                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.services.length > 0 ? (
                    formData.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-card-foreground">{service}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveService(index)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove service"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border text-center">
                      <span className="text-xs text-muted-foreground">No services added yet</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Contract</label>
                <select 
                  value={formData.contract}
                  onChange={(e) => setFormData({ ...formData, contract: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border">
                  <option>Select contract</option>
                  <option>One-Time</option>
                  <option>3 Months</option>
                  <option>4 Months</option>
                  <option>1 Year</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Estimated Value (₹)</label>
                <input
                  type="number"
                  placeholder="Enter estimated value"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Special Notes</label>
              <textarea
                placeholder="Add any special instructions or notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 h-10 border border-border text-card-foreground rounded-lg hover:text-primary transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!formData.customerName || !formData.phone || !formData.address || formData.services.length === 0 || !formData.contract || !formData.estimatedValue) {
                    toast.error("Please fill in all required fields and add at least one service");
                    return;
                  }
                  
                  const convertLeadId = searchParams.get("convertLeadId");
                  const lead = convertLeadId ? getLead(parseInt(convertLeadId)) : undefined;
                  const initialStatus = lead?.quoteIsViewed ? ("Scheduled" as const) : ("Open" as const);
                  const newWO = {
                    id: getNextWorkOrderId(),
                    customer: formData.customerName,
                    address: formData.address,
                    start: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                    end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                    status: initialStatus,
                    phone: formData.phone,
                    email: "",
                    serviceType: formData.services.join(", "),
                    frequency: formData.contract,
                    totalValue: `₹ ${parseInt(formData.estimatedValue).toLocaleString()}`,
                    paidAmount: "₹ 0",
                    nextService: "Unassigned",
                    assignedTech: "Unassigned",
                    notes: formData.notes,
                    leadId: convertLeadId ? parseInt(convertLeadId) : undefined
                  };
                  
                  addWorkOrder(newWO);
                  
                  // Update lead status if converting from lead
                  if (convertLeadId) {
                    updateLead(parseInt(convertLeadId), { status: "Converted" });
                  }
                  
                  toast.success("Work Order created successfully!");
                  setShowSuccessMessage(true);
                  setConvertedLeadName(formData.customerName);
                  setShowCreateForm(false);
                  setSelectedCustomerId(null);
                  setFormData({
                    customerName: "",
                    phone: "",
                    address: "",
                    services: [],
                    contract: "",
                    estimatedValue: "",
                    notes: ""
                  });
                  setNewService("");
                  setCustomerPrefill(undefined);
                  setShowEditCustomer(false);
                  setTimeout(() => setShowSuccessMessage(false), 5000);
                }}
                className="flex-1 h-10 text-white rounded-lg hover:opacity-90 shadow-[0px_5px_12px_rgba(39,47,158,0.2)] transition-all font-semibold text-sm"
                style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}
              >
                Create Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomerFormModal
        open={showAddCustomer}
        mode="create"
        prefill={customerPrefill}
        onClose={() => {
          setShowAddCustomer(false);
          setCustomerPrefill(undefined);
        }}
        onSaved={(c) => {
          applyCustomerToForm(c);
          setIsCustomerPickerOpen(false);
          setCustomerPrefill(undefined);
        }}
      />
      <CustomerFormModal
        open={showEditCustomer}
        mode="edit"
        customer={selectedCustomer}
        onClose={() => setShowEditCustomer(false)}
        onSaved={(c) => {
          applyCustomerToForm(c);
          setIsCustomerPickerOpen(false);
        }}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-warning/10 rounded-lg flex-shrink-0">
              <Clipboard className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Not Yet Scheduled</p>
              <p className="text-2xl font-bold text-card-foreground">
                {workOrders.filter((p) => p.status === "Open").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-success/10 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Scheduled & Active</p>
              <p className="text-2xl font-bold text-card-foreground">
                {workOrders.filter((p) => p.status === "Scheduled").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Due Today</p>
              <p className="text-2xl font-bold text-card-foreground">{workOrders.filter(isDueToday).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Completed This Month</p>
              <p className="text-2xl font-bold text-card-foreground">
                {workOrders.filter((p) => p.status === "Completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 card-shadow border border-border">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg flex-shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Total Contract Value</p>
              <p className="text-2xl font-bold text-card-foreground">
                ₹{(workOrders.reduce((sum, p) => sum + parseInt(p.totalValue.replace(/[₹,\s]/g, "")), 0) / 1000).toFixed(0)}K
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or location..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Due Today"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDateFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                dateFilter === t
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-card rounded-xl card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Work Order ID", "Customer", "Service Type", "Status", "Payment", "Next Service", "Edit"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-primary text-sm">{project.id}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-card-foreground text-sm">{project.customer}</div>
                    <div className="text-xs text-muted-foreground mt-1">{project.address}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-card-foreground">{project.serviceType}</div>
                    <div className="text-xs text-muted-foreground mt-1">{project.frequency}</div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge label={statusLabels[project.status]} variant={statusMap[project.status]} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-secondary rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full transition-all"
                          style={{ width: `${getPaymentProgress(project)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{getPaymentProgress(project)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm text-card-foreground">{project.nextService}</div>
                    <div className="text-xs text-muted-foreground mt-1">{project.assignedTech}</div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleEditProject(project)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                      title="Edit work order"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 flex items-start justify-center pt-4 z-50 animate-in fade-in duration-300 p-4 overflow-hidden">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-6xl max-h-[95vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clipboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">{selectedProject.id}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProject.customer}</p>
                </div>
              </div>
              <div className="mt-2">
                <StatusBadge label={statusLabels[selectedProject.status]} variant={statusMap[selectedProject.status]} />
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 hover:bg-secondary rounded-lg transition-colors ml-4 flex-shrink-0"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 p-6 space-y-6 min-h-0">

              {/* Contact Information Card */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Contact Details
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Phone Number</p>
                      <p className="text-sm font-semibold text-card-foreground">{selectedProject.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Service Address</p>
                      <p className="text-sm font-semibold text-card-foreground">{selectedProject.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details Card */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Work Order Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Pest & Service Type</p>
                    <p className="text-sm font-semibold text-card-foreground">{selectedProject.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Frequency</p>
                    <p className="text-sm font-semibold text-card-foreground">{selectedProject.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Assigned Technician</p>
                    <p className="text-sm font-semibold text-card-foreground">{selectedProject.assignedTech}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Next Appointment</p>
                    <p className="text-sm font-semibold text-primary">{selectedProject.nextService}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information Card */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Payment Status
                </h4>
                <div className="space-y-4">
                  {/* Payment Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-card rounded-lg p-4 text-center border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Total Value</p>
                      <p className="text-lg font-bold text-card-foreground">{selectedProject.totalValue}</p>
                    </div>
                    <div className="bg-success/10 rounded-lg p-4 text-center border border-success/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Paid Amount</p>
                      <p className="text-lg font-bold text-success">{selectedProject.paidAmount}</p>
                    </div>
                    <div className="bg-warning/10 rounded-lg p-4 text-center border border-warning/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Pending</p>
                      <p className="text-lg font-bold text-warning">
                        ₹{(parseInt(selectedProject.totalValue.replace(/[₹,\s]/g, '')) - parseInt(selectedProject.paidAmount.replace(/[₹,\s]/g, ''))).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-card-foreground">Payment Progress</span>
                      <span className="text-sm font-bold text-primary">{getPaymentProgress(selectedProject)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${getPaymentProgress(selectedProject)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contract Details Card */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Work Order Period
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="text-xs font-medium text-primary mb-2">Work Order Start</p>
                    <p className="text-sm font-bold text-card-foreground">{selectedProject.start}</p>
                  </div>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Work Order End</p>
                    <p className="text-sm font-bold text-card-foreground">{selectedProject.end}</p>
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4">Special Notes</h4>
                <div className="bg-card rounded-lg p-4 border border-border">
                  <p className="text-sm text-card-foreground leading-relaxed">{selectedProject.notes}</p>
                </div>
              </div>

            </div>

            {/* Footer with Action Buttons */}
            <div className="flex-shrink-0 border-t border-border bg-card">
              <div className="flex flex-col sm:flex-row gap-3 p-6">
                <button
                  onClick={closeModal}
                  className="flex-1 h-10 border border-border text-card-foreground rounded-lg hover:text-primary transition-colors font-medium text-sm"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    closeModal();
                    navigate(`/services?workOrderId=${selectedProject.id}`);
                  }}
                  className="flex-1 h-10 text-white rounded-lg hover:opacity-90 shadow-[0px_5px_12px_rgba(39,47,158,0.2)] transition-all font-semibold text-sm"
                  style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}>
                  Assign Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Work Order Form Modal */}
      {showEditForm && editingProject && (
        <div className="fixed inset-0 flex items-start justify-center pt-4 z-50 animate-in fade-in duration-300 p-4 overflow-hidden">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-4xl max-h-[95vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-card-foreground">Edit Work Order</h3>
                <p className="text-xs text-muted-foreground mt-1">Update work order information</p>
              </div>
              <button 
                onClick={() => {
                  setShowEditForm(false);
                  setEditingProject(null);
                  setEditFormData({
                    customerName: "",
                    phone: "",
                    address: "",
                    serviceType: "",
                    frequency: "",
                    totalValue: "",
                    paidAmount: "",
                    assignedTech: "",
                    notes: "",
                    status: "Open"
                  });
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-0">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Customer Name</label>
                  <input 
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    placeholder="Customer name" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
                  <input 
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    placeholder="Phone number" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                  <input 
                    value={editFormData.address}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    placeholder="Service address" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Service Type</label>
                  <input 
                    value={editFormData.serviceType}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, serviceType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    placeholder="Service type" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Frequency</label>
                  <select
                    value={editFormData.frequency}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
                  >
                    <option value="">Select frequency</option>
                    <option value="One-Time">One-Time</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Total Value (₹)</label>
                  <input 
                    type="number"
                    value={editFormData.totalValue}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, totalValue: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    placeholder="Total value" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Paid Amount (₹)</label>
                  <input 
                    type="number"
                    value={editFormData.paidAmount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    placeholder="Paid amount" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Assigned Technician</label>
                  <input 
                    value={editFormData.assignedTech}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, assignedTech: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    placeholder="Technician name" 
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as WorkOrderStatus }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border"
                  >
                    <option value="Open">Open</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                  <textarea 
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border" 
                    rows={3} 
                    placeholder="Additional notes..." 
                  />
                </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer with Buttons */}
            <div className="flex-shrink-0 border-t border-border bg-card">
              <div className="flex gap-3 p-6">
                <button 
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingProject(null);
                    setEditFormData({
                      customerName: "",
                      phone: "",
                      address: "",
                      serviceType: "",
                      frequency: "",
                      totalValue: "",
                      paidAmount: "",
                      assignedTech: "",
                      notes: "",
                      status: "Open"
                    });
                  }}
                  className="flex-1 h-10 border border-border text-card-foreground text-sm font-medium hover:text-primary transition-colors rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateProject}
                  className="flex-1 h-10 text-sm font-semibold hover:opacity-90 text-white shadow-[0px_5px_12px_rgba(39,47,158,0.2)] transition-all rounded-lg" 
                  style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}
                >
                  Update Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
