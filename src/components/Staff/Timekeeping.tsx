import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

const WebcamComponent = React.forwardRef((props: any, ref: any) => (
  <Webcam {...props} ref={ref} />
));
WebcamComponent.displayName = 'WebcamComponent';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import api from '../../services/apiService';
import { Clock, MapPin, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';


interface Shift {
  _id: string;
  name: string;
  start_time: string;
  end_time: string;
}

interface ShiftAssignment {
  _id: string;
  work_date: string;
  shift: Shift;
  status: string;
  location?: string;
}

export const Timekeeping = () => {
  const webcamRef = useRef<any>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [todayShifts, setTodayShifts] = useState<ShiftAssignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);
  useEffect(() => {
    const fetchTodayShifts = async () => {
      if (!user?._id) return;
      
      try {
        setIsLoadingShifts(true);
        const response = await api.get(`/shift-assignments/user/${user._id}`);
        const allShifts = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        const todayStr = new Date().toISOString().split('T')[0];
        const shiftsToday = allShifts.filter((item: ShiftAssignment) => 
            item.work_date.startsWith(todayStr)
        );

        setTodayShifts(shiftsToday);
        if (shiftsToday.length === 1) {
            setSelectedAssignmentId(shiftsToday[0]._id);
        }

      } catch (error) {
        console.error("Lỗi tải ca làm việc:", error);
      } finally {
        setIsLoadingShifts(false);
      }
    };

    fetchTodayShifts();
  }, [user]);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const handleCheckIn = async () => {
    if (!imgSrc) return;
    if (!selectedAssignmentId) {
        setMessage({ type: 'error', text: 'Vui lòng chọn Ca làm việc trước khi chấm công!' });
        return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.post('/attendance/check-in', {
        image: imgSrc,
        timestamp: new Date().toISOString(),
        shiftAssignmentId: selectedAssignmentId, 
      });

      setMessage({ type: 'success', text: 'Chấm công thành công!' });
      setImgSrc(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Chấm công thất bại: ' + (error.response?.data?.message || 'Lỗi hệ thống') });
    } finally {
      setLoading(false);
    }
  };

  const currentDateDisplay = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Calendar size={32} />
            </div>
            Chấm công Khuôn mặt
        </h1>
        <p className="text-gray-500 mt-2 pl-1">Hôm nay, {currentDateDisplay}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center shadow-inner">
                {imgSrc ? (
                <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                <WebcamComponent
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "user" }}
                />
                )}
            </div>

            <div className="mt-4 flex gap-3">
                {!imgSrc ? (
                <button
                    onClick={capture}
                    className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                Chụp ảnh
                </button>
                ) : (
                <>
                    <button
                    onClick={() => setImgSrc(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                    Chụp lại
                    </button>
                    <button
                    onClick={handleCheckIn}
                    disabled={loading || !selectedAssignmentId}
                    className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                    {loading ? <span className="animate-spin">⏳</span> : <CheckCircle size={20}/>}
                    {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </>
                )}
            </div>
            </div>
    
            {message && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {message.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                    <div>
                        <p className="font-bold">{message.type === 'success' ? 'Thành công' : 'Lỗi'}</p>
                        <p className="text-sm opacity-90">{message.text}</p>
                    </div>
                </div>
            )}
        </div>
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full">
             <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                Chọn Ca Làm Việc Hôm Nay
             </h3>

             {isLoadingShifts ? (
                 <div className="text-center py-10 text-gray-500">Đang tải lịch...</div>
             ) : todayShifts.length === 0 ? (
                 <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                     <p className="text-gray-500 font-medium">Bạn không có ca làm việc nào hôm nay.</p>
                 </div>
             ) : (
                 <div className="space-y-3">
                     {todayShifts.map((assignment) => {
                         const isSelected = selectedAssignmentId === assignment._id;
                         return (
                             <div 
                                key={assignment._id}
                                onClick={() => setSelectedAssignmentId(assignment._id)}
                                className={`
                                    relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                                    ${isSelected 
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200 ring-offset-1' 
                                        : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50'
                                    }
                                `}
                             >
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <h4 className={`font-bold text-lg ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                             {assignment.shift.name}
                                         </h4>
                                         <p className="text-gray-500 flex items-center gap-1.5 mt-1 text-sm font-medium">
                                             <Clock size={14} />
                                             {assignment.shift.start_time} - {assignment.shift.end_time}
                                         </p>
                                     </div>
                                     <div className={`
                                         w-5 h-5 rounded-full border-2 flex items-center justify-center
                                         ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                                     `}>
                                         {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                     </div>
                                 </div>
                                 
                                 <div className="mt-3 pt-3 border-t border-gray-200/50 flex items-center justify-between text-sm">
                                     <span className="flex items-center gap-1.5 text-gray-500">
                                         <MapPin size={14} className="text-red-400" />
                                         {assignment.location || "Văn phòng chính"}
                                     </span>
                                     <span className={`
                                         px-2 py-0.5 rounded text-xs font-bold uppercase
                                         ${assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                     `}>
                                         {assignment.status === 'ASSIGNED' ? 'Chưa chấm' : assignment.status}
                                     </span>
                                 </div>
                             </div>
                         );
                     })}
                 </div>
             )}

             {!selectedAssignmentId && todayShifts.length > 0 && (
                 <p className="text-red-500 text-xs mt-4 font-medium flex items-center gap-1 animate-pulse">
                     <AlertTriangle size={12} />
                     Vui lòng chọn ca làm việc để tiếp tục
                 </p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};