import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


// During deployment, we will change this to our Render/Aure URL
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const registerUser = (userData) => api.post("/auth/register", userData);
export const loginUser = (credentials) => api.post("/auth/login", credentials);
export const getMe = () => api.get("/auth/me");

export const getNotices       = ()         => api.get("/notices");
export const getNoticeById    = (id)       => api.get(`/notices/${id}`);
export const createNotice     = (data)     => api.post("/notices", data);
export const updateNotice     = (id, data) => api.put(`/notices/${id}`, data);
export const deleteNotice     = (id)       => api.delete(`/notices/${id}`);

export default api;
