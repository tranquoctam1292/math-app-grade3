import React from 'react';

const UserProfileScreen = ({ appUser, setGameState, onLogout }) => {
    if (!appUser) {
        return (
            <div className="p-6">
                <p>Không có thông tin người dùng.</p>
                <button onClick={() => setGameState('auth')} className="text-blue-500">
                    Về trang đăng nhập
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Tài khoản phụ huynh</h1>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{appUser.email}</p>
                <p className="text-sm text-gray-600 mt-2">Tên hiển thị</p>
                <p className="font-semibold">{appUser.displayName}</p>
                 <p className="text-sm text-gray-600 mt-2">Mã người dùng</p>
                <p className="font-mono text-xs bg-gray-200 p-1 rounded">{appUser.uid}</p>
            </div>

            <button
                onClick={() => onLogout(false)} // false để chỉ logout khỏi app, không logout firebase
                className="w-full bg-red-500 text-white p-4 rounded-lg font-bold mb-4"
            >
                Đăng xuất khỏi hồ sơ
            </button>

            <button onClick={() => setGameState('home')} className="w-full bg-gray-300 text-black p-2 rounded-lg">
                Về trang chủ
            </button>
        </div>
    );
};

export default UserProfileScreen;
