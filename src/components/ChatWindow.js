// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { socket } from "../socket";
// import { useAuth } from "../context/AuthContext.js";
// import MessageBubble from "./MessageBubble.js";
// import ChatInput from "./ChatInput.js";

// export default function ChatWindow({ chat }) {
//   const { user } = useAuth();
//   const [messages, setMessages] = useState([]);
//   const scrollerRef = useRef(null);

//   const load = async () => {
//     try {
//       const { data } = await axios.get(
//         `http://localhost:5001/api/messages/${chat.id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${user?.token}`,  // ✅ unchanged
//           },
//         }
//       );
//       setMessages(data);
//     } catch (err) {
//       console.error("Failed to load messages:", err);
//     }
//   };

//   const [typing, setTyping] = useState(false);
//   const [presence, setPresence] = useState({
//     isOnline: chat.other?.isOnline,
//     lastSeen: chat.other?.lastSeen,
//   });

//   useEffect(() => {
//     load();
//     socket.connect();
//     socket.emit("join_chat", { chatId: chat.id });

//     const onNew = (m) => setMessages((prev) => [...prev, m]);
//     const onUpdate = () => {}; // placeholder

//     socket.on("message:new", onNew);
//     socket.on("chats:update", onUpdate);

//     return () => {
//       socket.off("message:new", onNew);
//       socket.off("chats:update", onUpdate);
//       socket.disconnect();
//     };
//   }, [chat.id]);


//   // ✅ ✅ NEW: Mark messages as READ when opening the chat
//   useEffect(() => {
//     socket.emit("message:readAll", { chatId: chat.id });
//   }, [chat.id]);


//   // ✅ ✅ NEW: Also mark as READ when window regains focus
//   useEffect(() => {
//     const onFocus = () => {
//       socket.emit("message:readAll", { chatId: chat.id });
//     };
//     window.addEventListener("focus", onFocus);
//     return () => window.removeEventListener("focus", onFocus);
//   }, [chat.id]);


//   // ✅ Your typing + presence block stays the same
//   useEffect(() => {
//     socket.connect();
//     socket.emit("join_chat", { chatId: chat.id });
//     socket.emit("user:sync");

//     const onTypingStart = ({ chatId }) =>
//       chatId === chat.id && setTyping(true);

//     const onTypingStop = ({ chatId }) =>
//       chatId === chat.id && setTyping(false);

//     const onPresence = (p) => {
//       if (chat.other && p.userId === chat.other.id) {
//         setPresence({
//           isOnline: p.isOnline,
//           lastSeen: new Date(),
//         });
//       }
//     };

//     socket.on("typing:started", onTypingStart);
//     socket.on("typing:stopped", onTypingStop);
//     socket.on("presence:update", onPresence);

//     return () => {
//       socket.off("typing:started", onTypingStart);
//       socket.off("typing:stopped", onTypingStop);
//       socket.off("presence:update", onPresence);
//       socket.disconnect();
//     };
//   }, [chat.id]);

//   useEffect(() => {
//     scrollerRef.current?.scrollTo({
//       top: scrollerRef.current.scrollHeight,
//       behavior: "smooth",
//     });
//   }, [messages]);

//   const send = (text) => {
//     socket.emit("message:send", {
//       chatId: chat.id,
//       senderId: user.id,
//       body: text,
//     });
//   };

//   return (
//     <div className="flex flex-col h-full">
//       <div className="px-4 py-3 border-b border-neutral-700 sticky top-0 bg-neutral-900 z-10">
//         <div className="font-semibold">
//           {chat.other.full_name || chat.other.phone}
//         </div>

//         <div className="text-xs text-neutral-400">
//           {typing
//             ? "Typing…"
//             : presence.isOnline
//             ? "Online"
//             : chat.other?.lastSeen
//             ? `last seen ${new Date(chat.other.lastSeen).toLocaleString()}`
//             : ""}
//         </div>
//       </div>

//       <div
//         ref={scrollerRef}
//         className="flex-1 overflow-y-auto p-4 space-y-2"
//       >
//         {messages.map((m) => (
//           <MessageBubble
//             key={m._id}
//             mine={m.sender === user.id}
//             text={m.body}
//             time={m.createdAt}
//             status={m.status}   // ✅ add this if using message ticks
//           />
//         ))}
//       </div>

//       <div className="border-t border-neutral-700 p-3">
//         <ChatInput onSend={send} />
//       </div>
//     </div>
//   );
// }


// import { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import { socket } from "../socket";
// import { useAuth } from "../context/AuthContext.js";
// import MessageBubble from "./MessageBubble.js";
// import ChatInput from "./ChatInput.js";

// export default function ChatWindow({ chat }) {
//   const { user } = useAuth();
//   const [messages, setMessages] = useState([]);
//   const scrollerRef = useRef(null);

//   // ✅ Fetch messages (backend already masks deleted messages)
//   const load = async () => {
//     try {
//       const { data } = await axios.get(
//         `http://localhost:5001/api/messages/${chat.id}`,
//         {
//           headers: { Authorization: `Bearer ${user?.token}` },
//         }
//       );

//       // Add currentUserId for MessageBubble delete checks
//       const enriched = data.map((m) => ({
//         ...m,
//         currentUserId: user.id,
//       }));

//       setMessages(enriched);
//     } catch (err) {
//       console.error("Failed to load messages:", err);
//     }
//   };

//   const [typing, setTyping] = useState(false);
//   const [presence, setPresence] = useState({
//     isOnline: chat.other?.isOnline,
//     lastSeen: chat.other?.lastSeen,
//   });

//   // ✅ Load chat + listen for new messages
//   useEffect(() => {
//     load();

//     socket.connect();
//     socket.emit("join_chat", { chatId: chat.id });

//     const onNew = (m) => {
//       setMessages((prev) => [...prev, { ...m, currentUserId: user.id }]);
//     };

//     socket.on("message:new", onNew);

//     return () => {
//       socket.off("message:new", onNew);
//     };
//   }, [chat.id]);

//   // ✅ Mark all as read
//   useEffect(() => {
//     socket.emit("message:readAll", { chatId: chat.id });
//   }, [chat.id]);

//   // ✅ Mark read on window focus
//   useEffect(() => {
//     const onFocus = () => {
//       socket.emit("message:readAll", { chatId: chat.id });
//     };
//     window.addEventListener("focus", onFocus);
//     return () => window.removeEventListener("focus", onFocus);
//   }, [chat.id]);

//   // ✅ ✅ REAL-TIME DELETE HANDLER (Correct version)
//   useEffect(() => {
//     const onDeleted = ({ messageId, forEveryone }) => {
//       setMessages((prev) =>
//         prev.map((m) => {
//           if (m._id !== messageId) return m;

//           if (forEveryone) {
//             // ✅ Delete for everyone → show deleted bubble
//             return {
//               ...m,
//               deletedForEveryone: true,
//               body: "",
//             };
//           }

//           // ✅ Delete for me → only hide for THIS user
//           return {
//             ...m,
//             deletedFor: [...(m.deletedFor || []), user.id],
//           };
//         })
//       );
//     };

//     socket.on("message:deleted", onDeleted);
//     return () => socket.off("message:deleted", onDeleted);
//   }, [user.id]);

//   // ✅ Typing + presence updates
//   useEffect(() => {
//     socket.emit("join_chat", { chatId: chat.id });
//     socket.emit("user:sync");

//     const onTypingStart = ({ chatId }) =>
//       chatId === chat.id && setTyping(true);

//     const onTypingStop = ({ chatId }) =>
//       chatId === chat.id && setTyping(false);

//     const onPresence = (p) => {
//       if (chat.other && p.userId === chat.other.id) {
//         setPresence({
//           isOnline: p.isOnline,
//           lastSeen: new Date(),
//         });
//       }
//     };

//     socket.on("typing:started", onTypingStart);
//     socket.on("typing:stopped", onTypingStop);
//     socket.on("presence:update", onPresence);

//     return () => {
//       socket.off("typing:started", onTypingStart);
//       socket.off("typing:stopped", onTypingStop);
//       socket.off("presence:update", onPresence);
//     };
//   }, [chat.id]);

//   // ✅ Auto-scroll on new messages
//   useEffect(() => {
//     scrollerRef.current?.scrollTo({
//       top: scrollerRef.current.scrollHeight,
//       behavior: "smooth",
//     });
//   }, [messages]);

//   // ✅ Sending message
//   const send = (text) => {
//     socket.emit("message:send", {
//       chatId: chat.id,
//       senderId: user.id,
//       body: text,
//     });
//   };

//   return (
//     <div className="flex flex-col h-full">
//       {/* ✅ Header */}
//       <div className="px-4 py-3 border-b border-neutral-700 sticky top-0 bg-neutral-900 z-10">
//         <div className="font-semibold">
//           {chat.other.full_name || chat.other.phone}
//         </div>

//         <div className="text-xs text-neutral-400">
//           {typing
//             ? "Typing…"
//             : presence.isOnline
//             ? "Online"
//             : chat.other?.lastSeen
//             ? `last seen ${new Date(
//                 chat.other.lastSeen
//               ).toLocaleString()}`
//             : ""}
//         </div>
//       </div>

//       {/* ✅ Messages */}
//       <div
//         ref={scrollerRef}
//         className="flex-1 overflow-y-auto p-4 space-y-2"
//       >
//         {messages.map((m) => (
//           <MessageBubble
//             key={m._id}
//             message={m}
//             mine={m.sender === user.id}
//             chatId={chat.id}
//           />
//         ))}
//       </div>

//       {/* ✅ Input */}
//       <div className="border-t border-neutral-700 p-3">
//         <ChatInput onSend={send} />
//       </div>
//     </div>
//   );
// }



import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext.js";
import MessageBubble from "./MessageBubble.js";
import ChatInput from "./ChatInput.js";
import GroupManageModal from "./GroupManageModal";

export default function ChatWindow({ chat }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const scrollerRef = useRef(null);
  const [openManage, setOpenManage] = useState(false);

  // ✅ Block state
  const [blockStatus, setBlockStatus] = useState({
    iBlockedThem: false,
    theyBlockedMe: false,
    isBlocked: false
  });
  const [blockError, setBlockError] = useState("");

  // ✅ Load messages (backend masks deleted messages)
  const load = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:5001/api/messages/${chat.id}`,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );

      // Add current user ID
      const enriched = data.map((m) => ({
        ...m,
        currentUserId: user.id,
      }));

      setMessages(enriched);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const [typing, setTyping] = useState(false);
  const [presence, setPresence] = useState({
    isOnline: chat.other?.isOnline,
    lastSeen: chat.other?.lastSeen,
  });

  // ✅ Check block status when chat opens (for 1:1 chats)
  useEffect(() => {
    if (chat.isGroup || !chat.other?.id) return;

    socket.emit("user:checkBlocked", { targetUserId: chat.other.id }, (res) => {
      if (res?.success) {
        setBlockStatus({
          iBlockedThem: res.iBlockedThem,
          theyBlockedMe: res.theyBlockedMe,
          isBlocked: res.isBlocked
        });
      }
    });
  }, [chat.id, chat.other?.id, chat.isGroup]);

  // ✅ Listen for message errors (blocked)
  useEffect(() => {
    const onError = ({ error }) => {
      setBlockError(error);
      setTimeout(() => setBlockError(""), 3000);
    };

    socket.on("message:error", onError);
    return () => socket.off("message:error", onError);
  }, []);

  // ✅ Listen for real-time block/unblock notifications
  useEffect(() => {
    if (chat.isGroup || !chat.other?.id) return;

    const onBlockedBy = ({ blockedBy, targetUserId }) => {
      // If current user was blocked by the chat partner
      if (blockedBy === chat.other.id && targetUserId === user.id) {
        setBlockStatus(prev => ({ ...prev, theyBlockedMe: true, isBlocked: true }));
      }
    };

    const onUnblockedBy = ({ unblockedBy, targetUserId }) => {
      // If current user was unblocked by the chat partner
      if (unblockedBy === chat.other.id && targetUserId === user.id) {
        setBlockStatus(prev => ({
          ...prev,
          theyBlockedMe: false,
          isBlocked: prev.iBlockedThem
        }));
      }
    };

    socket.on("user:blockedBy", onBlockedBy);
    socket.on("user:unblockedBy", onUnblockedBy);

    return () => {
      socket.off("user:blockedBy", onBlockedBy);
      socket.off("user:unblockedBy", onUnblockedBy);
    };
  }, [chat.id, chat.other?.id, chat.isGroup, user.id]);

  // ✅ Load + listen new messages
  useEffect(() => {
    load();

    socket.connect();
    socket.emit("join_chat", { chatId: chat.id });

    const onNew = (m) => {
      // ✅ Prevent duplicate messages by checking if message already exists
      setMessages((prev) => {
        // Check if this message already exists in the list
        const exists = prev.some(msg => msg._id === m._id);
        if (exists) return prev;
        return [...prev, { ...m, currentUserId: user.id }];
      });
    };

    socket.on("message:new", onNew);

    return () => {
      socket.off("message:new", onNew);
    };
  }, [chat.id, user.id]);

  // ✅ Auto-refresh every 5 seconds (without disturbing scroll position)
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 5000);

    return () => clearInterval(interval);
  }, [chat.id]);

  // ✅ Mark all as read
  useEffect(() => {
    socket.emit("message:readAll", { chatId: chat.id });
  }, [chat.id]);

  // ✅ Mark read on window focus
  useEffect(() => {
    const onFocus = () => {
      socket.emit("message:readAll", { chatId: chat.id });
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [chat.id]);

  // ✅ Real-time delete sync
  useEffect(() => {
    const onDeleted = ({ messageId, forEveryone }) => {
      load(); // 🔥 simplest and safest sync method
    };

    socket.on("message:deleted", onDeleted);
    return () => socket.off("message:deleted", onDeleted);
  }, [user.id]);

  // ✅ Typing & presence
  useEffect(() => {
    socket.emit("join_chat", { chatId: chat.id });
    socket.emit("user:sync");

    const onTypingStart = ({ chatId }) =>
      chatId === chat.id && setTyping(true);

    const onTypingStop = ({ chatId }) =>
      chatId === chat.id && setTyping(false);

    const onPresence = (p) => {
      if (chat.other && p.userId === chat.other.id) {
        setPresence({ isOnline: p.isOnline, lastSeen: new Date() });
      }
    };

    socket.on("typing:started", onTypingStart);
    socket.on("typing:stopped", onTypingStop);
    socket.on("presence:update", onPresence);

    return () => {
      socket.off("typing:started", onTypingStart);
      socket.off("typing:stopped", onTypingStop);
      socket.off("presence:update", onPresence);
    };
  }, [chat.id]);

  // ✅ Scroll to bottom on initial load, smart scroll for updates
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || messages.length === 0) return;

    // Always scroll to bottom on initial load
    if (isInitialLoad.current) {
      scroller.scrollTop = scroller.scrollHeight;
      isInitialLoad.current = false;
      return;
    }

    // For updates: only scroll if user is near the bottom (within 100px)
    const isNearBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 100;

    if (isNearBottom) {
      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Reset initial load flag when chat changes
  useEffect(() => {
    isInitialLoad.current = true;
  }, [chat.id]);

  // ✅ Send message
  const send = (text) => {
    socket.emit("message:send", {
      chatId: chat.id,
      senderId: user.id,
      body: text,
    });
  };

  // ✅ Block/Unblock handlers
  const handleBlock = () => {
    if (!chat.other?.id) return;
    socket.emit("user:block", { targetUserId: chat.other.id }, (res) => {
      if (res?.success) {
        setBlockStatus(prev => ({ ...prev, iBlockedThem: true, isBlocked: true }));
      }
    });
  };

  const handleUnblock = () => {
    if (!chat.other?.id) return;
    socket.emit("user:unblock", { targetUserId: chat.other.id }, (res) => {
      if (res?.success) {
        setBlockStatus(prev => ({
          ...prev,
          iBlockedThem: false,
          isBlocked: prev.theyBlockedMe
        }));
      }
    });
  };

  return (
    <div className="flex flex-col h-full">

      {/* ✅ GROUP-AWARE HEADER */}
      <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-700 flex justify-between items-center">

        {/* LEFT */}
        <div>
          <div className="font-semibold">
            {chat.isGroup ? chat.title : chat.other.full_name || chat.other.phone}
          </div>

          <div className="text-xs text-neutral-400">
            {chat.isGroup
              ? "Group"
              : typing
                ? "Typing…"
                : presence.isOnline
                  ? "Online"
                  : chat.other?.lastSeen
                    ? `last seen ${new Date(chat.other.lastSeen).toLocaleString()}`
                    : ""}
          </div>
        </div>

        {/* ✅ GROUP INFO BUTTON */}
        {chat.isGroup && (
          <button
            onClick={() => setOpenManage(true)}
            className="text-xs bg-neutral-800 px-2 py-1 rounded hover:bg-neutral-700"
          >
            Group Info
          </button>
        )}

        {/* ✅ BLOCK/UNBLOCK BUTTON (for 1:1 chats only) */}
        {!chat.isGroup && (
          <button
            onClick={blockStatus.iBlockedThem ? handleUnblock : handleBlock}
            className={`text-xs px-2 py-1 rounded ${blockStatus.iBlockedThem
              ? "bg-green-700 hover:bg-green-600"
              : "bg-red-700 hover:bg-red-600"
              }`}
          >
            {blockStatus.iBlockedThem ? "Unblock" : "Block"}
          </button>
        )}
      </div>

      {/* ✅ Block Error/Status Banner */}
      {blockError && (
        <div className="bg-red-900/50 text-red-300 text-sm px-4 py-2 text-center">
          {blockError}
        </div>
      )}
      {blockStatus.theyBlockedMe && !blockStatus.iBlockedThem && (
        <div className="bg-yellow-900/50 text-yellow-300 text-sm px-4 py-2 text-center">
          You cannot send messages to this user.
        </div>
      )}
      {blockStatus.iBlockedThem && (
        <div className="bg-neutral-800 text-neutral-400 text-sm px-4 py-2 text-center">
          You have blocked this user. Unblock to send messages.
        </div>
      )}

      {/* ✅ Messages Area */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            mine={m.sender === user.id || m.sender?._id === user.id}
            chatId={chat.id}
            isGroup={chat.isGroup}
          />
        ))}
      </div>

      {/* ✅ Input */}
      <div className="border-t border-neutral-700 p-3">
        {blockStatus.isBlocked ? (
          <div className="text-center text-neutral-500 py-2">
            {blockStatus.iBlockedThem
              ? "Unblock this user to send messages"
              : "You cannot send messages to this user"}
          </div>
        ) : (
          <ChatInput onSend={send} />
        )}
      </div>

      {/* ✅ Group Manage Modal */}
      <GroupManageModal
        chatId={chat.id}
        open={openManage}
        onClose={() => setOpenManage(false)}
      />
    </div>
  );
}
