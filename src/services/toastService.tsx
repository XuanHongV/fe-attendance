import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

export const toastService = {
  success: (msg: string, opts = {}) => toast.success(msg, opts),
  error: (msg: string, opts = {}) => toast.error(msg, opts),
  info: (msg: string, opts = {}) => toast.info(msg, opts),
  warn: (msg: string, opts = {}) => toast.warn(msg, opts),

  confirm: (title: string, message: string, okText = 'Xác nhận', cancelText = 'Hủy') =>
    new Promise<boolean>((resolve) => {
      confirmAlert({
        customUI: ({ onClose }) => {
          return (
            <div className='bg-white rounded-2xl shadow-2xl p-7 max-w-sm w-full border border-gray-100 flex flex-col items-center text-center animate-in zoom-in duration-200'>
              <div className='w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='32'
                  height='32'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <circle cx='12' cy='12' r='10' />
                  <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
                  <line x1='12' y1='17' x2='12.01' y2='17' />
                </svg>
              </div>
              <h2 className='text-xl font-bold text-gray-900 mb-2'>{title}</h2>
              <p className='text-gray-500 text-sm mb-8'>{message}</p>
              <div className='flex justify-center gap-3 w-full'>
                <button
                  onClick={() => {
                    resolve(false);
                    onClose();
                  }}
                  className='flex-1 px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all font-semibold text-sm'
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    resolve(true);
                    onClose();
                  }}
                  className='flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold text-sm'
                >
                  {okText}
                </button>
              </div>
            </div>
          );
        },
      });
    }),
};

export default toastService;
