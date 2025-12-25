import { useEffect, useState } from 'react';
import { X, Copy, ExternalLink, FileText } from 'lucide-react';
import { timesheetService, PayrollPayment } from '../../services/timesheetService';
import toastService from '../../services/toastService';

interface Props {
    detailId: string;
    onClose: () => void;
}

export const PayrollReceiptModal = ({ detailId, onClose }: Props) => {
    const [loading, setLoading] = useState(true);
    const [receipt, setReceipt] = useState<PayrollPayment | null>(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                const data = await timesheetService.getPayrollReceipt(detailId);
                if (mounted) setReceipt(data);
            } catch (err) {
                console.error('Lỗi lấy biên lai trả lương', err);
                toastService.error('Không thể tải biên lai trả lương');
                onClose();
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [detailId, onClose]);

    const handleCopy = async (text?: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            toastService.success('Đã sao chép');
        } catch {
            toastService.error('Không thể sao chép');
        }
    };

    const explorerLink = (tx?: string, network?: string) => {
        if (!tx) return undefined;
        // Basic mapping, extend if needed
        if (!network || /mainnet/i.test(network)) return `https://etherscan.io/tx/${tx}`;
        if (/ropsten|goerli|sepolia/i.test(network))
            return `https://${network}.etherscan.io/tx/${tx}`;
        return `https://etherscan.io/tx/${tx}`;
    };

    return (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 backdrop-blur-md'>
            <div className='bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden ring-1 ring-black/5'>
                <div className='flex items-center justify-between gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'>
                    <div className='flex items-center gap-4'>
                        <div className='bg-white/20 p-2 rounded-lg'>
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className='text-lg font-bold leading-tight'>
                                Biên lai thanh toán
                            </h3>
                            <div className='text-xs opacity-80'>
                                Chi tiết giao dịch và thông tin thanh toán
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className='p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors'
                        aria-label='Đóng'
                    >
                        <X className='text-white' />
                    </button>
                </div>

                <div className='p-6 bg-white'>
                    {loading ? (
                        <div className='text-sm text-gray-500'>Đang tải...</div>
                    ) : receipt ? (
                        <div className='space-y-5'>
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                                <div className='p-4 rounded-lg bg-gradient-to-b from-white to-gray-50 border border-gray-100'>
                                    <div className='text-xs text-gray-500'>
                                        Số tiền (VND)
                                    </div>
                                    <div className='text-lg font-semibold text-gray-800 mt-1'>
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                        }).format(receipt.amount_vnd || 0)}
                                    </div>
                                    <div className='text-xs text-gray-400 mt-1'>
                                        ~ {receipt.amount_token} {receipt.currency}
                                    </div>
                                </div>

                                <div className='p-4 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-between'>
                                    <div>
                                        <div className='text-xs text-gray-500'>
                                            Tỷ giá
                                        </div>
                                        <div className='text-sm font-medium text-gray-800 mt-1'>
                                            {receipt.exchange_rate?.toLocaleString() ||
                                                '-'}
                                        </div>
                                    </div>

                                    <div className='mt-3'>
                                        <div className='text-xs text-gray-500'>
                                            Trạng thái
                                        </div>
                                        {/* <div className='mt-1'>
                                            <span
                                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                                    receipt.status === 'PAID'
                                                        ? 'bg-green-100 text-green-700'
                                                        : receipt.status === 'FAILED'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {receipt.status}
                                            </span>
                                        </div> */}
                                    </div>
                                </div>
                            </div>

                            <div className='grid grid-cols-1 gap-3'>
                                <div>
                                    <div className='text-xs text-gray-500'>
                                        Thời gian thanh toán
                                    </div>
                                    <div className='text-sm font-medium text-gray-800 mt-1'>
                                        {receipt.paid_at
                                            ? new Date(receipt.paid_at).toLocaleString(
                                                  'vi-VN'
                                              )
                                            : '-'}
                                    </div>
                                </div>

                                <div>
                                    <div className='text-xs text-gray-500'>
                                        Transaction hash
                                    </div>
                                    <div className='flex items-center gap-3 mt-2'>
                                        <code className='text-sm font-mono break-all bg-gray-50 px-3 py-2 rounded-md ring-1 ring-black/5'>
                                            {receipt.transaction_hash || '-'}
                                        </code>

                                        {receipt.transaction_hash && (
                                            <div className='flex items-center gap-2'>
                                                <button
                                                    className='p-2 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition'
                                                    onClick={() =>
                                                        handleCopy(
                                                            receipt.transaction_hash
                                                        )
                                                    }
                                                    title='Copy'
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                {explorerLink(
                                                    receipt.transaction_hash,
                                                    receipt.network
                                                ) && (
                                                    <a
                                                        className='p-2 rounded-md bg-indigo-600 text-white hover:opacity-90 transition flex items-center'
                                                        href={explorerLink(
                                                            receipt.transaction_hash,
                                                            receipt.network
                                                        )}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                        title='Mở explorer'
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='flex flex-col gap-4 mt-2'>
                                    {' '}
                                 
                                    <div>
                                        <div className='text-xs text-gray-500'>Từ</div>
                                        <div className='text-sm font-mono mt-1 text-gray-800 break-all'>
                                            {receipt.from_address || '-'}
                                        </div>
                                    </div>
                                   
                                    <div className='border-t border-gray-100 pt-2'>
                                        <div className='text-xs text-gray-500'>Đến</div>
                                        <div className='text-sm font-mono mt-1 text-gray-800 break-all'>
                                            {receipt.to_address || '-'}
                                        </div>
                                    </div>
                                </div>

                                {receipt.error_reason && (
                                    <div className='text-sm text-red-600 mt-2'>
                                        Lỗi: {receipt.error_reason}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='text-sm text-gray-500'>
                            Không tìm thấy biên lai.
                        </div>
                    )}
                </div>

                <div className='p-4 bg-gray-50 flex justify-end gap-3'>
                    <button
                        onClick={onClose}
                        className='px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 transition'
                    >
                        Đóng
                    </button>
                    <button
                        onClick={() =>
                            receipt?.transaction_hash &&
                            handleCopy(receipt.transaction_hash)
                        }
                        className='px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition'
                    >
                        Sao chép hash
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayrollReceiptModal;
