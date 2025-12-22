import React from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Blue-Chat.jpeg';

export default function NavRail({ activeTab, onTabChange, onOpenProfile }) {
    const { user } = useAuth();

    const tabs = [
        { id: 'chats', icon: '💬', label: 'Chats' },
        { id: 'groups', icon: '👥', label: 'Groups' },
        { id: 'archived', icon: '📥', label: 'Archived' },
        { id: 'calls', icon: '📞', label: 'Calls' },
        { id: 'status', icon: '🕒', label: 'Status' },
        { id: 'settings', icon: '⚙️', label: 'Settings' },
    ];

    return (
        <div className="
            w-full h-[64px] 
            md:w-[64px] md:h-full 
            bg-[#3b82f6] 
            flex flex-row md:flex-col items-center 
            px-4 md:px-0 py-0 md:py-6 gap-2 md:gap-8 
            z-50 
            fixed bottom-0 md:relative
            border-t md:border-t-0 border-white/10
        ">
            {/* Logo - Hidden on mobile bottom bar */}
            <div className="hidden md:block w-10 h-10 bg-white rounded-xl overflow-hidden shadow-lg shadow-black/10 ring-1 ring-black/5">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>

            {/* Navigation Icons */}
            <div className="flex-1 flex flex-row md:flex-col justify-around md:justify-start md:gap-5 w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            w-12 h-12 md:w-12 md:h-12 
                            rounded-xl flex items-center justify-center 
                            transition-all duration-300 group relative 
                            ${activeTab === tab.id
                                ? 'bg-white/20 text-white shadow-lg'
                                : 'text-white/60 hover:bg-white/10 hover:text-white'
                            }
                        `}
                        title={tab.label}
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">
                            {tab.id === 'chats' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            )}
                            {tab.id === 'groups' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                            {tab.id === 'archived' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                            )}
                            {tab.id === 'calls' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            )}
                            {tab.id === 'status' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {tab.id === 'settings' && (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute left-0 md:left-0 bottom-0 md:bottom-auto w-full md:w-1 h-1 md:h-6 bg-white rounded-t-full md:rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Profile Avatar (Bottom/End) */}
            <button
                onClick={onOpenProfile}
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl overflow-hidden border-2 border-white/20 hover:border-white transition-all duration-300 ring-2 ring-white/0 hover:ring-white/20"
            >
                {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user?.full_name?.[0] || '?'}
                    </div>
                )}
            </button>
        </div>
    );
}
