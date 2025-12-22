import React, { useState } from 'react';
import { ethers } from "ethers";
import { Bell, Search, LogOut, User as UserIcon, Wallet, Shield } from 'lucide-react';

interface UserData {
  fullName?: string;
  email?: string;
  role?: string;
  avatar?: string;
}

type HeaderProps = {
  user: UserData | null;
  onLogout: () => void;
};

export const Header = ({ user, onLogout }: HeaderProps) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // const handleConnectWallet = async () => {
  //   if (typeof window.ethereum !== 'undefined') {
  //     try {
  //       const provider = new ethers.BrowserProvider(window.ethereum);
  //       const accounts = await provider.send("eth_requestAccounts", []);
  //       if (accounts.length > 0) setWalletAddress(accounts[0]);
  //     } catch (err) {
  //       console.error("Lỗi kết nối ví:", err);
  //       alert("Kết nối thất bại. Vui lòng kiểm tra MetaMask.");
  //     }
  //   } else {
  //     alert("Vui lòng cài đặt MetaMask!");
  //   }
  // };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">

      <div className="flex items-center md:hidden">
        <Shield className="w-6 h-6 text-blue-600 mr-2" />
        <span className="font-bold text-gray-800">Payroll D-App</span>
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-md mr-auto">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-gray-400" />
          </span>
          <input
            className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            type="text"
            placeholder="Tìm kiếm..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-5">

        {/* {walletAddress ? (
          <div className="hidden md:flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-mono">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            {formatAddress(walletAddress)}
          </div>
        ) :
         (
          <button
            onClick={handleConnectWallet}
            className="hidden md:flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Kết nối Ví
          </button>
        )
        } */}

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3 border-l pl-3 md:pl-5 border-gray-200">

          <div className="flex items-center space-x-3">
            <div className="text-right hidden lg:block">
              <p className="text-sm font-semibold text-gray-800 leading-none">
                {user?.fullName || user?.email || 'Người dùng'}
              </p>
              <p className="text-xs text-gray-500 mt-1 capitalize">
                {user?.role || 'Nhân viên'}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};