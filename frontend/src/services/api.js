import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Each team member changes ONLY this line to their own laptop's WiFi IP
// Run 'ipconfig' (Windows) or 'ifconfig' (Mac) to find it
// During deployment, change this to your Azure URL
const API_URL = "http://192.168.1.2:5000/api";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token to every request
// Also remove Content-Type for FormData so axios can set the multipart boundary automatically
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // If the request body is FormData, let axios set Content-Type with boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
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

// Results API calls
export const createResult = (data) => api.post("/results", data);
export const getMyResults = () => api.get("/results/my");
export const getCourseResults = (courseId) => api.get(`/results/course/${courseId}`);
export const updateResult = (id, data) => api.put(`/results/${id}`, data);
export const deleteResult = (id) => api.delete(`/results/${id}`);
export const togglePublish = (id) => api.patch(`/results/${id}/publish`);
export const toggleLock = (id) => api.patch(`/results/${id}/lock`);
export const exportResults = () => api.get("/results/export");
export const uploadConcernFile = (id, formData) =>
  api.post(`/results/${id}/upload`, formData);

export default api;