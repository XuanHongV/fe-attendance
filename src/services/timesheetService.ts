import api from './apiService';

// Types based on backend schemas
export type TimeSheetStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export interface TimeSheet {
  _id: string;
  start_date: string;
  end_date?: string;
  status: TimeSheetStatus;
  created_by: string | { _id: string; fullName: string; email: string };
  company: string | { _id: string; code: string; name: string };
  note?: string;
  details?: TimeSheetDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSheetDetail {
  _id: string;
  timeSheet: string | TimeSheet;
  user: {
    _id: string;
    fullName: string;
    email: string;
    wallet_address: string;
    avatar?: string;
  };
  total_working_hours?: number;
  total_present_days?: number;
  total_late_minutes?: number;
  total_amount?: number;
  attendances?: any[];
  shift_assignments?: any[];
  note?: string;
  pay_status?: 'UNPAID' | 'PAID';
  approved_by?: string | { _id: string; fullName: string };
  approved_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTimeSheetDto {
  startDate: string; // ISO date string
  endDate?: string; // ISO date string (optional)
  note?: string;
}

export interface CloseTimeSheetDto {
  endDate?: string; // ISO date string (optional)
}

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface PayrollPayment {
  _id: string;
  company: string | { _id: string; name?: string; code?: string };
  timeSheetDetail: string | TimeSheetDetail;
  user:
    | string
    | { _id: string; fullName?: string; email?: string; wallet_address?: string };
  amount_vnd: number;
  amount_token: number;
  exchange_rate: number;
  currency: string; // default ETH
  status: PaymentStatus;
  from_address?: string;
  to_address?: string;
  transaction_hash?: string;
  network?: string;
  error_reason?: string;
  paid_at?: string;
  created_by?: string | { _id: string; fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
}

export const timesheetService = {
  /**
   * Lấy danh sách tất cả timesheet của company hiện tại
   * GET /timeSheets
   */
  getAll: async (): Promise<TimeSheet[]> => {
    const res = await api.get<TimeSheet[]>('/timeSheets');
    return res.data;
  },

  create: async (data: CreateTimeSheetDto): Promise<TimeSheet> => {
    const res = await api.post<TimeSheet>('/timeSheets', data);
    return res.data;
  },

  generateDetails: async (timeSheetId: string): Promise<TimeSheetDetail[]> => {
    const res = await api.post<TimeSheetDetail[]>(`/timeSheets/generate/${timeSheetId}`);
    return res.data;
  },

  getDetails: async (timeSheetId: string): Promise<TimeSheetDetail[]> => {
    const res = await api.get<TimeSheetDetail[]>(`/timeSheets/${timeSheetId}/details`);
    return res.data;
  },

  close: async (timeSheetId: string, data?: CloseTimeSheetDto): Promise<TimeSheet> => {
    const res = await api.patch<TimeSheet>(
      `/timeSheets/${timeSheetId}/close`,
      data || {}
    );
    return res.data;
  },

  delete: async (timeSheetId: string): Promise<void> => {
    await api.delete(`/timeSheets/${timeSheetId}`);
  },

  payrollEmployee: async (detailId: string): Promise<PayrollPayment> => {
    const res = await api.post<PayrollPayment>('/payroll-payment/pay-salary', {
      detailId,
    });
    return res.data;
  },

  /**
   * Xem biên lai trả lương theo TimeSheetDetail
   */
  getPayrollReceipt: async (detailId: string): Promise<PayrollPayment> => {
    const res = await api.get<PayrollPayment>(`/payroll-payment/detail/${detailId}`);
    return res.data;
  },
};

export default timesheetService;
