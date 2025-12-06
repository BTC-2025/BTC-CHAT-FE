import axios from "axios";

// ✅ Production backend URL
const API_BASE = "https://btc-chat-be.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE,
});

// ✅ attach token on login/register OR page reload
export const setAuth = (token) => {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};
