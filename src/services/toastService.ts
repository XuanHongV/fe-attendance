import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';

export const toastService = {
  success: (msg: string, opts = {}) => toast.success(msg, opts),
  error: (msg: string, opts = {}) => toast.error(msg, opts),
  info: (msg: string, opts = {}) => toast.info(msg, opts),
  warn: (msg: string, opts = {}) => toast.warn(msg, opts),

  confirm: (title: string, message: string, okText = 'Xác nhận', cancelText = 'Hủy') =>
    new Promise<boolean>((resolve) => {
      confirmAlert({
        title,
        message,
        buttons: [
          {
            label: cancelText,
            onClick: () => resolve(false),
          },
          {
            label: okText,
            onClick: () => resolve(true),
          },
        ],
      });
    }),
};

export default toastService;
