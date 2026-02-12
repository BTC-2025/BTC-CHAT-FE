import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../api";
import StatusModal from "./StatusModal";

export default function StatusSection() {
    const { user } = useAuth();
    const [statusGroups, setStatusGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const fetchStatuses = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/status`, {
                headers: { Authorization: `Bearer ${user?.token}` }
            });
            setStatusGroups(data);
        } catch (err) {
            console.error("Failed to fetch statuses:", err);
        }
    };

    useEffect(() => {
        if (user?.token) fetchStatuses();
    }, [user?.token]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload file
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await axios.post(
                `${API_BASE}/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // 2. Create status
            await axios.post(
                `${API_BASE}/status`,
                { content: uploadRes.data.url, type: "image" },
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );

            fetchStatuses();
        } catch (err) {
            console.error("Status upload failed:", err);
            alert("Failed to upload status.");
        } finally {
            setUploading(false);
        }
    };

    const myGroup = statusGroups.find(g => g.user._id === user?.id);
    const otherGroups = statusGroups.filter(g => g.user._id !== user?.id);

    return (
        <div className="status-section px-4 py-3 border-b border-background-dark/30 bg-white/10 backdrop-blur-sm overflow-x-auto">
            <div className="flex gap-4 items-center min-w-max pb-1">
                {/* My Status */}
                <div className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => myGroup ? setSelectedGroup(myGroup) : fileInputRef.current?.click()}>
                    <div className="relative">
                        <div className={`w-14 h-14 rounded-full p-[2px] ${myGroup ? "bg-gradient-to-tr from-secondary to-primary" : "bg-background-dark"}`}>
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white flex items-center justify-center">
                                {user?.avatar ? (
                                    <img src={user.avatar} className="w-full h-full object-cover" alt="Me" />
                                ) : (
                                    <span className="text-xl font-bold text-secondary">{user?.full_name?.[0] || "?"}</span>
                                )}
                            </div>
                        </div>
                        {!myGroup && (
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-secondary rounded-full flex items-center justify-center text-white border-2 border-white text-xs font-bold ring-1 ring-secondary/50">
                                +
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-semibold text-primary/70 group-hover:text-primary transition-colors">My Flash</span>
                    <input type="file" hidden ref={fileInputRef} onChange={handleUpload} accept="image/*" />
                </div>

                {/* Vertical Divider */}
                {otherGroups.length > 0 && <div className="w-[1px] h-10 bg-background-dark/30 mx-1" />}

                {/* Other Statuses */}
                {otherGroups.map((group) => (
                    <div key={group.user._id} className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => setSelectedGroup(group)}>
                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-secondary/50 to-primary/50 group-hover:from-secondary group-hover:to-primary transition-all shadow-sm">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                                {group.user.avatar ? (
                                    <img src={group.user.avatar} className="w-full h-full object-cover" alt={group.user.full_name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-secondary">
                                        {group.user.full_name?.[0] || "?"}
                                    </div>
                                )}
                            </div>
                        </div>
                        <span className="text-[10px] font-semibold text-primary/70 group-hover:text-primary transition-colors truncate w-16 text-center">
                            {group.user.full_name?.split(" ")[0]}
                        </span>
                    </div>
                ))}
            </div>

            {selectedGroup && (
                <StatusModal
                    group={selectedGroup}
                    onClose={() => setSelectedGroup(null)}
                    onDelete={fetchStatuses}
                />
            )}
        </div>
    );
}
