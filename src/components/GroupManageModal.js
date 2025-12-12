// client/src/components/GroupManageModal.js
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function GroupManageModal({ chatId, open, onClose }) {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [phone, setPhone] = useState("");
  const [meta, setMeta] = useState({ title: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `https://btc-chat-be.onrender.com/api/groups/${chatId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      setGroup(data);
      setMeta({ title: data.title, description: data.description });
    } catch (e) {
      console.error("Group info error:", e);
      setError(e.response?.data?.message || "Failed to load group info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && chatId) {
      setGroup(null); // Reset on open
      load();
    }
  }, [open, chatId]);

  if (!open) return null;

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4">
        <div className="bg-white border border-background-dark rounded-xl p-6 w-full max-w-md text-center shadow-xl">
          <div className="text-primary">Loading group info...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4">
        <div className="bg-white border border-background-dark rounded-xl p-6 w-full max-w-md shadow-xl">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary rounded-lg hover:bg-primary-light text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!group) return null;

  const addMember = async () => {
    try {
      await axios.post(
        `https://btc-chat-be.onrender.com/api/groups/${chatId}/members`,
        { phone },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      load();
      setPhone("");
    } catch (e) {
      alert(e.response?.data?.message);
    }
  };

  const removeMember = async (phone) => {
    try {
      await axios.delete(
        `https://btc-chat-be.onrender.com/api/groups/${chatId}/members`,
        {
          data: { phone },
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );
      load();
    } catch (e) {
      alert(e.response?.data?.message);
    }
  };

  const toggleAdmin = async (phone, promote) => {
    try {
      await axios.post(
        `https://btc-chat-be.onrender.com/api/groups/${chatId}/admins`,
        { phone, promote },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      load();
    } catch (e) {
      alert(e.response?.data?.message);
    }
  };

  const saveMeta = async () => {
    try {
      await axios.patch(
        `https://btc-chat-be.onrender.com/api/groups/${chatId}`,
        meta,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );
      load();
    } catch (e) {
      alert(e.response?.data?.message);
    }
  };

  const isAdmin = group.admins.includes(user.id);

  return (
    <div className="fixed inset-0 bg-black/60 grid place-items-center z-50 p-4">
      <div className="bg-white border border-background-dark rounded-xl p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-semibold text-primary">Group Info</div>
          <button onClick={onClose} className="text-primary/40 hover:text-primary transition-colors">✕</button>
        </div>

        {/* META */}
        <input
          disabled={!isAdmin}
          className="w-full bg-background border border-background-dark mb-2 px-3 py-2.5 rounded-lg text-sm sm:text-base outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 text-primary"
          value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
        />
        <input
          disabled={!isAdmin}
          className="w-full bg-background border border-background-dark mb-3 px-3 py-2.5 rounded-lg text-sm sm:text-base outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50 text-primary"
          value={meta.description}
          onChange={(e) =>
            setMeta({ ...meta, description: e.target.value })
          }
        />

        {isAdmin && (
          <button
            onClick={saveMeta}
            className="px-3 py-2 mb-4 bg-primary rounded-lg hover:bg-primary-light text-sm font-medium transition-colors text-white"
          >
            Save
          </button>
        )}

        {/* MEMBERS */}
        <div className="text-sm text-primary/60 mb-2">Members</div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {group.members.map((m) => {
            const isMAdmin = group.admins.includes(m.id);

            return (
              <div
                key={m.id}
                className="flex items-center justify-between bg-background border border-background-dark px-3 py-2 rounded-lg"
              >
                <div className="min-w-0">
                  <div className="text-sm sm:text-base truncate text-primary">{m.name || m.phone}</div>
                  <div className="text-xs text-primary/60">{m.phone}</div>
                </div>

                {isAdmin && (
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => removeMember(m.phone)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                    >
                      Remove
                    </button>

                    {!isMAdmin && (
                      <button
                        onClick={() => toggleAdmin(m.phone, true)}
                        className="px-2 py-1 bg-secondary text-primary-dark rounded text-xs hover:bg-secondary-dark transition-colors"
                      >
                        Admin
                      </button>
                    )}

                    {isMAdmin && (
                      <button
                        onClick={() => toggleAdmin(m.phone, false)}
                        className="px-2 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors"
                      >
                        Remove Admin
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ADD MEMBER */}
        {isAdmin && (
          <div className="mt-4 flex gap-2">
            <input
              className="flex-1 bg-background border border-background-dark px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-secondary text-primary placeholder:text-primary/50"
              placeholder="Enter phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              onClick={addMember}
              className="px-3 py-2 bg-primary rounded-lg text-sm font-medium hover:bg-primary-light transition-colors text-white"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
