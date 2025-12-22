import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import api from '../../services/apiService';

export const QRScanner: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [scanResult, setScanResult] = useState<{ message: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (text: string) => {
    if (!text || isProcessing) return;
    
    if (scanResult || error) return;

    setIsProcessing(true);
    console.log("QR Code Read:", text);

    try {
      const response = await api.post('/attendance/scan', { userId: text });
      
      setScanResult(response.data);
      // Phát âm thanh
      new Audio('https://www.soundjay.com/button/beep-07.wav').play().catch(() => {});

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi không xác định");
      // Phát âm thanh lỗi
      new Audio('https://www.soundjay.com/button/button-10.wav').play().catch(() => {});
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setScanResult(null);
        setError(null);
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
      
      <div className="absolute top-4 left-4">
        <button onClick={onBack} className="flex items-center text-white hover:text-gray-300">
          <ArrowLeft className="mr-2" /> Quay lại Dashboard
        </button>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">MÁY CHẤM CÔNG TỰ ĐỘNG</h2>

      <div className="w-[400px] h-[400px] bg-black rounded-xl overflow-hidden border-4 border-blue-500 shadow-2xl relative">
        <Scanner 
            onScan={(result) => {
                if (result && result.length > 0) {
                    handleScan(result[0].rawValue);
                }
            }}
            scanDelay={500}
            allowMultiple={true}
        />
        {(scanResult || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="text-center p-6">
              {scanResult ? (
                <>
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">{scanResult.type}</h3>
                  <p className="text-green-400 text-lg">{scanResult.message}</p>
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">LỖI</h3>
                  <p className="text-red-400 text-lg">{error}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-400 mt-8 text-sm animate-pulse">
        Vui lòng đưa mã QR của bạn vào trước camera...
      </p>
    </div>
  );
};