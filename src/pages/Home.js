import Sidebar from "../components/Sidebar.js";
import ChatWindow from "../components/ChatWindow.js";
import CallModal from "../components/CallModal.js";
import StatusPage from "./StatusPage.js";
import { useState, useEffect } from "react";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext.js";
import logo from "../assets/logo.jpg";

export default function Home() {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState(null);
  const [view, setView] = useState("chats"); // "chats" or "status"
  const [reloadKey, setReloadKey] = useState(0);

  // ✅ Call state
  const [callState, setCallState] = useState({
    isOpen: false,
    callType: null, // "video" or "audio"
    targetUserId: null,
    targetName: null,
    isIncoming: false,
    callerId: null,
    callerName: null,
  });

  useEffect(() => {
    const force = () => setReloadKey(k => k + 1);
    window.addEventListener("chat:reload", force);
    return () => window.removeEventListener("chat:reload", force);
  }, []);

  // ✅ Listen for incoming calls
  useEffect(() => {
    const handleIncomingCall = ({ callerId, callerName, callerAvatar, callType }) => {
      setCallState({
        isOpen: true,
        callType,
        targetUserId: null,
        targetName: null,
        isIncoming: true,
        callerId,
        callerName,
      });
    };

    socket.on("call:incoming", handleIncomingCall);
    return () => socket.off("call:incoming", handleIncomingCall);
  }, []);

  // When a chat is selected
  const handleOpenChat = (chat) => {
    setActiveChat(chat);
  };

  // Back button handler - go back to chat list
  const handleBack = () => {
    setActiveChat(null);
  };

  // ✅ Start a call
  const handleStartCall = (callType) => {
    if (!activeChat || activeChat.isGroup) return;
    setCallState({
      isOpen: true,
      callType,
      targetUserId: activeChat.other?.id,
      targetName: activeChat.other?.full_name || activeChat.other?.phone || "Unknown",
      isIncoming: false,
      callerId: null,
      callerName: null,
    });
  };

  // ✅ Close call modal
  const handleCloseCall = () => {
    setCallState({
      isOpen: false,
      callType: null,
      targetUserId: null,
      targetName: null,
      isIncoming: false,
      callerId: null,
      callerName: null,
    });
  };

  if (view === "status") {
    return <StatusPage onBack={() => setView("chats")} />;
  }

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
            onViewStatus={() => setView("status")}
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
              onStartCall={handleStartCall}
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

      {/* ✅ Call Modal */}
      <CallModal
        callState={callState}
        onClose={handleCloseCall}
        userId={user?.id}
      />
    </div>
  );
}
