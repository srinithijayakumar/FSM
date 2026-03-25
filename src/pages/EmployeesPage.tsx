import { Search, Clock, Briefcase, AlertCircle, Plus } from "lucide-react";
import { useState } from "react";
import { useEmployeesStore, type Employee } from "@/store/employeesStore";
import { EmployeeFormModal } from "@/components/EmployeeFormModal";

const EmployeesPage = () => {
  const { employees } = useEmployeesStore();
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const filtered = employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));

  const getProductivityColor = (serviceHours: number, totalHours: number) => {
    const ratio = serviceHours / totalHours;
    if (ratio >= 0.8) return "text-success";
    if (ratio >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getProductivityBg = (serviceHours: number, totalHours: number) => {
    const ratio = serviceHours / totalHours;
    if (ratio >= 0.8) return "bg-success/10";
    if (ratio >= 0.6) return "bg-warning/10";
    return "bg-destructive/10";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-card-foreground">Employees</h2>
          <p className="text-sm text-muted-foreground">Track productivity and time management</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-[0px_5px_12px_rgba(39,47,158,0.2)] transition-all hover:opacity-90"
          style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-card text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Productivity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((e) => {
          const productivityRatio = (e.serviceHours / e.totalHours) * 100;
          return (
            <div
              key={e.id}
              onClick={() => setSelectedEmployee(e)}
              className="bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <span className="text-lg font-bold text-primary">{e.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-card-foreground">{e.name}</h3>
                  <p className="text-xs text-muted-foreground">{e.role}</p>
                </div>
              </div>

              {/* Time Summary */}
              <div className="space-y-3 mb-4 pb-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Total Hours
                  </span>
                  <span className="text-sm font-semibold text-card-foreground">{e.totalHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    Service Hours
                  </span>
                  <span className={`text-sm font-semibold ${getProductivityColor(e.serviceHours, e.totalHours)}`}>
                    {e.serviceHours}h
                  </span>
                </div>
              </div>

              {/* Productivity Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className={`${getProductivityBg(e.serviceHours, e.totalHours)} rounded-lg p-2 text-center`}>
                  <p className={`text-xs font-bold ${getProductivityColor(e.serviceHours, e.totalHours)}`}>
                    {productivityRatio.toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">Productive</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <p className="text-xs font-bold text-card-foreground">{e.servicesCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">Services</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <p className="text-xs font-bold text-card-foreground">{e.avgServiceTime}h</p>
                  <p className="text-[10px] text-muted-foreground">Avg/Service</p>
                </div>
              </div>

              {/* Time Breakdown Bar */}
              <div className="space-y-2">
                <div className="flex h-2 rounded-full overflow-hidden bg-secondary/30 gap-0.5">
                  <div
                    className="bg-success rounded-full"
                    style={{ width: `${(e.serviceHours / e.totalHours) * 100}%` }}
                  />
                  <div
                    className="bg-warning rounded-full"
                    style={{ width: `${(e.breakHours / e.totalHours) * 100}%` }}
                  />
                  <div
                    className="bg-secondary rounded-full"
                    style={{ width: `${(e.idleHours / e.totalHours) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Service: {e.serviceHours}h</span>
                  <span>Break: {e.breakHours}h</span>
                  <span>Idle: {e.idleHours}h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Employee Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 animate-in fade-in duration-300 p-4 overflow-hidden">
          <div className="bg-card rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-card flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{selectedEmployee.name[0]}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-card-foreground">{selectedEmployee.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.role}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors flex-shrink-0"
              >
                <span className="text-2xl text-muted-foreground">×</span>
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6 min-h-0">
              {/* Time Tracking */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4">Time Tracking</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <span className="text-sm text-muted-foreground">Clock In</span>
                    <span className="text-sm font-semibold text-card-foreground">{selectedEmployee.clockIn}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <span className="text-sm text-muted-foreground">Clock Out</span>
                    <span className="text-sm font-semibold text-card-foreground">{selectedEmployee.clockOut}</span>
                  </div>
                </div>
              </div>

              {/* Hours Breakdown */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4">Hours Breakdown</h4>
                <div className="space-y-4">
                  {/* Total Hours */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Total Hours Worked</span>
                      <span className="text-lg font-bold text-primary">{selectedEmployee.totalHours}h</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>

                  {/* Service Hours */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Service Hours</span>
                      <span className="text-lg font-bold text-success">{selectedEmployee.serviceHours}h</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full"
                        style={{ width: `${(selectedEmployee.serviceHours / selectedEmployee.totalHours) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((selectedEmployee.serviceHours / selectedEmployee.totalHours) * 100).toFixed(0)}% of total time
                    </p>
                  </div>

                  {/* Break Hours */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Break Time</span>
                      <span className="text-lg font-bold text-warning">{selectedEmployee.breakHours}h</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{ width: `${(selectedEmployee.breakHours / selectedEmployee.totalHours) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Idle Hours */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground">Idle Time</span>
                      <span className="text-lg font-bold text-muted-foreground">{selectedEmployee.idleHours}h</span>
                    </div>
                    <div className="h-3 rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full"
                        style={{ width: `${(selectedEmployee.idleHours / selectedEmployee.totalHours) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Performance */}
              <div className="bg-secondary/30 rounded-xl p-5 border border-border">
                <h4 className="text-sm font-semibold text-card-foreground mb-4">Service Performance</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <span className="text-sm text-muted-foreground">Services Completed</span>
                    <span className="text-sm font-semibold text-card-foreground">{selectedEmployee.servicesCompleted}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <span className="text-sm text-muted-foreground">Avg Time per Service</span>
                    <span className="text-sm font-semibold text-card-foreground">{selectedEmployee.avgServiceTime}h</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                    <span className="text-sm text-muted-foreground">Productivity Rate</span>
                    <span className="text-sm font-semibold text-success">
                      {((selectedEmployee.serviceHours / selectedEmployee.totalHours) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Insights */}
              {selectedEmployee.idleHours > 1.5 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning">High Idle Time</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedEmployee.name} has {selectedEmployee.idleHours}h of idle time. Consider optimizing schedule.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-border bg-card flex-shrink-0">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="flex-1 h-10 border border-border text-card-foreground text-sm font-medium hover:text-primary transition-colors rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Form Modal */}
      <EmployeeFormModal
        open={showAddModal}
        mode="create"
        onClose={() => setShowAddModal(false)}
        onSaved={() => setShowAddModal(false)}
      />
    </div>
  );
};

export default EmployeesPage;
