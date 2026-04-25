import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Each team member changes ONLY this line to their own laptop's WiFi IP
// Run 'ipconfig' (Windows) or 'ifconfig' (Mac) to find it
// During deployment, change this to your Azure URL
const API_URL = "http://192.168.8.155:5000/api";

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

export default api;
