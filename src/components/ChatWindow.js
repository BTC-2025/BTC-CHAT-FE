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
import { API_BASE } from "../api";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext.js";
import MessageBubble from "./MessageBubble.js";
import ChatInput from "./ChatInput.js";
import GroupManageModal from "./GroupManageModal";
import ContactInfoModal from "./ContactInfoModal"; // ✅ Added ContactInfoModal
import ForwardModal from "./ForwardModal";
import { encryptMessage } from "../utils/cryptoUtils";

export default function ChatWindow({ chat, onBack, onStartCall }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const scrollerRef = useRef(null);
  const [openManage, setOpenManage] = useState(false);
  const [openContactInfo, setOpenContactInfo] = useState(false); // ✅ Added state

  // ✅ Reply/Forward state
  const [replyTo, setReplyTo] = useState(null);
  const [forwardMessage, setForwardMessage] = useState(null);

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
        `${API_BASE}/messages/${chat.id}`,
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

    // ✅ Handle reaction updates
    const onReacted = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    socket.on("message:new", onNew);
    socket.on("message:pinned", onPinned);
    socket.on("message:unpinned", onUnpinned);
    socket.on("message:reacted", onReacted);

    return () => {
      socket.off("message:new", onNew);
      socket.off("message:pinned", onPinned);
      socket.off("message:unpinned", onUnpinned);
      socket.off("message:reacted", onReacted);
    };
  }, [chat.id, user.id]);

  // ✅ AUTO-REFRESH REMOVED for performance. Sockets handle updates.

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
    const onDeletedEveryone = ({ messageId, chatId: eventChatId }) => {
      // Only update if event is for current chat
      if (eventChatId !== chat.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deletedForEveryone: true } : m
        )
      );
    };

    const onDeletedMe = ({ messageId, chatId: eventChatId }) => {
      // Only update if event is for current chat
      if (eventChatId !== chat.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, deletedFor: [...(m.deletedFor || []), user.id] } : m
        )
      );
    };

    socket.on("message:deleted:everyone", onDeletedEveryone);
    socket.on("message:deleted:me", onDeletedMe);
    return () => {
      socket.off("message:deleted:everyone", onDeletedEveryone);
      socket.off("message:deleted:me", onDeletedMe);
    };
  }, [chat.id, user.id]);

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

  // ✅ Send message with attachments, replyTo, and scheduledAt (E2EE support)
  const send = async (text, attachments = [], replyToId = null, scheduledAt = null) => {
    let payload = {
      chatId: chat.id,
      senderId: user.id,
      body: text,
      attachments: attachments.map(att => ({
        url: att.url,
        type: att.type,
        name: att.name
      })),
      replyTo: replyToId,
      scheduledAt: scheduledAt // ✅ Add scheduling
    };

    // ✅ Apply E2EE for 1:1 chats if other participant has a public key
    if (!chat.isGroup && chat.other?.publicKey && text) {
      try {
        const keysMap = {
          [user.id]: user.publicKey,
          [chat.other.id]: chat.other.publicKey
        };

        if (user.publicKey && chat.other.publicKey) {
          const encrypted = await encryptMessage(text, keysMap);
          payload.encryptedBody = encrypted.encryptedBody;
          payload.encryptedKeys = encrypted.encryptedKeys;
          payload.body = "[Encrypted Message]";
        }
      } catch (err) {
        console.error("Encryption failed:", err);
      }
    }

    socket.emit("message:send", payload);
  };

  // ✅ New event listener for scheduling confirmation
  useEffect(() => {
    const onScheduled = ({ message, scheduledAt }) => {
      // Show some UI feedback? For now, we'll just log or could show a toast
      console.log(`Message scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      // alert(`Message scheduled for ${new Date(scheduledAt).toLocaleString()}`);
    };

    socket.on("message:scheduled", onScheduled);
    return () => socket.off("message:scheduled", onScheduled);
  }, []);

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
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-background-dark">

      {/* ✅ HEADER with gradient and shadow */}
      <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-primary to-primary-light shadow-header flex justify-between items-center gap-3">

        {/* LEFT - Back button + Name */}
        <div
          className={`flex items-center gap-3 min-w-0 ${!chat.isGroup ? "cursor-pointer group/header" : ""}`}
          onClick={() => !chat.isGroup && setOpenContactInfo(true)}
        >
          {/* Back button (mobile only) */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Avatar with gradient and online indicator */}
          <div className="relative">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full grid place-items-center text-sm font-bold flex-shrink-0 text-white shadow-md overflow-hidden ${chat.isGroup
              ? "bg-gradient-to-br from-secondary-dark to-secondary"
              : "bg-gradient-to-br from-secondary to-secondary-light"
              }`}>
              {!chat.isGroup && chat.other?.avatar ? (
                <img src={chat.other.avatar} alt="" className="w-full h-full object-cover group-hover/header:scale-110 transition-transform" />
              ) : chat.isGroup
                ? (chat.title?.[0] || "G")
                : (chat.other?.full_name?.[0] || chat.other?.phone?.slice(-2))}
            </div>
            {/* Online indicator */}
            {!chat.isGroup && presence.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-primary animate-pulse" />
            )}
          </div>

          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base truncate text-white group-hover/header:text-secondary transition-colors">
              {chat.isGroup ? chat.title : chat.other.full_name || chat.other.phone}
            </div>

            <div className="text-[10px] sm:text-xs text-secondary/90 font-medium flex items-center gap-1">
              {chat.isGroup
                ? "Group"
                : typing
                  ? <span className="animate-pulse-soft">Typing...</span>
                  : presence.isOnline
                    ? "Online"
                    : chat.other?.lastSeen
                      ? `last seen ${new Date(chat.other.lastSeen).toLocaleTimeString()}`
                      : ""}
            </div>
          </div>
        </div>

        {/* RIGHT - Action buttons */}
        <div className="flex items-center gap-2">
          {chat.isGroup && (
            <button
              onClick={() => setOpenManage(true)}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl transition-all duration-200 font-semibold flex items-center gap-1.5 ring-1 ring-white/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Info
            </button>
          )}

          {!chat.isGroup && (
            <>
              {/* Audio Call Button */}
              <button
                onClick={() => onStartCall?.("audio")}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-xl transition-all duration-200 ring-1 ring-green-500/30"
                title="Audio call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              {/* Video Call Button */}
              <button
                onClick={() => onStartCall?.("video")}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl transition-all duration-200 ring-1 ring-blue-500/30"
                title="Video call"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          )}

          {!chat.isGroup && (
            <button
              onClick={blockStatus.iBlockedThem ? handleUnblock : handleBlock}
              className={`text-xs px-3 py-2 rounded-xl transition-all duration-200 font-semibold ring-1 ${blockStatus.iBlockedThem
                ? "bg-green-500/20 text-green-300 hover:bg-green-500/30 ring-green-500/30"
                : "bg-red-500/20 text-red-300 hover:bg-red-500/30 ring-red-500/30"
                }`}
            >
              {blockStatus.iBlockedThem ? "Unblock" : "Block"}
            </button>
          )}

          {/* Close Chat Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 text-white hidden sm:block"
              title="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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
        <div className="bg-background-dark text-primary/60 text-xs sm:text-sm px-3 sm:px-4 py-2 text-center">
          You have blocked this user. Unblock to send messages.
        </div>
      )}

      {/* ✅ Pinned Messages Section */}
      {messages.filter(m => m.isPinned).length > 0 && (
        <div className="bg-secondary/10 border-b border-secondary/20 px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-secondary-dark text-xs sm:text-sm font-semibold">📌 Pinned Messages</span>
            <span className="text-primary/60 text-[10px] sm:text-xs">
              ({messages.filter(m => m.isPinned).length})
            </span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {messages.filter(m => m.isPinned).map((m) => (
              <div
                key={`pinned-${m._id}`}
                className="flex items-start justify-between gap-2 bg-white/80 rounded-lg px-3 py-2 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-secondary-dark mb-0.5">
                    {m.sender?.full_name || (m.sender === user.id ? "You" : "User")}
                  </div>
                  <div className="text-xs sm:text-sm text-primary truncate">
                    {m.body?.substring(0, 100) || "[attachment]"}
                    {m.body?.length > 100 ? "..." : ""}
                  </div>
                </div>
                <button
                  onClick={() => socket.emit("message:unpin", { messageId: m._id, chatId: chat.id })}
                  className="text-[10px] text-primary/40 hover:text-red-500 flex-shrink-0"
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
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 bg-background"
      >
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            mine={m.sender === user.id || m.sender?._id === user.id}
            chatId={chat.id}
            isGroup={chat.isGroup}
            isAdmin={chat.isGroup && chat.admins?.includes(user.id)}
            onReply={(msg) => setReplyTo(msg)}
            onForward={(msg) => setForwardMessage(msg)}
          />
        ))}
      </div>

      {/* ✅ Input */}
      <div className="border-t border-background-dark p-2 sm:p-3 bg-white">
        {blockStatus.isBlocked ? (
          <div className="text-center text-primary/50 py-2 text-sm">
            {blockStatus.iBlockedThem
              ? "Unblock this user to send messages"
              : "You cannot send messages to this user"}
          </div>
        ) : (
          <ChatInput
            onSend={send}
            chatId={chat.id}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        )}
      </div>

      {/* ✅ Group Manage Modal */}
      <GroupManageModal
        chat={chat}
        open={openManage}
        onClose={() => setOpenManage(false)}
      />

      {/* ✅ Contact Info Modal */}
      <ContactInfoModal
        contact={chat.other}
        open={openContactInfo}
        onClose={() => setOpenContactInfo(false)}
      />

      {/* ✅ Forward Modal */}
      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          onClose={() => setForwardMessage(null)}
        />
      )}
    </div>
  );
}

