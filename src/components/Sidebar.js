import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../api";
import SearchBar from "./SearchBar.js";
import ChatList from "./ChatList.js";
import { useAuth } from "../context/AuthContext.js";
import { socket } from "../socket";
import GroupCreateModal from "./GroupCreateModal";
import ProfileModal from "./ProfileModal";
import NavRail from "./NavRail";

export default function Sidebar({ onOpenChat, activeChatId, onViewStatus }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("chats"); // chats, groups, calls, status, settings

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/chats`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setChats(data);
    } catch (err) {
      console.error("Failed to fetch chats:", err);
    }
  }, [user?.token]);

  useEffect(() => {
    const fetchChatsOnce = async () => {
      if (!user?.token) return;
      try {
        const { data } = await axios.get(`${API_BASE}/chats`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setChats((prev) => {
          const prevMap = new Map(prev.map(c => [c.id, c]));
          const merged = data.map(c => {
            const local = prevMap.get(c.id);
            return {
              ...c,
              unread: Math.max(c.unread || 0, local?.unread || 0)
            };
          });

          if (window.__initialChatId) {
            const match = merged.find(c => String(c.id) === String(window.__initialChatId));
            if (match) {
              onOpenChat(match);
              window.__initialChatId = null;
            }
          }
          return merged;
        });
      } catch (err) {
        console.error("Failed to fetch chats:", err);
      }
    };
    fetchChatsOnce();
  }, [user, onOpenChat]);

  useEffect(() => {
    const onNewMessage = (msg) => {
      setChats((prev) => {
        const updated = prev.map((c) => {
          if (c.id === msg.chat) {
            return {
              ...c,
              lastMessage: msg.body || (msg.attachments?.length ? "[attachment]" : ""),
              lastAt: msg.createdAt,
              lastEncryptedBody: msg.encryptedBody || null,
              lastEncryptedKeys: msg.encryptedKeys || [],
              unread: (String(msg.sender) !== String(user?.id) && String(msg.sender?._id) !== String(user?.id))
                ? (c.unread || 0) + 1
                : c.unread
            };
          }
          return c;
        });
        return sortChats(updated, user?.id);
      });
    };

    socket.on("message:new", onNewMessage);
    return () => socket.off("message:new", onNewMessage);
  }, [user?.id]);

  useEffect(() => {
    const onUnreadReset = ({ chatId, unreadResetFor }) => {
      if (!user) return;
      if (unreadResetFor !== user.id) return;
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c))
      );
    };

    socket.on("chats:update", onUnreadReset);
    return () => socket.off("chats:update", onUnreadReset);
  }, [user]);

  useEffect(() => {
    const onChatPinned = ({ chatId }) => {
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chatId ? { ...c, isPinned: true } : c
        );
        return sortChats(updated, user?.id);
      });
    };

    const onChatUnpinned = ({ chatId }) => {
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chatId ? { ...c, isPinned: false } : c
        );
        return sortChats(updated, user?.id);
      });
    };

    const handleRefresh = () => load();
    window.addEventListener("chats:refresh", handleRefresh);

    socket.on("chat:pinned", onChatPinned);
    socket.on("chat:unpinned", onChatUnpinned);
    return () => {
      socket.off("chat:pinned", onChatPinned);
      socket.off("chat:unpinned", onChatUnpinned);
      window.removeEventListener("chats:refresh", handleRefresh);
    };
  }, [user?.id, load]);

  const sortChats = (chatList, userId) => {
    return [...chatList].sort((a, b) => {
      const aIsPinned = a.isPinned || a.pinnedBy?.includes(userId);
      const bIsPinned = b.isPinned || b.pinnedBy?.includes(userId);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return new Date(b.lastAt) - new Date(a.lastAt);
    });
  };

  const filteredChats = chats.filter(c => {
    if (activeTab === "groups") return c.isGroup && !c.isArchived;
    if (activeTab === "chats") return !c.isGroup && !c.isArchived;
    if (activeTab === "archived") return c.isArchived;
    return true; // fallback for others
  });

  const renderContent = () => {
    if (activeTab === "settings") {
      return (
        <div className="flex-1 p-6 space-y-6">
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <div className="space-y-4">
            <button
              onClick={() => setOpenProfile(true)}
              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
            >
              <span>Account Information</span>
              <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            </button>
            <div className="p-4 bg-white/5 rounded-2xl space-y-3">
              <div className="flex justify-between items-center opacity-70">
                <span>Theme</span>
                <span className="text-primary font-bold">Premium Dark</span>
              </div>
              <div className="flex justify-between items-center opacity-70">
                <span>Encrypted Chats</span>
                <span className="text-emerald-400 font-bold">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "calls") {
      return (
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center opacity-50">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          </div>
          <h3 className="text-lg font-semibold">No Call logs found</h3>
          <p className="text-sm">Start a call from any chat to see it here.</p>
        </div>
      );
    }

    // Filter online users (only for 1:1 chats)
    const onlineUsers = chats
      .filter(c => !c.isGroup && c.other?.isOnline && !c.isArchived)
      .map(c => c.other);

    const getTitle = () => {
      if (activeTab === 'groups') return 'Groups';
      if (activeTab === 'archived') return 'Archived';
      return 'Chats';
    };

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Area */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black">{getTitle()}</h2>
            {activeTab === 'groups' && (
              <button onClick={() => setOpenCreate(true)} className="w-8 h-8 flex items-center justify-center bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
              </button>
            )}
          </div>
          <SearchBar onOpen={async (chat) => { onOpenChat(chat); await load(); }} />
        </div>

        {/* Online Section (Horizontal Scroll) */}
        {activeTab === "chats" && onlineUsers.length > 0 && (
          <div className="px-5 py-2">
            <div className="text-[11px] font-bold text-light tracking-widest uppercase mb-2">Online</div>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
              {onlineUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onOpenChat(chats.find(c => !c.isGroup && c.other.id === u.id))}
                  className="flex-shrink-0 relative group"
                >
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {u.full_name?.[0] || '?'}
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-accent border-[3px] border-[#040712] rounded-full" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
          {/* {activeTab === "chats" && (
            <div className="px-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white tracking-tight">
                Sort by <span className="text-pri">Newest</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              </div>
            </div>
          )} */}
          <ChatList
            items={sortChats(filteredChats, user?.id)}
            activeId={activeChatId}
            userId={user?.id}
            onOpen={(chat) => {
              onOpenChat(chat);
              setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col-reverse md:flex-row h-full bg-[#040712] overflow-hidden">
      <NavRail
        activeTab={activeTab}
        onTabChange={(id) => {
          if (id === 'status') {
            onViewStatus();
          } else {
            setActiveTab(id);
          }
        }}
        onOpenProfile={() => setOpenProfile(true)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden pb-[64px] md:pb-0">
        {renderContent()}
      </div>

      <ProfileModal open={openProfile} onClose={() => setOpenProfile(false)} />
      <GroupCreateModal open={openCreate} onClose={() => setOpenCreate(false)} onCreated={async () => { setOpenCreate(false); await load(); }} />
    </div>
  );
}
