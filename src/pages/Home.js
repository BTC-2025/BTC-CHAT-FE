import Sidebar from "../components/Sidebar.js";
import ChatWindow from "../components/ChatWindow.js";
import { useState, useEffect } from "react";
import logo from "../assets/logo.jpg";

export default function Home() {
  const [activeChat, setActiveChat] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const force = () => setReloadKey(k => k + 1);
    window.addEventListener("chat:reload", force);
    return () => window.removeEventListener("chat:reload", force);
  }, []);

  // When a chat is selected
  const handleOpenChat = (chat) => {
    setActiveChat(chat);
  };

  // Back button handler - go back to chat list
  const handleBack = () => {
    setActiveChat(null);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <div className="h-full w-full flex">

        {/* ✅ SIDEBAR - Hidden on mobile when chat is open */}
        <div className={`
          ${activeChat ? 'hidden' : 'flex'} 
          md:flex
          w-full md:w-1/3 lg:w-1/4 
          h-full overflow-hidden border-r border-background-dark
          flex-col
        `}>
          <Sidebar
            onOpenChat={handleOpenChat}
            activeChatId={activeChat?.id}
          />
        </div>

        {/* ✅ CHAT WINDOW - Full screen on mobile when chat is open */}
        <div className={`
          ${activeChat ? 'flex' : 'hidden'} 
          md:flex
          w-full md:w-2/3 lg:w-3/4 
          h-full overflow-hidden
          flex-col
        `}>
          {activeChat ? (
            <ChatWindow
              key={activeChat?.id + reloadKey}
              chat={activeChat}
              onBack={handleBack}
            />
          ) : (
            <div className="h-full grid place-items-center text-primary/60 p-4 text-center bg-background">
              <div>
                <img src={logo} alt="BTC Chat" className="w-20 h-20 mx-auto mb-4 rounded-xl opacity-80" />
                <div className="text-xl font-semibold text-primary mb-2">BTC - Chat</div>
                <div className="text-sm">Select a chat or search by phone to start messaging.</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
