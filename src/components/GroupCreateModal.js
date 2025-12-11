// // client/src/components/GroupCreateModal.js
// import { useState } from "react";
// import axios from "axios";
// import { useAuth } from "../context/AuthContext";

// export default function GroupCreateModal({ open, onClose, onCreated }) {
//   const { user } = useAuth();
//   const [title, setTitle] = useState("");
//   const [description, setDesc] = useState("");
//   const [phones, setPhones] = useState("");
//   const [loading, setLoading] = useState(false);

//   if (!open) return null;

//   const createGroup = async () => {
//     if (!title.trim()) return;
//     setLoading(true);

//     try {
//       const { data } = await axios.post(
//         "http://localhost:5001/api/groups",
//         {
//           title,
//           description,
//           membersPhones: phones
//             .split(",")
//             .map((p) => p.trim())
//             .filter(Boolean),
//         },
//         {
//           headers: { Authorization: `Bearer ${user?.token}` },
//         }
//       );

//       onCreated?.({ id: data.id, isGroup: true });
//       onClose();
//       setTitle("");
//       setDesc("");
//       setPhones("");
//     } catch (e) {
//       alert(e.response?.data?.message || "Group create failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
//       <div className="bg-neutral-900 p-4 border border-neutral-700 rounded-xl w-full max-w-md">
//         <div className="text-lg font-semibold mb-3">Create Group</div>

//         <div className="space-y-3">
//           <input
//             className="w-full bg-neutral-800 px-3 py-2 rounded outline-none"
//             placeholder="Group title"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//           />
//           <input
//             className="w-full bg-neutral-800 px-3 py-2 rounded outline-none"
//             placeholder="Description"
//             value={description}
//             onChange={(e) => setDesc(e.target.value)}
//           />
//           <textarea
//             className="w-full bg-neutral-800 px-3 py-2 rounded outline-none"
//             placeholder="Member phones (comma separated)"
//             value={phones}
//             onChange={(e) => setPhones(e.target.value)}
//           />
//         </div>

//         <div className="flex justify-end mt-4 gap-2">
//           <button
//             className="px-3 py-2 bg-neutral-700 rounded"
//             onClick={onClose}
//           >
//             Cancel
//           </button>
//           <button
//             disabled={loading}
//             onClick={createGroup}
//             className="px-3 py-2 bg-teal-600 hover:bg-teal-500 rounded disabled:opacity-50"
//           >
//             {loading ? "Creating..." : "Create"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



import { useState, useEffect } from "react";
import axios from "axios";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

export default function GroupCreateModal({ open, onClose, onCreated }) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contacts, setContacts] = useState([]); // List of contacts from existing chats
  const [selectedMembers, setSelectedMembers] = useState([]); // Selected user IDs
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // ✅ Fetch contacts when modal opens
  useEffect(() => {
    if (!open || !user?.token) return;

    const fetchContacts = async () => {
      setLoadingContacts(true);
      try {
        const { data } = await axios.get("https://btc-chat-be.onrender.com/api/chats", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        // Extract unique contacts from 1:1 chats (not groups)
        const contactList = data
          .filter(chat => !chat.isGroup && chat.other)
          .map(chat => ({
            id: chat.other.id,
            name: chat.other.full_name || chat.other.phone,
            phone: chat.other.phone,
          }));

        setContacts(contactList);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, [open, user]);

  // ✅ Toggle member selection
  const toggleMember = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // ✅ Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setSelectedMembers([]);
    }
  }, [open]);

  if (!open) return null;

  const createGroup = () => {
    if (!title.trim()) return alert("Group title required");
    if (selectedMembers.length === 0) return alert("Select at least one member");

    setLoading(true);

    // ✅ Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // ✅ Get phone numbers of selected members
    const phones = contacts
      .filter((c) => selectedMembers.includes(c.id))
      .map((c) => c.phone);

    // ✅ Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
      alert("Group creation timed out. Please try again.");
    }, 15000);

    // ✅ Emit socket event with proper callback handling
    socket.emit(
      "group:create",
      {
        title,
        description,
        participants: phones,
      },
      (response) => {
        clearTimeout(timeout);
        setLoading(false);

        if (response?.success) {
          setTitle("");
          setDescription("");
          setSelectedMembers([]);
          if (onCreated) onCreated();
          onClose();
        } else {
          alert(response?.error || "Failed to create group. Please try again.");
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-xl p-4 sm:p-5 border border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-white">Create Group</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-700 px-3 py-2.5 rounded-lg mb-3 outline-none text-sm sm:text-base focus:ring-2 focus:ring-blue-500 transition-shadow"
          placeholder="Group name"
        />

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-700 px-3 py-2.5 rounded-lg mb-3 outline-none text-sm sm:text-base focus:ring-2 focus:ring-blue-500 transition-shadow"
          placeholder="Group description (optional)"
        />

        {/* ✅ Contact Selection */}
        <div className="text-xs sm:text-sm text-slate-400 mb-2">Select Members:</div>

        <div className="flex-1 overflow-y-auto bg-slate-700 rounded-lg p-2 mb-4 max-h-48">
          {loadingContacts ? (
            <div className="text-slate-400 text-sm p-2">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="text-slate-400 text-sm p-2">No contacts found. Start a chat first.</div>
          ) : (
            contacts.map((contact) => (
              <label
                key={contact.id}
                className="flex items-center gap-3 p-2 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(contact.id)}
                  onChange={() => toggleMember(contact.id)}
                  className="w-4 h-4 accent-blue-600"
                />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 grid place-items-center text-xs font-semibold uppercase">
                    {contact.name?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{contact.name}</div>
                    <div className="text-xs text-slate-400">{contact.phone}</div>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {/* ✅ Selected count */}
        {selectedMembers.length > 0 && (
          <div className="text-xs text-blue-400 mb-3">
            {selectedMembers.length} member{selectedMembers.length > 1 ? "s" : ""} selected
          </div>
        )}

        <div className="flex justify-end gap-2 sm:gap-3">
          <button
            className="px-3 sm:px-4 py-2 bg-slate-600 rounded-lg hover:bg-slate-500 text-sm font-medium transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-3 sm:px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 text-sm font-medium transition-colors"
            onClick={createGroup}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
