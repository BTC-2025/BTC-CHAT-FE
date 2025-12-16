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
  const isOnline = !item.isGroup && item.other?.isOnline;

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
      className={`w-full text-left px-3 sm:px-4 py-3 transition-all duration-200 group relative ${active
        ? "bg-gradient-to-r from-secondary/20 to-secondary/5 border-l-4 border-secondary shadow-sm"
        : "hover:bg-white/60 border-l-4 border-transparent hover:shadow-sm"
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with gradient and online indicator */}
        <div className="relative flex-shrink-0">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full grid place-items-center text-sm font-bold uppercase shadow-md transition-transform group-hover:scale-105 overflow-hidden ${item.isGroup
            ? "bg-gradient-to-br from-secondary-dark to-secondary text-white"
            : "bg-gradient-to-br from-primary to-primary-light text-white"
            }`}>
            {/* Show avatar image if available, otherwise show initial */}
            {!item.isGroup && item.other?.avatar ? (
              <img src={item.other.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              avatarInitial
            )}
          </div>
          {/* Online indicator */}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Pin icon with animation */}
              {isPinned && (
                <span className="text-secondary text-xs transition-transform hover:scale-110">📌</span>
              )}
              <div className={`font-semibold truncate text-sm sm:text-base transition-colors ${active ? "text-primary" : "text-primary/90 group-hover:text-primary"
                }`}>
                {displayName}
              </div>
            </div>

            {/* Time + Pin button */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] sm:text-xs text-primary/50 font-medium">
                {item.lastAt ? dayjs(item.lastAt).fromNow(true) : ""}
              </span>
              <button
                onClick={handlePin}
                className={`p-1.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 ${isPinned
                  ? "text-secondary bg-secondary/10 hover:bg-secondary/20"
                  : "text-primary/30 hover:text-primary/60 hover:bg-primary/5"
                  }`}
                title={isPinned ? "Unpin chat" : "Pin chat"}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.5 3.5a1.5 1.5 0 0 0-1.5 1.5v2.75l-2.15-.55a1 1 0 0 0-1.2.76l-.45 2.24a1 1 0 0 0 .76 1.2l3.04.76V16a.5.5 0 0 0 1 0v-3.84l3.04-.76a1 1 0 0 0 .76-1.2l-.45-2.24a1 1 0 0 0-1.2-.76L10 7.75V5a1.5 1.5 0 0 0-1.5-1.5h2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            {/* Last message preview */}
            <div className={`text-xs sm:text-sm truncate transition-colors ${item.unread > 0 ? "text-primary/80 font-medium" : "text-primary/50"
              }`}>
              {item.lastMessage || "No messages yet"}
            </div>

            {/* Unread badge with animation */}
            {item.unread > 0 && (
              <span className="text-[10px] sm:text-xs bg-gradient-to-r from-secondary to-secondary-dark text-white px-2 py-0.5 rounded-full flex-shrink-0 font-bold shadow-sm animate-bounce-subtle min-w-[20px] text-center">
                {item.unread > 99 ? "99+" : item.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
