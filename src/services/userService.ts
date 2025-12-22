import api from './apiService';
import { Employee } from '../types';

export type CreateEmployeeDto = {
    fullName: string;
    email: string;
    password?: string;
    role?: 'ADMIN' | 'STAFF' | string;
    companyId?: string;
    companyCode?: string;
    position?: string;
    department?: string;
    joinDate?: string;
    walletAddress?: string;
};

export type UpdateUserDto = Partial<
    CreateEmployeeDto & { status?: 'active' | 'inactive' }
>;

export const userService = {
    createEmployee: async (data: CreateEmployeeDto): Promise<Employee> => {
        const res = await api.post<Employee>('/users', data);
        return res.data;
    },

    activateUser: async (id: string): Promise<Employee> => {
        const res = await api.patch<Employee>(`/users/activate/${id}`);
        return res.data;
    },

    findAllByCompanyCode: async (companyCode: string): Promise<Employee[]> => {
        const res = await api.get<Employee[]>(`/users/company/${companyCode}`);
        return res.data;
    },

    findAllByCompanyId: async (companyId: string): Promise<Employee[]> => {
        const res = await api.get<Employee[]>(`/users/company/id/${companyId}`);
        return res.data;
    },


    getAllRoles: async (): Promise<string[]> => {
        const res = await api.get<string[]>('/users/roles');
        return res.data;
    },

    getUsersByRole: async (roleName: string, companyId: string): Promise<Employee[]> => {
        const res = await api.get<Employee[]>(
            `/users/role/${encodeURIComponent(roleName)}/company/${companyId}`
        );
        return res.data;
    },

    getUser: async (id: string): Promise<Employee> => {
        const res = await api.get<Employee>(`/users/${id}`);
        return res.data;
    },

    updateUser: async (id: string, data: UpdateUserDto): Promise<Employee> => {
        const res = await api.patch<Employee>(`/users/${id}`, data);
        return res.data;
    },

    removeUser: async (id: string): Promise<{ success?: boolean; message?: string }> => {
        const res = await api.delete(`/users/${id}`);
        return res.data;
    },
};

export default userService;
