import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Employee = {
  id: string;
  name: string;
  phone: string;
  role: string;
  projects: number;
  cashBalance: string;
  performance: string;
  clockIn: string;
  clockOut: string;
  totalHours: number;
  serviceHours: number;
  breakHours: number;
  idleHours: number;
  servicesCompleted: number;
  avgServiceTime: number;
};

interface EmployeesStore {
  employees: Employee[];
  addEmployee: (employee: Employee) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  getEmployee: (id: string) => Employee | undefined;
  getNextEmployeeId: () => string;
}

const initialEmployees: Employee[] = [
  {
    id: "EMP-1001",
    name: "Safeeq",
    phone: "9876543210",
    role: "Senior Technician",
    projects: 3,
    cashBalance: "₹ 5,800",
    performance: "92%",
    clockIn: "09:00 AM",
    clockOut: "06:30 PM",
    totalHours: 9.5,
    serviceHours: 7.5,
    breakHours: 1,
    idleHours: 1,
    servicesCompleted: 3,
    avgServiceTime: 2.5,
  },
  {
    id: "EMP-1002",
    name: "Rajesh",
    phone: "9876543211",
    role: "Technician",
    projects: 2,
    cashBalance: "₹ 2,100",
    performance: "88%",
    clockIn: "09:15 AM",
    clockOut: "06:00 PM",
    totalHours: 8.75,
    serviceHours: 6.5,
    breakHours: 1.5,
    idleHours: 0.75,
    servicesCompleted: 2,
    avgServiceTime: 3.25,
  },
  {
    id: "EMP-1003",
    name: "Arun",
    phone: "9876543212",
    role: "Technician",
    projects: 2,
    cashBalance: "₹ 950",
    performance: "85%",
    clockIn: "09:30 AM",
    clockOut: "05:45 PM",
    totalHours: 8.25,
    serviceHours: 5.5,
    breakHours: 1.5,
    idleHours: 1.25,
    servicesCompleted: 2,
    avgServiceTime: 2.75,
  },
  {
    id: "EMP-1004",
    name: "Vikram",
    phone: "9876543213",
    role: "Junior Technician",
    projects: 1,
    cashBalance: "₹ 0",
    performance: "78%",
    clockIn: "10:00 AM",
    clockOut: "05:30 PM",
    totalHours: 7.5,
    serviceHours: 4.5,
    breakHours: 1.5,
    idleHours: 1.5,
    servicesCompleted: 1,
    avgServiceTime: 4.5,
  },
];

export const useEmployeesStore = create<EmployeesStore>()(
  persist(
    (set, get) => ({
      employees: initialEmployees,

      addEmployee: (employee) =>
        set((state) => ({
          employees: [...state.employees, employee],
        })),

      updateEmployee: (id, updates) =>
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

      deleteEmployee: (id) =>
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id),
        })),

      getEmployee: (id) => get().employees.find((e) => e.id === id),

      getNextEmployeeId: () => {
        const nums = get()
          .employees.map((e) => Number(e.id.split("-")[1]))
          .filter((n) => Number.isFinite(n));
        const nextNum = (nums.length ? Math.max(...nums) : 1000) + 1;
        return `EMP-${nextNum}`;
      },
    }),
    { name: "employees-store", version: 0 },
  ),
);