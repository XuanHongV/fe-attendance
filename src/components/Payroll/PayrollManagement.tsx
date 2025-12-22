import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Search, 
  Download, 
  CheckCircle, 
  Clock, 
  CreditCard,
  User,
  ArrowUpRight,
  AlertTriangle,
  FileText
} from 'lucide-react';
import api from '../../services/apiService';

// Interface mapping với TimeSheetDetail Schema của Backend
interface TimeSheetDetail {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    position: string;
    department: string;
    avatar?: string;
  };
  total_working_hours: number;
  total_present_days: number;
  total_late_minutes: number;
  total_amount: number; // Lương thực lĩnh
  note?: string;
  approved_at?: string; // Nếu có date => Đã duyệt
  createdAt: string;
}

export const PayrollManagement = () => {
  const [payrolls, setPayrolls] = useState<TimeSheetDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const companyId = typeof currentUser?.company === 'string' 
          ? currentUser.company 
          : currentUser?.company?._id;

      if (!companyId) {
          console.error("Thiếu Company ID");
          setLoading(false);
          return;
      }

      const response = await api.get(`/payroll-payment?month=${selectedMonth}`);
      
      if (response.data && Array.isArray(response.data)) {
        setPayrolls(response.data);
      } else {
        setPayrolls([]); 
      }
    } catch (error) {
      console.error("Lỗi tải bảng lương:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const totalPayroll = payrolls.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const paidCount = payrolls.filter(p => p.approved_at).length;
  const pendingCount = payrolls.length - paidCount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const handleApprove = async (id: string) => {
      if(!window.confirm("Xác nhận duyệt chi lương cho nhân viên này?")) return;
      try {
          await api.patch(`/payroll-payment/${id}`, { status: 'PAID' }); 
          setPayrolls(prev => prev.map(p => p._id === id ? { ...p, approved_at: new Date().toISOString() } : p));
      } catch (error) {
           alert("Lỗi khi duyệt lương");
      }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight">
                    {/* <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
                        <DollarSign size={24} />
                    </div> */}
                    Quản Lý Lương
                </h1>
                <p className="text-gray-500 text-sm mt-1 ml-1">Kỳ lương tháng <span className="font-bold text-indigo-700">{selectedMonth}</span></p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        type="month" 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 font-medium transition-all text-sm active:transform active:scale-95">
                    <Download size={18} /> Xuất Excel
                </button>
            </div>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                  <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider relative z-10">Tổng quỹ lương</p>
                  <h3 className="text-4xl font-extrabold text-gray-900 mt-2 relative z-10 tracking-tight">{formatCurrency(totalPayroll)}</h3>
                  <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold relative z-10 bg-green-50 w-fit px-2 py-1 rounded-md">
                      <ArrowUpRight size={14} /> + Dữ liệu thực tế
                  </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Đã thanh toán</p>
                          <h3 className="text-3xl font-bold text-indigo-600 mt-2">{paidCount}</h3>
                          <p className="text-xs text-gray-400 mt-1 font-medium">Nhân viên</p>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                          <CheckCircle size={28} />
                      </div>
                  </div>
                  <div className="mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(paidCount / (payrolls.length || 1)) * 100}%` }}></div>
                  </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Chờ duyệt chi</p>
                          <h3 className="text-3xl font-bold text-amber-500 mt-2">{pendingCount}</h3>
                          <p className="text-xs text-gray-400 mt-1 font-medium">Nhân viên</p>
                      </div>
                      <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                          <Clock size={28} />
                      </div>
                  </div>
             </div>
        </div>

        {/* --- MAIN TABLE --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/30">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm nhân viên..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                            <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Công Thực Tế</th>
                            <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng Giờ</th>
                            <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Đi Muộn</th>
                            <th className="py-4 px-6 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thực Lĩnh</th>
                            <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                             <tr><td colSpan={7} className="text-center py-16 text-gray-500 animate-pulse">Đang tải dữ liệu lương...</td></tr>
                        ) : payrolls.length === 0 ? (
                             <tr>
                                 <td colSpan={7} className="text-center py-16">
                                     <div className="flex flex-col items-center text-gray-400">
                                         <FileText size={48} className="mb-2 opacity-50" />
                                         <p>Chưa có dữ liệu lương cho tháng này.</p>
                                     </div>
                                 </td>
                             </tr>
                        ) : (
                            payrolls.filter(p => p.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map((record) => (
                                <tr key={record._id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 border border-indigo-200 shadow-sm">
                                                {record.user?.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{record.user?.fullName || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500 font-medium">{record.user?.position} • {record.user?.department}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="py-4 px-6 text-center">
                                        <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold text-gray-700 border border-gray-200">
                                            {record.total_present_days} công
                                        </span>
                                    </td>

                                    <td className="py-4 px-6 text-center text-sm font-mono font-medium text-gray-600">
                                        {record.total_working_hours.toFixed(1)}h
                                    </td>

                                    <td className="py-4 px-6 text-center">
                                        {record.total_late_minutes > 0 ? (
                                            <div className="flex flex-col items-center">
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                                                    <AlertTriangle size={12} /> {record.total_late_minutes}p
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">Đúng giờ</span>
                                        )}
                                    </td>

                                    <td className="py-4 px-6 text-right">
                                        <span className="text-sm font-bold text-gray-900 block">{formatCurrency(record.total_amount)}</span>
                                        {record.total_late_minutes > 0 && (
                                            <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1 rounded">Đã trừ phạt</span>
                                        )}
                                    </td>

                                    <td className="py-4 px-6 text-center">
                                        {record.approved_at ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                <CheckCircle size={14} /> Đã Duyệt
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                                <Clock size={14} /> Chờ Duyệt
                                            </span>
                                        )}
                                    </td>

                                    <td className="py-4 px-6 text-center">
                                        {!record.approved_at ? (
                                            <button 
                                                onClick={() => handleApprove(record._id)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 group-hover:opacity-100"
                                                title="Duyệt chi & Thanh toán"
                                            >
                                                <CreditCard size={18} />
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400 font-mono">
                                                {new Date(record.approved_at).toLocaleDateString('vi-VN')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};