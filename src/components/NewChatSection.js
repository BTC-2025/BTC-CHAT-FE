import React from 'react';

export default function NewChatSection({ onBack, onNewGroup, onNewContact, onNewCommunity, onDialNumber }) {


    return (
        <div className="flex flex-col h-full bg-[#0f172a] animate-fade-in">
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-white/10">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                </button>
                <div>
                    <h2 className="text-lg font-black text-white">New chat</h2>
                </div>
            </div>

            {/* Search Input */}
            {/* Optional: Add search bar here if desired, or rely on the options */}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {/* Actions List */}
                <div className="space-y-1 mb-6">
                    <button onClick={onNewGroup} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all group text-left">
                        <div className="w-12 h-12 rounded-full bg-secondary/20 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <span className="font-bold text-white group-hover:text-secondary transition-colors">New group</span>
                    </button>

                    <button onClick={onNewContact} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all group text-left">
                        <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <span className="font-bold text-white group-hover:text-primary transition-colors">New contact</span>
                    </button>

                    <button onClick={onNewCommunity} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all group text-left">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">New community</span>
                    </button>

                    <button onClick={onDialNumber} className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all group text-left">
                        <div className="w-12 h-12 rounded-full bg-blue-400/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-400 group-hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">Dial Number</span>
                    </button>
                </div>

                {/* Contacts Header */}
                <div className="px-3 mb-2">
                    <h3 className="text-white/40 text-xs font-bold uppercase tracking-widest">Contacts</h3>
                </div>

                {/* Placeholder for Contacts List - since we don't have a contact fetching API yet */}
                <div className="px-3 text-white/20 text-sm italic">
                    Use "New contact" to find people.
                </div>

            </div>
        </div>
    );
}
