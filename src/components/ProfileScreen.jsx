import React from 'react';

const ProfileScreen = ({ profiles, setCurrentProfile, isCreatingProfile, setIsCreatingProfile, newProfileName, setNewProfileName, newProfileAvatar, setNewProfileAvatar, createProfile, appUser }) => (
    <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Chọn hồ sơ</h1>
        <div className="grid grid-cols-2 gap-4">
            {profiles.map(profile => (
                <div key={profile.id} onClick={() => setCurrentProfile(profile)} className="cursor-pointer p-4 bg-gray-100 rounded-lg text-center">
                    <div className="text-4xl mb-2">{profile.avatar}</div>
                    <div>{profile.name}</div>
                </div>
            ))}
            <div onClick={() => setIsCreatingProfile(true)} className="cursor-pointer p-4 bg-gray-100 rounded-lg text-center flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">+</div>
                <div>Tạo hồ sơ mới</div>
            </div>
        </div>
        {isCreatingProfile && (
            <div className="mt-6">
                <h2 className="text-xl font-bold mb-2">Tạo hồ sơ mới</h2>
                <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Tên bé"
                    className="border p-2 w-full mb-2"
                />
                <div>
                    Chọn avatar:
                    <div className="flex gap-2 mt-2">
                        {['🦊', '🐼', '🐨', '🐵', '🦄'].map(avatar => (
                             <span key={avatar} onClick={() => setNewProfileAvatar(avatar)} className={`cursor-pointer text-2xl p-2 rounded-full ${newProfileAvatar === avatar ? 'bg-blue-200' : ''}`}>{avatar}</span>
                        ))}
                    </div>
                </div>
                <button onClick={createProfile} className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-4">Tạo</button>
                <button onClick={() => setIsCreatingProfile(false)} className="bg-gray-300 px-4 py-2 rounded-lg mt-4 ml-2">Hủy</button>
            </div>
        )}
    </div>
);

export default ProfileScreen;
