import React, { useState, useEffect, FormEvent, useRef } from 'react';
import { Search, Filter, Plus, Edit, X, RefreshCw, QrCode, Download, Loader2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Employee } from '../../types';
import api from '../../services/apiService';

interface UserResponse {
  _id: string;
  fullName: string;
  email: string;
  position?: string;
  department?: string;
  walletAddress?: string;
  status: 'ACTIVE' | 'INACTIVE';
  role: string;
  createdAt: string;
  avatar?: string;
  company?: string | { _id: string; code: string; name: string }; 
}

interface PositionOption {
  _id: string;
  name: string;
}

type EmployeeFormState = Omit<Employee, 'id' | 'joinDate'>;

const defaultEmployeeForm: EmployeeFormState = {
  fullName: '',
  email: '',
  position: '',
  department: '',
  walletAddress: '',
  status: 'active',
  avatar: '',
  role: 'STAFF',
};

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // State lưu danh sách options cho dropdown
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // State lọc theo Vị trí
  const [filterPos, setFilterPos] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormState>(defaultEmployeeForm);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [realCompanyCode, setRealCompanyCode] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const companyId = typeof currentUser?.company === 'string' 
        ? currentUser.company 
        : currentUser?.company?._id; 

      if (!companyId) {
        console.error("Lỗi: Tài khoản này chưa liên kết Công ty.");
        setLoading(false);
        return;
      }

      // --- 1. Lấy danh sách Nhân viên ---
      const usersRes = await api.get(`/users/company/id/${companyId}`);
      const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
      const staffOnly = rawUsers.filter((u: UserResponse) => u.role === 'STAFF');
      
      const mappedEmployees: Employee[] = staffOnly.map((u: UserResponse) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        position: u.position || 'Chưa cập nhật', 
        walletAddress: u.walletAddress || '',
        status: u.status === 'ACTIVE' ? 'active' : 'inactive',
        joinDate: u.createdAt,
        avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=random&color=fff`
      }));
      setEmployees(mappedEmployees);

      const foundCode = currentUser?.companyCode || currentUser?.company?.code || rawUsers[0]?.companyCode;
      if (foundCode) setRealCompanyCode(foundCode);

      // --- 2. Lấy danh sách Vị trí (Positions) & Phòng ban (Departments) ---
      try {
          // Gọi song song 2 API để tối ưu
          const [posRes] = await Promise.all([
              api.get('/positions'),
          ]);
          
          setPositions(Array.isArray(posRes.data) ? posRes.data : (posRes.data?.data || []));
         
        } catch (err) {
          console.warn("Lỗi tải danh mục options (Positions/Departments).", err);
      }

    } catch (error) {
      console.error("Lỗi chung:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIC LỌC ĐÃ SỬA ---
  const filteredEmployees = employees.filter(employee => {
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      (employee.fullName?.toLowerCase() || '').includes(searchLower) ||
      (employee.email?.toLowerCase() || '').includes(searchLower) ||
      (employee.position?.toLowerCase() || '').includes(searchLower);

    // Lọc theo Position (Vị trí)
    // Nếu filterPos = 'all' thì lấy hết
    // Ngược lại so sánh employee.position với giá trị đang chọn
    const matchesPos = filterPos === 'all' || (employee.position || '') === filterPos;

    return matchesSearch && matchesPos;
  });

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // ... (Giữ nguyên các hàm handle modal, qr code...)
  const handleOpenModal = (employee: Employee | null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        fullName: employee.fullName,
        email: employee.email,
        position: employee.position,
        walletAddress: employee.walletAddress,
        status: employee.status,
        avatar: employee.avatar,
        role: 'STAFF' 
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        ...defaultEmployeeForm,
        // Tự động chọn giá trị đầu tiên nếu có danh sách
        position: positions.length > 0 ? positions[0].name : '',
            });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormData(defaultEmployeeForm);
  };

  const handleOpenQr = (employee: Employee) => {
    setQrEmployee(employee);
    setQrModalOpen(true);
  };

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas && qrEmployee) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      const safeName = qrEmployee.fullName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `QR_${safeName}.png`;
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateAvatar = () => {
    const name = formData.fullName || 'User';
    const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`;
    setFormData(prev => ({ ...prev, avatar: newAvatarUrl }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.position) { alert("Vui lòng chọn chức vụ!"); return; }
    
    setIsSubmitting(true);
    try {
      let codeToSend = realCompanyCode; 
      if (!codeToSend) {
         const userStr = localStorage.getItem('user');
         const currentUser = userStr ? JSON.parse(userStr) : null;
         codeToSend = currentUser?.companyCode || currentUser?.company?.code || "HONG";
      }

      const payload = {
        ...formData,
        status: formData.status === 'active' ? 'ACTIVE' : 'INACTIVE'
      };

      if (editingEmployee) {
        await api.patch(`/users/${editingEmployee.id}`, payload);
        alert("Cập nhật thành công!");
      } else {
        const newPayload = {
          ...payload,
          password: "123456@Default", 
          companyCode: codeToSend, 
          status: 'INACTIVE'
        };
        await api.post('/users', newPayload);
        alert("Thêm nhân viên thành công!");
      }
      await fetchData(); 
      handleCloseModal();
    } catch (error: any) {
      console.error("Lỗi:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Quản lý Nhân viên</h2>
            <p className="text-gray-600 text-sm">Thêm, sửa, và xem thông tin chi tiết của nhân viên.</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-sm font-medium">
            <Plus className="h-5 w-5" /> <span>Thêm Nhân viên</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text" placeholder="Tìm nhân viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Filter Dropdown (LỌC THEO VỊ TRÍ) */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={filterPos} 
                onChange={(e) => setFilterPos(e.target.value)} 
                className="bg-transparent outline-none text-sm text-gray-700 cursor-pointer min-w-[150px]"
              >
                <option value="all">Tất cả Vị Trí</option>
                {/* 1. Ưu tiên lấy từ danh sách Position API */}
                {positions.map(pos => (
                  <option key={pos._id} value={pos.name}>{pos.name}</option>
                ))}
                
                {/* 2. Fallback: Nếu API lỗi, tự lấy từ list nhân viên hiện tại để ko bị trống */}
                {positions.length === 0 && Array.from(new Set(employees.map(e => e.position).filter(Boolean))).map(posName => (
                    <option key={posName} value={posName}>{posName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Nhân viên</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Email</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Chức vụ</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Phòng ban</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Trạng thái</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-900 text-sm uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500 italic">Không tìm thấy nhân viên nào phù hợp.</td></tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img src={employee.avatar} alt="avt" className="w-10 h-10 rounded-full object-cover border bg-gray-100 shadow-sm" />
                        <div>
                          <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{employee.fullName}</p>
                          <p className="text-xs text-gray-500 font-mono">ID: {employee.id.slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">{employee.email}</td>
                    
                    {/* Cột Chức vụ (Position) */}
                    <td className="py-4 px-6 text-sm">
                        <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                            {employee.position}
                        </span>
                    </td>

                    <td className="py-4 px-6 text-sm text-gray-700">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                        {employee.department}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                          employee.status === 'active' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {employee.status === 'active' ? 'Hoạt động' : 'Đã nghỉ'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center flex items-center justify-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenQr(employee)} className="text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors" title="Mã QR">
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleOpenModal(employee)} className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Sửa">
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-200 flex items-start justify-between shrink-0 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">{editingEmployee ? 'Cập nhật Hồ sơ' : 'Thêm Nhân viên'}</h2>
                <button type="button" onClick={handleCloseModal} className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-6 w-6" /></button>
              </div>
              
              <div className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                {/* ... (Phần Avatar giữ nguyên) ... */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.fullName || 'User'}&background=random`} alt="Preview" className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm" />
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ảnh đại diện</label>
                    <div className="flex gap-2">
                      <input type="text" name="avatar" value={formData.avatar} onChange={handleChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500 transition-all" placeholder="Link ảnh..." />
                      <button type="button" onClick={handleGenerateAvatar} className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Họ và tên *</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required /></div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Select Chức vụ (Position) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Chức vụ *</label>
                        <select name="position" value={formData.position} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
                            <option value="">-- Chọn --</option>
                            {positions.map(pos => (<option key={pos._id} value={pos.name}>{pos.name}</option>))}
                        </select>
                    </div>

                    {/* Select Phòng ban (Department) */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Phòng ban *</label>
                      <select name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
                        <option value="">-- Chọn --</option>
                      </select>
                    </div>
                  </div>

                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ Ví</label><input type="text" name="walletAddress" value={formData.walletAddress} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="0x..." /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Trạng thái</label><select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"><option value="active">Hoạt động</option><option value="inactive">Đã nghỉ</option></select></div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3 shrink-0">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-white hover:shadow-sm transition-all" disabled={isSubmitting}>Hủy</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEmployee ? 'Lưu thay đổi' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal giữ nguyên */}
      {qrModalOpen && qrEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full text-center p-8 relative overflow-hidden">
             {/* ... (Nội dung QR Modal giữ nguyên) ... */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
             <button onClick={() => setQrModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"><X className="w-5 h-5" /></button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-6">Mã QR Nhân Viên</h3>
            <div className="flex justify-center mb-6 p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50" ref={qrRef}>
              <QRCodeCanvas value={qrEmployee.id} size={220} level={"H"} includeMargin={true} />
            </div>
            <div className="mb-8">
              <p className="font-bold text-gray-900 text-xl">{qrEmployee.fullName}</p>
              <p className="text-sm text-gray-500 mt-1 font-medium">{qrEmployee.position}</p>
            </div>
            <button onClick={downloadQRCode} className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 transition-all font-bold shadow-lg shadow-blue-200 hover:-translate-y-0.5">
              <Download className="w-5 h-5" /> Tải xuống PNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
};