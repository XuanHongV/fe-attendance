import api from './apiService'; 
import { Shift, ShiftAssignment } from '../types';

export const shiftService = {
  getShifts: async () => {
    const response = await api.get<Shift[]>('/shifts');
    return response.data;
  },

  createShift: async (data: { name: string; startTime: string; endTime: string }) => {
    const response = await api.post<Shift>('/shifts', data);
    return response.data;
  },

  getAssignments: async (date?: string) => {
    const params = date ? { date } : {};
    const response = await api.get<ShiftAssignment[]>('/shift-assignments', { params });
    return response.data;
  },

  assignShift: async (data: { userId: string; shiftId: string; date: string }) => {
    const response = await api.post('/shift-assignments', data);
    return response.data;
  }
};