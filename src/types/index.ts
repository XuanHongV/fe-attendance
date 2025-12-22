export interface Employee {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  status: 'active' | 'inactive';
  department?: string;
  position?: string;
  walletAddress?: string;
  avatar?: string;
  joinDate?: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; 
  endTime: string;   
  color_code?: string;
  allowance?: number;
  type?: string;
}

export interface ShiftAssignment {
  _id: string;
  user: { _id: string; fullName: string; email: string } | string; 
  shift: { _id: string; name: string; color_code?: string } | string;
  work_date: string;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar?: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  workHours: number;
  status: 'verified' | 'pending_approval' | 'ai_alert' | 'absent';
}

export interface PayrollTransaction {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  payDate: string;
  status: 'confirmed' | 'pending' | 'failed';
  blockchainHash: string;
  gasUsed: number;
}

export interface SmartContract {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'paused';
  deployer: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  totalHoursWorked: number;
  totalPayrollProcessed: number;
  pendingIssues: number;
}