import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { socket } from "../socket";
dayjs.extend(relativeTime);

export default function ChatListItem({ item, active, onClick, userId }) {
  const displayName = item.isGroup
    ? item.title
    : (item.other?.full_name || item.other?.phone);

  const avatarInitial = item.isGroup
    ? (item.title?.[0] || "G")
    : (item.other?.full_name?.[0] || item.other?.phone?.slice(-2));

  // Check if chat is pinned for this user
  const isPinned = item.isPinned || item.pinnedBy?.includes(userId);

  const handlePin = (e) => {
    e.stopPropagation();
    if (isPinned) {
      socket.emit("chat:unpin", { chatId: item.id });
    } else {
      socket.emit("chat:pin", { chatId: item.id });
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 sm:px-4 py-3 transition-colors ${active
          ? "bg-blue-900/50 border-l-4 border-blue-500"
          : "hover:bg-slate-800 border-l-4 border-transparent"
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center uppercase text-xs sm:text-sm font-semibold flex-shrink-0 ${item.isGroup ? "bg-indigo-600" : "bg-blue-600"
          }`}>
          {avatarInitial}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Pin icon */}
              {isPinned && (
                <span className="text-blue-400 text-xs">📌</span>
              )}
              <div className="font-medium truncate text-sm sm:text-base">
                {displayName}
              </div>
            </div>

            {/* Time + Pin button */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[10px] sm:text-xs text-slate-400">
                {item.lastAt ? dayjs(item.lastAt).fromNow() : ""}
              </span>
              <button
                onClick={handlePin}
                className={`p-1 rounded hover:bg-slate-600 transition-colors ${isPinned ? "text-blue-400" : "text-slate-500"
                  }`}
                title={isPinned ? "Unpin chat" : "Pin chat"}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.5 3.5a1.5 1.5 0 0 0-1.5 1.5v2.75l-2.15-.55a1 1 0 0 0-1.2.76l-.45 2.24a1 1 0 0 0 .76 1.2l3.04.76V16a.5.5 0 0 0 1 0v-3.84l3.04-.76a1 1 0 0 0 .76-1.2l-.45-2.24a1 1 0 0 0-1.2-.76L10 7.75V5a1.5 1.5 0 0 0-1.5-1.5h2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            {/* Last message preview */}
            <div className="text-xs sm:text-sm text-slate-400 truncate">
              {item.lastMessage || "No messages yet"}
            </div>

            {/* ✅ Unread badge */}
            {item.unread > 0 && (
              <span className="text-[10px] sm:text-xs bg-blue-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0">
                {item.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

