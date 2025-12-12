import { useEffect, useState } from "react";
import axios from "axios";
import SearchBar from "./SearchBar.js";
import ChatList from "./ChatList.js";
import { useAuth } from "../context/AuthContext.js";
import { socket } from "../socket";
import GroupCreateModal from "./GroupCreateModal";
import logo from "../assets/logo.jpg";

export default function Sidebar({ onOpenChat, activeChatId }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);

  const load = async () => {
    try {
      const { data } = await axios.get("https://btc-chat-be.onrender.com/api/chats", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setChats(data);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };

  useEffect(() => {
    if (user?.token) load();
  }, [user]);

  // ✅ Listen for new messages to update sidebar in real-time
  useEffect(() => {
    const onNewMessage = (msg) => {
      setChats((prev) => {
        const updated = prev.map((c) => {
          if (c.id === msg.chat) {
            return {
              ...c,
              lastMessage: msg.body || "[attachment]",
              lastAt: msg.createdAt,
              unread: (msg.sender !== user?.id && msg.sender?._id !== user?.id)
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

  // ✅ Unread badge reset
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

  // ✅ Listen for chat pin/unpin events
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

    socket.on("chat:pinned", onChatPinned);
    socket.on("chat:unpinned", onChatUnpinned);
    return () => {
      socket.off("chat:pinned", onChatPinned);
      socket.off("chat:unpinned", onChatUnpinned);
    };
  }, [user?.id]);

  // ✅ Sort function: pinned first, then by lastAt
  const sortChats = (chatList, userId) => {
    return [...chatList].sort((a, b) => {
      const aIsPinned = a.isPinned || a.pinnedBy?.includes(userId);
      const bIsPinned = b.isPinned || b.pinnedBy?.includes(userId);

      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return new Date(b.lastAt) - new Date(a.lastAt);
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-background-dark text-primary">

      {/* ✅ Brand Header with glassmorphism */}
      <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-primary to-primary-light sticky top-0 z-20 shadow-header flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logo} alt="BTC Chat" className="w-11 h-11 rounded-xl shadow-md ring-2 ring-white/20" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-primary animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg text-white tracking-tight">BTC Chat</div>
            <div className="text-[11px] sm:text-xs text-secondary/90 font-medium">Hi, {user?.full_name || user?.phone}</div>
          </div>
        </div>

        <button
          className="px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm rounded-xl font-semibold transition-all duration-200 flex items-center gap-1.5 ring-1 ring-white/20 hover:ring-white/40"
          onClick={() => setOpenCreate(true)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Group</span>
        </button>
      </div>

      {/* ✅ Search with improved styling */}
      <div className="p-3 sm:p-4 bg-white/50 backdrop-blur-sm sticky top-[62px] z-10 border-b border-background-dark/50">
        <SearchBar
          onOpen={async (chat) => {
            onOpenChat(chat);
            setChats((prev) =>
              prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c))
            );
            await load();
          }}
        />
      </div>

      {/* ✅ Chat List with subtle dividers */}
      <div className="flex-1 overflow-y-auto bg-white/30 divide-y divide-background-dark/30">
        <ChatList
          items={sortChats(chats, user?.id)}
          activeId={activeChatId}
          userId={user?.id}
          onOpen={(chat) => {
            onOpenChat(chat);
            setChats((prev) =>
              prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c))
            );
          }}
        />
      </div>

      {/* ✅ Group Create Modal */}
      <GroupCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={async () => {
          setOpenCreate(false);
          await load();
        }}
      />
    </div>
  );
}
