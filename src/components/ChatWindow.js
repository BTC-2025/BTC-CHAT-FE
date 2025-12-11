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

export default function ChatWindow({ chat, onBack }) {
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
        `https://btc-chat-be.onrender.com/api/messages/${chat.id}`,
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
      // ✅ IMPORTANT: Only add message if it belongs to THIS chat
      if (m.chat !== chat.id) return;

      // ✅ Prevent duplicate messages by checking if message already exists
      setMessages((prev) => {
        const exists = prev.some(msg => msg._id === m._id);
        if (exists) return prev;
        return [...prev, { ...m, currentUserId: user.id }];
      });
    };

    // ✅ Handle message pinned
    const onPinned = ({ chatId, message }) => {
      if (chatId !== chat.id) return;
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? { ...m, isPinned: true } : m))
      );
    };

    // ✅ Handle message unpinned
    const onUnpinned = ({ chatId, messageId }) => {
      if (chatId !== chat.id) return;
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isPinned: false } : m))
      );
    };

    socket.on("message:new", onNew);
    socket.on("message:pinned", onPinned);
    socket.on("message:unpinned", onUnpinned);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:pinned", onPinned);
      socket.off("message:unpinned", onUnpinned);
    };
  }, [chat.id, user.id]);

  // ✅ Auto-refresh every 5 seconds (preserving scroll position)
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     const scroller = scrollerRef.current;
  //     if (!scroller) return;

  //     // Save current scroll position
  //     const scrollTop = scroller.scrollTop;
  //     const scrollHeight = scroller.scrollHeight;
  //     const isNearBottom = scrollHeight - scrollTop - scroller.clientHeight < 100;

  //     // Fetch new messages
  //     // console.log("🔄 Auto-refresh triggered at:", new Date().toLocaleTimeString());
  //     await load();

  //     // After state update, restore scroll position
  //     requestAnimationFrame(() => {
  //       if (isNearBottom) {
  //         // If was near bottom, scroll to new bottom
  //         scroller.scrollTop = scroller.scrollHeight;
  //       } else {
  //         // Otherwise, maintain the same scroll position
  //         const newScrollHeight = scroller.scrollHeight;
  //         const heightDiff = newScrollHeight - scrollHeight;
  //         scroller.scrollTop = scrollTop + heightDiff;
  //       }
  //     });
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, [chat.id]);

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
    <div className="flex flex-col h-full bg-slate-950">

      {/* ✅ HEADER */}
      <div className="px-3 sm:px-4 py-3 bg-blue-900 border-b border-slate-700 flex justify-between items-center gap-2">

        {/* LEFT - Back button + Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Back button (mobile only) */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Avatar */}
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full grid place-items-center text-xs sm:text-sm font-semibold flex-shrink-0 ${chat.isGroup ? "bg-indigo-600" : "bg-blue-600"
            }`}>
            {chat.isGroup
              ? (chat.title?.[0] || "G")
              : (chat.other?.full_name?.[0] || chat.other?.phone?.slice(-2))}
          </div>

          <div className="min-w-0">
            <div className="font-semibold text-sm sm:text-base truncate">
              {chat.isGroup ? chat.title : chat.other.full_name || chat.other.phone}
            </div>

            <div className="text-[10px] sm:text-xs text-blue-200">
              {chat.isGroup
                ? "Group"
                : typing
                  ? "Typing…"
                  : presence.isOnline
                    ? "🟢 Online"
                    : chat.other?.lastSeen
                      ? `last seen ${new Date(chat.other.lastSeen).toLocaleString()}`
                      : ""}
            </div>
          </div>
        </div>

        {/* RIGHT - Action buttons */}
        <div className="flex items-center gap-2">
          {chat.isGroup && (
            <button
              onClick={() => setOpenManage(true)}
              className="text-[10px] sm:text-xs bg-blue-800 hover:bg-blue-700 px-2 sm:px-3 py-1.5 rounded-lg transition-colors"
            >
              Info
            </button>
          )}

          {!chat.isGroup && (
            <button
              onClick={blockStatus.iBlockedThem ? handleUnblock : handleBlock}
              className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 rounded-lg transition-colors ${blockStatus.iBlockedThem
                ? "bg-green-700 hover:bg-green-600"
                : "bg-red-700 hover:bg-red-600"
                }`}
            >
              {blockStatus.iBlockedThem ? "Unblock" : "Block"}
            </button>
          )}

          {/* Close Chat Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-blue-800 rounded-lg transition-colors"
              title="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ✅ Block Status Banners */}
      {blockError && (
        <div className="bg-red-900/50 text-red-300 text-xs sm:text-sm px-3 sm:px-4 py-2 text-center">
          {blockError}
        </div>
      )}
      {blockStatus.theyBlockedMe && !blockStatus.iBlockedThem && (
        <div className="bg-yellow-900/50 text-yellow-300 text-xs sm:text-sm px-3 sm:px-4 py-2 text-center">
          You cannot send messages to this user.
        </div>
      )}
      {blockStatus.iBlockedThem && (
        <div className="bg-slate-800 text-slate-400 text-xs sm:text-sm px-3 sm:px-4 py-2 text-center">
          You have blocked this user. Unblock to send messages.
        </div>
      )}

      {/* ✅ Pinned Messages Section */}
      {messages.filter(m => m.isPinned).length > 0 && (
        <div className="bg-blue-900/30 border-b border-blue-800/50 px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 text-xs sm:text-sm font-semibold">📌 Pinned Messages</span>
            <span className="text-blue-300 text-[10px] sm:text-xs">
              ({messages.filter(m => m.isPinned).length})
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {messages.filter(m => m.isPinned).map((m) => (
              <div
                key={`pinned-${m._id}`}
                className="flex items-start justify-between gap-2 bg-slate-800/50 rounded-lg px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-blue-300 mb-0.5">
                    {m.sender?.full_name || (m.sender === user.id ? "You" : "User")}
                  </div>
                  <div className="text-xs sm:text-sm text-white truncate">
                    {m.body?.substring(0, 100) || "[attachment]"}
                    {m.body?.length > 100 ? "..." : ""}
                  </div>
                </div>
                <button
                  onClick={() => socket.emit("message:unpin", { messageId: m._id, chatId: chat.id })}
                  className="text-[10px] text-slate-400 hover:text-red-400 flex-shrink-0"
                  title="Unpin"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Messages Area */}
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2"
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
      <div className="border-t border-slate-700 p-2 sm:p-3 bg-slate-900">
        {blockStatus.isBlocked ? (
          <div className="text-center text-slate-500 py-2 text-sm">
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
