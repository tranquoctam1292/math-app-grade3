import React from 'react';
import { SHOP_ITEMS } from '../lib/constants';
import { fmt } from '../lib/helpers';

const ShopScreen = ({ piggyBank, setGameState, redeemCash, redemptionHistory }) => {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">Cửa hàng đổi quà</h1>
            <div className="bg-yellow-100 p-4 rounded-lg text-center mb-6">
                <p className="font-semibold text-yellow-800">Tiền trong heo đất</p>
                <p className="text-3xl font-black text-yellow-900">{fmt(piggyBank)}đ</p>
            </div>

            <h2 className="font-bold text-lg mb-2">Vật phẩm có thể đổi</h2>
            <div className="grid grid-cols-2 gap-4">
                {SHOP_ITEMS.map(item => (
                    <div key={item.id} className="border rounded-lg p-4 text-center bg-white shadow">
                        <p className="font-bold">{item.name}</p>
                        <p className="text-indigo-600 font-bold my-2">{fmt(item.value)}đ</p>
                        <button 
                            onClick={() => redeemCash(item)} 
                            disabled={piggyBank < item.value}
                            className="bg-green-500 text-white px-4 py-1 rounded-full disabled:bg-gray-300 text-sm font-semibold"
                        >
                            Đổi
                        </button>
                    </div>
                ))}
            </div>

            <h2 className="font-bold text-lg mb-2 mt-6">Lịch sử đổi quà</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {redemptionHistory.length > 0 ? redemptionHistory.map(item => (
                    <div key={item.id} className="bg-gray-100 p-2 rounded-lg flex justify-between">
                        <span>{item.name}</span>
                        <span className="font-bold">-{fmt(item.value)}đ</span>
                    </div>
                )) : (
                    <p className="text-sm text-gray-500">Chưa có giao dịch nào.</p>
                )}
            </div>

            <button onClick={() => setGameState('home')} className="w-full bg-gray-500 text-white p-4 rounded-lg mt-8 font-bold">
                Về trang chủ
            </button>
        </div>
    );
};

export default ShopScreen;
