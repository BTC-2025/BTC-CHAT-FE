// import { useState } from "react";
// import dayjs from "dayjs";
// import { socket } from "../socket";

// export default function MessageBubble({ mine, text, time, status, messageId, chatId }) {
//   const [menuOpen, setMenuOpen] = useState(false);

//   const renderTicks = () => {
//     if (!mine) return null;

//     if (status === "seen") return <span className="text-blue-400">✔✔</span>;
//     if (status === "delivered") return <span className="text-gray-300">✔✔</span>;
//     return <span className="text-gray-300">✔</span>;
//   };

//   const deleteForMe = () => {
//     socket.emit("message:delete", { messageId, forEveryone: false });
//     setMenuOpen(false);
//   };

//   const deleteForEveryone = () => {
//     if (!mine) return; // Only sender can delete for everyone
//     socket.emit("message:delete", { messageId, forEveryone: true });
//     setMenuOpen(false);
//   };

//   return (
//     <div className={`relative max-w-[75%] ${mine ? "ml-auto" : ""}`}>
//       {/* 3-dot menu button */}
//       <div className="absolute -top-2 -right-2">
//         <button
//           className="text-neutral-400 text-sm hover:text-neutral-200"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           ⋮
//         </button>

//         {/* Dropdown menu */}
//         {menuOpen && (
//           <div className="absolute right-0 mt-1 bg-neutral-800 rounded-lg shadow-lg p-2 text-xs min-w-[120px] border border-neutral-700 z-20">
//             <button
//               className="block w-full text-left px-2 py-1 hover:bg-neutral-700 rounded"
//               onClick={deleteForMe}
//             >
//               Delete for me
//             </button>

//             {mine && (
//               <button
//                 className="block w-full text-left px-2 py-1 hover:bg-neutral-700 rounded text-red-400"
//                 onClick={deleteForEveryone}
//               >
//                 Delete for everyone
//               </button>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Bubble */}
//       <div
//         className={`rounded-2xl px-4 py-2 ${
//           mine ? "bg-teal-700" : "bg-neutral-800"
//         }`}
//       >
//         <div className="whitespace-pre-wrap">{text}</div>

//         {/* Time + ticks */}
//         <div className="text-[10px] text-neutral-300 text-right mt-1 flex gap-1 justify-end items-center">
//           <span>{dayjs(time).format("HH:mm")}</span>
//           {renderTicks()}
//         </div>
//       </div>
//     </div>
//   );
// }


// import { useState } from "react";
// import dayjs from "dayjs";
// import { socket } from "../socket";

// export default function MessageBubble({ message, mine }) {
//   const [menuOpen, setMenuOpen] = useState(false);

//   const isDeletedForAll = message.deletedForEveryone;
//   const isDeletedForMe = message.deletedFor?.includes?.(message.currentUserId);

//   const isDeleted = isDeletedForAll || isDeletedForMe;

//   const renderTicks = () => {
//     if (isDeleted) return null;
//     if (!mine) return null;

//     if (message.status === "seen") return <span className="text-blue-400">✔✔</span>;
//     if (message.status === "delivered") return <span className="text-gray-300">✔✔</span>;
//     return <span className="text-gray-300">✔</span>;
//   };

//   const deleteForMe = () => {
//     socket.emit("message:delete", {
//       messageId: message._id,
//       forEveryone: false
//     });
//     setMenuOpen(false);
//   };

//   const deleteForEveryone = () => {
//     if (!mine) return;
//     socket.emit("message:delete", {
//       messageId: message._id,
//       forEveryone: true
//     });
//     setMenuOpen(false);
//   };

//   // ✅ Deleted UI (WhatsApp style)
//   if (isDeleted) {
//     return (
//       <div className={`max-w-[75%] ${mine ? "ml-auto" : ""}`}>
//         <div className="bg-neutral-800 text-neutral-400 italic px-3 py-2 rounded-xl text-sm">
//           This message was deleted
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`relative max-w-[75%] ${mine ? "ml-auto" : ""}`}>

//       {/* Menu button */}
//       <div className="absolute -top-2 -right-2 z-20">
//         <button
//           className="text-neutral-400 text-sm hover:text-neutral-200"
//           onClick={() => setMenuOpen(!menuOpen)}
//         >
//           ⋮
//         </button>

//         {menuOpen && (
//           <div className="absolute right-0 mt-1 bg-neutral-800 rounded-lg 
//                           shadow-lg p-2 text-xs min-w-[140px] 
//                           border border-neutral-700 z-30">

//             {/* DELETE FOR ME */}
//             <button
//               className="block w-full text-left px-2 py-1 hover:bg-neutral-700 rounded"
//               onClick={deleteForMe}
//             >
//               Delete for me
//             </button>

//             {/* DELETE FOR EVERYONE — only sender */}
//             {mine && (
//               <button
//                 className="block w-full text-left px-2 py-1 hover:bg-neutral-700 rounded text-red-400"
//                 onClick={deleteForEveryone}
//               >
//                 Delete for everyone
//               </button>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Bubble */}
//       <div
//         className={`rounded-2xl px-4 py-2 ${
//           mine ? "bg-teal-700" : "bg-neutral-800"
//         }`}
//       >
//         {/* Message text */}
//         <div className="whitespace-pre-wrap">{message.body}</div>

//         {/* Time + ticks */}
//         <div className="text-[10px] text-neutral-300 text-right mt-1 flex gap-1 items-center">
//           <span>{dayjs(message.createdAt).format("HH:mm")}</span>
//           {renderTicks()}
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from "react";
import dayjs from "dayjs";
import { socket } from "../socket";

export default function MessageBubble({ message, mine, isGroup, isAdmin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Determine if deleted
  const isDeletedForAll = message.deletedForEveryone;
  const isDeletedForMe =
    Array.isArray(message.deletedFor) &&
    message.deletedFor.includes(message.currentUserId);

  const isDeleted = isDeletedForAll || isDeletedForMe;

  // ✅ Get sender name for group chats
  const senderName = message.sender?.full_name || message.sender?.phone || "Unknown";

  const renderTicks = () => {
    if (isDeleted) return null;
    if (!mine) return null;

    if (message.status === "seen") return <span className="text-blue-400">✔✔</span>;
    if (message.status === "delivered") return <span className="text-gray-300">✔✔</span>;
    return <span className="text-gray-300">✔</span>;
  };

  const deleteForMe = () => {
    socket.emit("message:delete", {
      messageId: message._id,
      forEveryone: false
    });
    setMenuOpen(false);
  };

  const deleteForEveryone = () => {
    // ✅ Allow if sender OR admin (admin check is done by UI showing the button)
    if (!mine && !isAdmin) return;
    socket.emit("message:delete", {
      messageId: message._id,
      forEveryone: true
    });
    setMenuOpen(false);
  };

  // ✅ Show Deleted Bubble Only
  if (isDeleted) {
    return (
      <div className={`max-w-[75%] ${mine ? "ml-auto" : ""}`}>
        <div className="bg-neutral-800 text-neutral-400 italic px-3 py-2 rounded-xl text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`relative max-w-[75%] ${mine ? "ml-auto" : ""}`}>

      {/* ⋮ Menu */}
      <div className="absolute -top-2 -right-2 z-20">
        <button
          className="text-neutral-400 text-sm hover:text-neutral-200"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ⋮
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 bg-slate-800 rounded-lg shadow-lg 
                          p-2 text-xs min-w-[140px] border border-slate-700 z-30">

            {/* Pin/Unpin button */}
            <button
              className="block w-full text-left px-2 py-1 hover:bg-slate-700 rounded text-blue-400"
              onClick={() => {
                if (message.isPinned) {
                  socket.emit("message:unpin", { messageId: message._id, chatId: message.chat });
                } else {
                  socket.emit("message:pin", { messageId: message._id, chatId: message.chat });
                }
                setMenuOpen(false);
              }}
            >
              {message.isPinned ? "📌 Unpin" : "📌 Pin"}
            </button>

            <button
              className="block w-full text-left px-2 py-1 hover:bg-slate-700 rounded"
              onClick={deleteForMe}
            >
              Delete for me
            </button>

            {/* Show "Delete for everyone" for sender OR admin in groups */}
            {(mine || isAdmin) && (
              <button
                className="block w-full text-left px-2 py-1 hover:bg-slate-700 rounded text-red-400"
                onClick={deleteForEveryone}
              >
                Delete for everyone
              </button>
            )}
          </div>
        )}
      </div>

      {/* ✅ Chat Bubble */}
      <div
        className={`rounded-2xl px-3 sm:px-4 py-2 max-w-[85%] sm:max-w-[75%] ${mine ? "bg-blue-600" : "bg-slate-800"
          }`}
      >
        {/* ✅ Show sender name for group chats (only for other users' messages) */}
        {isGroup && !mine && (
          <div className="text-[10px] sm:text-xs text-blue-300 font-semibold mb-1">
            {senderName}
          </div>
        )}

        {/* ✅ Check if message has 5+ lines - show as code block */}
        {message.body && message.body.split('\n').length >= 5 ? (
          <div className="relative">
            {/* Copy Button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.body);
                // Visual feedback
                const btn = document.getElementById(`copy-btn-${message._id}`);
                if (btn) {
                  btn.textContent = '✓ Copied';
                  setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
                }
              }}
              id={`copy-btn-${message._id}`}
              className="absolute top-2 right-2 text-[10px] sm:text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded transition-colors"
            >
              Copy
            </button>
            {/* Code Block */}
            <div className={`rounded-lg p-3 pt-8 overflow-x-auto text-xs sm:text-sm font-mono ${mine ? "bg-blue-800" : "bg-slate-900"
              }`}>
              <pre className="whitespace-pre-wrap break-words">{message.body}</pre>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm sm:text-base break-words">
            {message.body}
          </div>
        )}

        {/* ✅ Ticks + Time */}
        <div className={`text-[10px] text-right mt-1 flex gap-1 items-center justify-end ${mine ? "text-blue-200" : "text-slate-400"
          }`}>
          <span>{dayjs(message.createdAt).format("HH:mm")}</span>
          {renderTicks()}
        </div>
      </div>
    </div>
  );
}
