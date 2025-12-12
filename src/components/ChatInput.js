import { useState, useRef } from "react";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function ChatInput({ onSend, chatId }) {
  const { user } = useAuth();
  const [val, setVal] = useState("");
  const [typing, setTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const submit = async () => {
    const text = val.trim();
    if (!text && attachments.length === 0) return;

    // Send message with attachments
    onSend(text, attachments);
    setVal("");
    setAttachments([]);

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

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          "https://btc-chat-be.onrender.com/api/upload",
          formData,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        return response.data;
      });

      const uploaded = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      setRecording(false);
      setRecordingTime(0);
      clearInterval(recordingTimerRef.current);
    }
  };

  const uploadVoiceMessage = async (audioBlob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, `voice-${Date.now()}.webm`);

      const response = await axios.post(
        "https://btc-chat-be.onrender.com/api/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Send voice message immediately
      onSend("", [{ ...response.data, type: "audio" }]);
    } catch (error) {
      console.error("Voice upload failed:", error);
      alert("Failed to send voice message.");
    } finally {
      setUploading(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap p-2 bg-white/50 rounded-xl border border-background-dark/30">
          {attachments.map((att, index) => (
            <div key={index} className="relative group">
              {att.type === "image" ? (
                <img
                  src={att.url}
                  alt={att.name}
                  className="w-16 h-16 object-cover rounded-lg border border-background-dark/30"
                />
              ) : att.type === "video" ? (
                <div className="w-16 h-16 bg-primary/10 rounded-lg border border-background-dark/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ) : att.type === "audio" ? (
                <div className="w-16 h-16 bg-secondary/10 rounded-lg border border-background-dark/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 bg-background-dark/50 rounded-lg border border-background-dark/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording UI */}
      {recording && (
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200 animate-pulse">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-medium">Recording... {formatTime(recordingTime)}</span>
          <div className="flex-1" />
          <button
            onClick={cancelRecording}
            className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
            title="Cancel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={stopRecording}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="Send"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      )}

      {/* Input Row */}
      {!recording && (
        <div className="flex gap-3 items-end">
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-3 bg-white/80 border border-background-dark/50 rounded-2xl hover:bg-background-dark transition-all duration-200 disabled:opacity-50"
            title="Attach file"
          >
            {uploading ? (
              <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />

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

          {/* Voice Message Button */}
          {!val.trim() && attachments.length === 0 ? (
            <button
              onClick={startRecording}
              disabled={uploading}
              className="p-3 bg-secondary/10 border border-secondary/30 rounded-2xl hover:bg-secondary/20 transition-all duration-200 disabled:opacity-50"
              title="Record voice message"
            >
              <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V22h-2v-6.07z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={(!val.trim() && attachments.length === 0) || uploading}
              className="px-4 sm:px-5 py-3 bg-gradient-to-r from-primary to-primary-light rounded-2xl hover:from-primary-light hover:to-primary transition-all duration-200 font-semibold text-sm sm:text-base text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="hidden sm:inline">Send</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
