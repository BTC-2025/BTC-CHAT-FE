// client/src/components/GroupManageModal.js
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function GroupManageModal({ chatId, open, onClose }) {
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [phone, setPhone] = useState("");
  const [meta, setMeta] = useState({ title: "", description: "" });

  const load = async () => {
    try {
      const { data } = await axios.get(
        `https://btc-chat-be.onrender.com/api/groups/${chatId}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );

      setGroup(data);
      setMeta({ title: data.title, description: data.description });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open, chatId]);

  if (!open || !group) return null;

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
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-3">
          <div className="text-lg font-semibold">Group Info</div>
          <button onClick={onClose}>✕</button>
        </div>

        {/* META */}
        <input
          disabled={!isAdmin}
          className="w-full bg-neutral-800 mb-2 px-3 py-2 rounded"
          value={meta.title}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
        />
        <input
          disabled={!isAdmin}
          className="w-full bg-neutral-800 mb-3 px-3 py-2 rounded"
          value={meta.description}
          onChange={(e) =>
            setMeta({ ...meta, description: e.target.value })
          }
        />

        {isAdmin && (
          <button
            onClick={saveMeta}
            className="px-3 py-2 mb-4 bg-teal-600 rounded hover:bg-teal-500"
          >
            Save
          </button>
        )}

        {/* MEMBERS */}
        <div className="text-sm text-neutral-400 mb-2">Members</div>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {group.members.map((m) => {
            const isMAdmin = group.admins.includes(m.id);

            return (
              <div
                key={m.id}
                className="flex items-center justify-between bg-neutral-800 px-3 py-2 rounded"
              >
                <div>
                  <div>{m.name || m.phone}</div>
                  <div className="text-xs text-neutral-400">{m.phone}</div>
                </div>

                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => removeMember(m.phone)}
                      className="px-2 py-1 bg-neutral-700 rounded text-xs"
                    >
                      Remove
                    </button>

                    {!isMAdmin && (
                      <button
                        onClick={() => toggleAdmin(m.phone, true)}
                        className="px-2 py-1 bg-teal-700 rounded text-xs"
                      >
                        Make Admin
                      </button>
                    )}

                    {isMAdmin && (
                      <button
                        onClick={() => toggleAdmin(m.phone, false)}
                        className="px-2 py-1 bg-neutral-700 rounded text-xs"
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
              className="flex-1 bg-neutral-800 px-3 py-2 rounded"
              placeholder="Enter phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button
              onClick={addMember}
              className="px-3 py-2 bg-teal-600 rounded"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
