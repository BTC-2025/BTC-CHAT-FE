import { useEffect, useState } from "react";
import axios from "axios";
import SearchBar from "./SearchBar.js";
import ChatList from "./ChatList.js";
import { useAuth } from "../context/AuthContext.js";
import { socket } from "../socket";
import GroupCreateModal from "./GroupCreateModal";   // ✅ Add this

export default function Sidebar({ onOpenChat, activeChatId }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [openCreate, setOpenCreate] = useState(false); // ✅ modal toggle

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

  // ✅ unread badge realtime update
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
    <div className="flex flex-col h-full bg-neutral-900 text-white">

      {/* ✅ Header + New Group button */}
      <div className="px-4 py-3 bg-neutral-800 sticky top-0 z-20 border-b border-neutral-700 flex justify-between items-center">
        <div className="font-semibold">
          Hi, {user?.full_name || user?.phone}
        </div>

        <button
          className="px-2 py-1 bg-teal-700 hover:bg-teal-600 text-xs rounded"
          onClick={() => setOpenCreate(true)}
        >
          + Group
        </button>
      </div>

      {/* ✅ Search */}
      <div className="p-3 bg-neutral-900 sticky top-[56px] z-10 border-b border-neutral-800">
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

      {/* ✅ Chat List (NOT scrollable) */}
      <div className="flex-1 overflow-hidden sticky top-[112px]">
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
          await load(); // refresh chat list after creating group
        }}
      />
    </div>
  );
}
