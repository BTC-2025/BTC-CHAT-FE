import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import { decryptMessage } from "../utils/cryptoUtils";
import axios from "axios";
import { API_BASE } from "../api";
dayjs.extend(relativeTime);

export default function ChatListItem({ item, active, onClick, userId }) {
  const { user, privateKey } = useAuth();
  const [lightboxImage, setLightboxImage] = useState(null);
  const [decryptedLast, setDecryptedLast] = useState(null);

  // ✅ Decrypt last message for sidebar
  useEffect(() => {
    const decrypt = async () => {
      if (!item.lastEncryptedBody || !privateKey) return;

      try {
        const myKeyObj = (item.lastEncryptedKeys || []).find(
          k => String(k.user) === String(userId)
        );
        const encryptedKey = myKeyObj?.key;

        if (encryptedKey) {
          const plainText = await decryptMessage(
            item.lastEncryptedBody,
            encryptedKey,
            privateKey
          );
          setDecryptedLast(plainText);
        }
      } catch (err) {
        console.error("Sidebar decryption failed:", err);
      }
    };
    decrypt();
  }, [item.lastEncryptedBody, item.lastEncryptedKeys, userId, privateKey]);

  const displayName = item.isGroup
    ? item.title
    : (item.other?.full_name || item.other?.phone);

  const avatarInitial = item.isGroup
    ? (item.title?.[0] || "G")
    : (item.other?.full_name?.[0] || item.other?.phone?.slice(-2));

  // Check if chat is pinned for this user
  const isPinned = item.isPinned || item.pinnedBy?.includes(userId);
  const isOnline = !item.isGroup && item.other?.isOnline;

  const handlePin = (e) => {
    e.stopPropagation();
    if (isPinned) {
      socket.emit("chat:unpin", { chatId: item.id });
    } else {
      socket.emit("chat:pin", { chatId: item.id });
    }
  };

  const handleArchive = async (e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_BASE}/chats/${item.id}/archive`, {
        archive: !item.isArchived
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      // Sidebar should refresh or use local state update
      window.dispatchEvent(new CustomEvent("chats:refresh"));
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  const handleHide = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat? Messages will be preserved but the chat will disappear until you search for this contact again.")) return;
    try {
      await axios.post(`${API_BASE}/chats/${item.id}/hide`, {}, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      window.dispatchEvent(new CustomEvent("chats:refresh"));
    } catch (err) {
      console.error("Hide failed:", err);
    }
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (!item.isGroup && item.other?.avatar) {
      setLightboxImage(item.other.avatar);
    }
  };

  return (
    <>
      <div className="group relative">
        <button
          onClick={onClick}
          className={`w-full text-left px-5 py-4 transition-all duration-300 relative overflow-hidden ${active
            ? "bg-white/[0.05] shadow-inner ring-1 ring-white/10"
            : "hover:bg-white/[0.02]"
            }`}
        >
          {/* Active Indicator Glow */}
          {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
          )}

          <div className="flex items-center gap-4 relative z-10 pr-6">
            {/* Avatar */}
            <div
              className="relative flex-shrink-0 cursor-pointer"
              onClick={handleAvatarClick}
            >
              <div className={`w-12 h-12 rounded-2xl grid place-items-center text-sm font-black uppercase shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 overflow-hidden border border-white/10 ${item.isGroup
                ? "bg-gradient-to-br from-[#1e293b] to-[#334155] text-white/90"
                : "bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                }`}>
                {!item.isGroup && item.other?.avatar ? (
                  <img src={item.other.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  avatarInitial
                )}
              </div>

              {/* Premium Online Pulse */}
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-accent border-4 border-[#040712] rounded-full shadow-lg" />
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`font-bold truncate text-[15px] tracking-tight transition-colors ${active ? "text-white" : "text-white/80 group-hover:text-white"
                    }`}>
                    {displayName}
                  </div>
                  {isPinned && (
                    <svg className="w-3 h-3 text-blue-400 rotate-45" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a1 1 0 011 1v1.323l3.945 2.035a1 1 0 01.555.894V10a1 1 0 01-1 1H5.5a1 1 0 01-1-1V7.252a1 1 0 01.555-.894L9 4.323V3a1 1 0 011-1z" />
                    </svg>
                  )}
                  {item.isArchived && (
                    <span className="text-[9px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded uppercase tracking-tighter">Archived</span>
                  )}
                </div>

                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex-shrink-0">
                  {item.lastAt ? dayjs(item.lastAt).fromNow(true) : ""}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className={`text-sm truncate transition-colors max-w-[80%] ${item.unread > 0 ? "text-white/90 font-bold" : "text-white/40"
                  }`}>
                  {decryptedLast || item.lastMessage || "No messages yet"}
                </div>

                {/* Sophisticated Unread Badge */}
                {item.unread > 0 && (
                  <div className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center shadow-[0_2px_10px_rgba(37,99,235,0.4)]">
                    {item.unread > 99 ? "99+" : item.unread}
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Quick Actions (Hover Only) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
          <button
            onClick={handlePin}
            className={`p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors ${isPinned ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
            title={isPinned ? "Unpin" : "Pin"}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.945 2.035a1 1 0 01.555.894V10a1 1 0 01-1 1H5.5a1 1 0 01-1-1V7.252a1 1 0 01.555-.894L9 4.323V3a1 1 0 011-1z" />
            </svg>
          </button>
          <button
            onClick={handleArchive}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
            title={item.isArchived ? "Unarchive" : "Archive"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>
          <button
            onClick={handleHide}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
            title="Delete Chat (Hide)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lightbox for avatar */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-sm w-full">
            <img
              src={lightboxImage}
              alt="Profile"
              className="w-full h-auto max-h-[70vh] object-contain rounded-2xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center mt-4 text-white font-medium">
              {displayName}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

