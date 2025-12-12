import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../socket";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

// Create ringtone sound using Web Audio API
const createRingtone = (audioContext, isOutgoing = false) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = isOutgoing ? 440 : 480; // Different pitch for outgoing vs incoming
    gainNode.gain.value = 0.3;

    return { oscillator, gainNode };
};

export default function CallModal({ callState, onClose, userId }) {
    const [callStatus, setCallStatus] = useState("idle"); // idle, calling, ringing, connected
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null); // For audio calls
    const peerConnectionRef = useRef(null);
    const localStreamRef = useRef(null);
    const durationIntervalRef = useRef(null);
    const ringtoneIntervalRef = useRef(null);
    const audioContextRef = useRef(null);

    const { isOpen, callType, targetUserId, targetName, isIncoming, callerId, callerName } = callState;

    // Play ringtone
    const startRingtone = useCallback((isOutgoing) => {
        try {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

            const playTone = () => {
                const { oscillator, gainNode } = createRingtone(audioContextRef.current, isOutgoing);
                oscillator.start();

                // Ring pattern: 0.5s on, 0.3s off for outgoing, 1s on, 2s off for incoming
                setTimeout(() => {
                    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
                    setTimeout(() => oscillator.stop(), 100);
                }, isOutgoing ? 500 : 1000);
            };

            playTone();
            ringtoneIntervalRef.current = setInterval(playTone, isOutgoing ? 800 : 3000);
        } catch (err) {
            console.log("Could not play ringtone:", err);
        }
    }, []);

    // Stop ringtone
    const stopRingtone = useCallback(() => {
        if (ringtoneIntervalRef.current) {
            clearInterval(ringtoneIntervalRef.current);
            ringtoneIntervalRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, []);

    // Cleanup function
    const cleanup = useCallback(() => {
        stopRingtone();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        setCallStatus("idle");
        setCallDuration(0);
        setIsMuted(false);
        setIsCameraOff(false);
    }, [stopRingtone]);

    // Initialize media and peer connection
    const initializeCall = useCallback(async (isInitiator) => {
        try {
            const constraints = {
                audio: true,
                video: callType === "video" ? { width: 640, height: 480 } : false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            if (localVideoRef.current && callType === "video") {
                localVideoRef.current.srcObject = stream;
            }

            // Create peer connection
            const pc = new RTCPeerConnection(ICE_SERVERS);
            peerConnectionRef.current = pc;

            // Add local stream tracks to peer connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Handle incoming remote stream
            pc.ontrack = (event) => {
                console.log("Received remote track:", event.track.kind);
                if (event.streams[0]) {
                    if (callType === "video" && remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    } else if (callType === "audio" && remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = event.streams[0];
                    }
                }
            };

            // Handle ICE candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("call:ice-candidate", {
                        targetUserId: isIncoming ? callerId : targetUserId,
                        candidate: event.candidate,
                    });
                }
            };

            // Connection state changes
            pc.onconnectionstatechange = () => {
                console.log("Connection state:", pc.connectionState);
                if (pc.connectionState === "connected") {
                    stopRingtone();
                    setCallStatus("connected");
                    // Start duration timer
                    durationIntervalRef.current = setInterval(() => {
                        setCallDuration(prev => prev + 1);
                    }, 1000);
                } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
                    handleEndCall();
                }
            };

            if (isInitiator) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("call:offer", {
                    targetUserId,
                    offer,
                });
            }
        } catch (err) {
            console.error("Failed to initialize call:", err);
            alert("Could not access camera/microphone. Please check permissions.");
            handleEndCall();
        }
    }, [callType, isIncoming, callerId, targetUserId, stopRingtone]);

    // Handle outgoing call initiation
    useEffect(() => {
        if (isOpen && !isIncoming && callStatus === "idle") {
            setCallStatus("calling");
            startRingtone(true); // Play dialing sound
            socket.emit("call:initiate", { targetUserId, callType }, (response) => {
                if (!response?.success) {
                    stopRingtone();
                    alert(response?.error || "Failed to initiate call");
                    onClose();
                }
            });
        }
    }, [isOpen, isIncoming, targetUserId, callType, callStatus, onClose, startRingtone, stopRingtone]);

    // Play ringtone for incoming calls
    useEffect(() => {
        if (isOpen && isIncoming && callStatus === "idle") {
            startRingtone(false); // Play incoming ringtone
        }
        return () => stopRingtone();
    }, [isOpen, isIncoming, callStatus, startRingtone, stopRingtone]);

    // Socket event listeners
    useEffect(() => {
        if (!isOpen) return;

        const handleAccepted = async ({ recipientId }) => {
            stopRingtone();
            setCallStatus("connecting");
            await initializeCall(true);
        };

        const handleRejected = () => {
            stopRingtone();
            alert("Call was rejected");
            cleanup();
            onClose();
        };

        const handleOffer = async ({ callerId: offerCallerId, offer }) => {
            if (!peerConnectionRef.current) {
                await initializeCall(false);
            }
            const pc = peerConnectionRef.current;
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("call:answer", {
                targetUserId: offerCallerId,
                answer,
            });
        };

        const handleAnswer = async ({ answer }) => {
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        };

        const handleIceCandidate = async ({ candidate }) => {
            const pc = peerConnectionRef.current;
            if (pc && candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.log("ICE candidate error:", err);
                }
            }
        };

        const handleEnded = () => {
            cleanup();
            onClose();
        };

        socket.on("call:accepted", handleAccepted);
        socket.on("call:rejected", handleRejected);
        socket.on("call:offer", handleOffer);
        socket.on("call:answer", handleAnswer);
        socket.on("call:ice-candidate", handleIceCandidate);
        socket.on("call:ended", handleEnded);

        return () => {
            socket.off("call:accepted", handleAccepted);
            socket.off("call:rejected", handleRejected);
            socket.off("call:offer", handleOffer);
            socket.off("call:answer", handleAnswer);
            socket.off("call:ice-candidate", handleIceCandidate);
            socket.off("call:ended", handleEnded);
        };
    }, [isOpen, initializeCall, cleanup, onClose, stopRingtone]);

    // Accept incoming call
    const handleAcceptCall = async () => {
        stopRingtone();
        setCallStatus("connecting");
        socket.emit("call:accept", { callerId });
        await initializeCall(false);
    };

    // Reject incoming call
    const handleRejectCall = () => {
        stopRingtone();
        socket.emit("call:reject", { callerId });
        cleanup();
        onClose();
    };

    // End call
    const handleEndCall = () => {
        stopRingtone();
        socket.emit("call:end", { targetUserId: isIncoming ? callerId : targetUserId });
        cleanup();
        onClose();
    };

    // Toggle mute
    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    // Toggle camera
    const toggleCamera = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCameraOff(!videoTrack.enabled);
            }
        }
    };

    // Format duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (!isOpen) return null;

    const displayName = isIncoming ? callerName : targetName;

    return (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col">
            {/* Hidden audio element for audio calls */}
            <audio ref={remoteAudioRef} autoPlay playsInline />

            {/* Incoming call UI */}
            {isIncoming && callStatus === "idle" && (
                <div className="flex-1 flex flex-col items-center justify-center text-white">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center text-3xl font-bold mb-6 animate-pulse">
                        {displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">{displayName}</h2>
                    <p className="text-white/60 mb-8">
                        Incoming {callType} call...
                    </p>
                    <div className="flex gap-8">
                        <button
                            onClick={handleRejectCall}
                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button
                            onClick={handleAcceptCall}
                            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors animate-pulse"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Calling / Connected UI */}
            {(!isIncoming || callStatus !== "idle") && (
                <>
                    {/* Video area */}
                    <div className="flex-1 relative">
                        {/* Remote video (full screen) */}
                        {callType === "video" && (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Audio-only placeholder */}
                        {callType === "audio" && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white">
                                <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-5xl font-bold mb-6 ${callStatus !== "connected" ? "animate-pulse" : ""}`}>
                                    {displayName?.[0]?.toUpperCase() || "?"}
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">{displayName}</h2>
                                <p className="text-white/60">
                                    {callStatus === "calling" && "Calling..."}
                                    {callStatus === "connecting" && "Connecting..."}
                                    {callStatus === "connected" && formatDuration(callDuration)}
                                </p>
                            </div>
                        )}

                        {/* Local video (small overlay) */}
                        {callType === "video" && (
                            <div className="absolute top-4 right-4 w-32 h-24 rounded-lg overflow-hidden bg-black border-2 border-white/20">
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover ${isCameraOff ? "hidden" : ""}`}
                                />
                                {isCameraOff && (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xs">
                                        Camera Off
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status overlay for video calls */}
                        {callType === "video" && callStatus !== "connected" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="text-center text-white">
                                    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                                        <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin" />
                                    </div>
                                    <p>{callStatus === "calling" ? "Calling..." : "Connecting..."}</p>
                                </div>
                            </div>
                        )}

                        {/* Duration overlay for video */}
                        {callType === "video" && callStatus === "connected" && (
                            <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm">
                                {formatDuration(callDuration)}
                            </div>
                        )}
                    </div>

                    {/* Controls - Always visible at bottom */}
                    <div className="p-6 pb-8 bg-gradient-to-t from-black to-black/80 flex items-center justify-center gap-8 safe-area-bottom">
                        {/* Mute button */}
                        <button
                            onClick={toggleMute}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? "bg-red-500" : "bg-white/20 hover:bg-white/30"
                                }`}
                        >
                            {isMuted ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </button>

                        {/* END CALL button - Large and prominent */}
                        <button
                            onClick={handleEndCall}
                            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-xl ring-4 ring-red-500/30"
                        >
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                            </svg>
                        </button>

                        {/* Camera toggle (video calls only) */}
                        {callType === "video" && (
                            <button
                                onClick={toggleCamera}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isCameraOff ? "bg-red-500" : "bg-white/20 hover:bg-white/30"
                                    }`}
                            >
                                {isCameraOff ? (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

