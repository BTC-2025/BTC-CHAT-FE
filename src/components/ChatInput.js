import { useState, useRef } from "react";
import { socket } from "../socket";

export default function ChatInput({ onSend, chatId }) {
  const [val, setVal] = useState("");
  const [typing, setTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const submit = () => {
    const text = val.trim();
    if (!text) return;
    onSend(text);
    setVal("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    socket.emit("typing:stop", { chatId });
    setTyping(false);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setVal(v);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }

    if (!typing) {
      setTyping(true);
      socket.emit("typing:start", { chatId });
    }

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit("typing:stop", { chatId });
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <textarea
        ref={textareaRef}
        className="flex-1 bg-white/80 backdrop-blur-sm border border-background-dark/50 rounded-2xl px-4 py-3 outline-none resize-none overflow-y-auto text-sm sm:text-base focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all duration-200 text-primary placeholder:text-primary/40 shadow-sm"
        placeholder="Type a message..."
        value={val}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={1}
        style={{ maxHeight: "150px" }}
      />
      <button
        onClick={submit}
        disabled={!val.trim()}
        className="px-4 sm:px-5 py-3 bg-gradient-to-r from-primary to-primary-light rounded-2xl hover:from-primary-light hover:to-primary transition-all duration-200 font-semibold text-sm sm:text-base text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <span className="hidden sm:inline">Send</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
}
