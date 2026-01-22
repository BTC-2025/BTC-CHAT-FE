import { createContext, useContext, useState, useEffect } from "react";
import { api, setAuth } from "../api";
import { socket } from "../socket";
import { generateKeyPair, exportKey, importKey } from "../utils/cryptoUtils";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// ✅ Simple IndexedDB helper for Private Key storage
const DB_NAME = "OfficeChatCrypto";
const STORE_NAME = "keys";

const getPrivateKey = () => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get("privateKey");
      getReq.onsuccess = () => resolve(getReq.result);
    };
  });
};

const savePrivateKey = (key) => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(key, "privateKey");
      tx.oncomplete = () => resolve();
    };
  });
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("auth_user") || "null")
  );
  const [privateKey, setPrivKey] = useState(null);

  // ✅ Reapply token and load Private Key on app start
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) setAuth(token);

      const key = await getPrivateKey();
      if (key) setPrivKey(key);
    };
    init();
  }, []);

  // ✅ Real-time account disabling listener
  useEffect(() => {
    if (!user) return;

    const handleDisable = () => {
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, isDisabled: true };
        localStorage.setItem("auth_user", JSON.stringify(updated));
        return updated;
      });
    };

    socket.on("account:disabled", handleDisable);

    // Global interceptor to catch 403s from the middleware
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403 && error.response?.data?.message?.includes("Account disabled")) {
          handleDisable();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      socket.off("account:disabled", handleDisable);
      api.interceptors.response.eject(interceptor);
    };
  }, [user?.id]);

  const login = async (phone, password) => {
    const { data } = await api.post("/auth/login", { phone, password });
    setAuth(data.token);
    setUser(data);
    localStorage.setItem("auth_user", JSON.stringify(data));
    localStorage.setItem("auth_token", data.token);

    // ✅ If server has public key but we don't have private key, warn or re-gen (simplified: just log)
    if (data.publicKey) {
      const key = await getPrivateKey();
      if (!key) console.warn("Missing private key for encrypted account!");
      else setPrivKey(key);
    }

    return data;
  };

  const register = async (phone, full_name, password, avatar = "") => {
    // 1. Generate E2EE Keys
    const keyPair = await generateKeyPair();
    const pubKeyB64 = await exportKey(keyPair.publicKey);

    // 2. Register with Public Key
    const { data } = await api.post("/auth/register", {
      phone,
      full_name,
      password,
      avatar,
      publicKey: pubKeyB64
    });

    // 3. Save Private Key locally
    await savePrivateKey(keyPair.privateKey);
    setPrivKey(keyPair.privateKey);

    setAuth(data.token);
    setUser(data);
    localStorage.setItem("auth_user", JSON.stringify(data));
    localStorage.setItem("auth_token", data.token);

    return data;
  };

  const logout = () => {
    setUser(null);
    setPrivKey(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    // Note: We don't delete the private key from IndexedDB to allow re-login
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const { data } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = { ...data, token };
      setUser(updatedUser);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  return (
    <AuthCtx.Provider value={{ user, privateKey, login, register, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
