// src/components/Attendance/QRDisplay.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/apiService";
import { Clock, RefreshCw, AlertCircle } from "lucide-react";

interface QRData {
  qrDataUrl: string;
  expiresAt: string;
  action: string;
}

export const QRDisplay = () => {
  const { id } = useParams<{ id: string }>(); // Lấy shift_id từ URL
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQR = async () => {
    try {
      const response = await api.get(`/attendance/active-qr/${id}`);

      if (response.data) {
        setQrData(response.data);
        setError("");
      } else {
        setError("Hiện không có mã QR nào khả dụng cho ca này.");
      }
    } catch (err) {
      setError("Không thể tải mã QR. Vui lòng kiểm tra lịch ca làm việc.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
    // Tự động làm mới mỗi 30 giây để cập nhật mã mới nhất từ Cron
    const interval = setInterval(fetchQR, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading && !qrData)
    return <div className="flex justify-center p-10">Đang tải mã QR...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Mã QR Điểm Danh</h2>
      <p className="text-gray-500 mb-6 uppercase font-semibold tracking-wider">
        Loại: {qrData?.action === "checkin" ? "Vào Ca" : "Tan Ca"}
      </p>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      ) : (
        <div className="relative inline-block p-4 border-4 border-blue-100 rounded-xl bg-white">
          <img
            src={qrData?.qrDataUrl}
            alt="Attendance QR"
            className="w-64 h-64"
          />
          {/* Nút refresh thủ công */}
          <button
            onClick={fetchQR}
            className="absolute -bottom-3 -right-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 text-gray-600">
        <Clock size={18} />
        <span>
          Hết hạn lúc:{" "}
          {qrData ? new Date(qrData.expiresAt).toLocaleTimeString() : "--:--"}
        </span>
      </div>

      <p className="mt-4 text-sm text-gray-400">
        Mã sẽ tự động làm mới. Vui lòng quét mã để xác thực lên Blockchain.
      </p>
    </div>
  );
};
export default QRDisplay;
