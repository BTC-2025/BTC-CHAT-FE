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
              // Increment unread if not the active chat and not sent by current user
              unread: (msg.sender !== user?.id && msg.sender?._id !== user?.id)
                ? (c.unread || 0) + 1
                : c.unread
            };
          }
          return c;
        });
        // Sort by lastAt to move updated chat to top
        return updated.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
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

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">

      {/* ✅ Brand Header */}
      <div className="px-3 sm:px-4 py-2 bg-blue-900 sticky top-0 z-20 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src={logo} alt="BTC Chat" className="w-10 h-10 rounded-lg" />
          <div>
            <div className="font-bold text-sm sm:text-base text-white">BTC - Chat</div>
            <div className="text-[10px] sm:text-xs text-blue-200">Hi, {user?.full_name || user?.phone}</div>
          </div>
        </div>

        <button
          className="px-2 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm rounded-lg font-medium transition-colors"
          onClick={() => setOpenCreate(true)}
        >
          + Group
        </button>
      </div>

      {/* ✅ Search */}
      <div className="p-2 sm:p-3 bg-slate-900 sticky top-[56px] z-10 border-b border-slate-800">
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

      {/* ✅ Chat List */}
      <div className="flex-1 overflow-y-auto">
        <ChatList
          items={chats}
          activeId={activeChatId}
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
