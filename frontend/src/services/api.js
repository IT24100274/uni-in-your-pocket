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



// Mahdhi Ticket API calls

// createTicket always uses FormData so it handles optional file attachments
export const createTicket = (formData) =>
  api.post("/tickets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getMyTickets = () => api.get("/tickets/my");
export const getAllTickets = () => api.get("/tickets/all");
export const getForwardedTickets = () => api.get("/tickets/forwarded");
export const getTicketById = (id) => api.get(`/tickets/${id}`);
export const respondToTicket = (id, data) => api.put(`/tickets/${id}/respond`, data);
export const forwardTicket = (id, data) => api.put(`/tickets/${id}/forward`, data);
export const closeTicket = (id) => api.put(`/tickets/${id}/close`);
export const deleteTicket = (id) => api.delete(`/tickets/${id}`);


// Helper: get all students (used by rep in RaiseTicketScreen)
export const getStudentsList = () => api.get("/tickets/students");

// Helper: get all staff (lecturers + admins) for forwarding picker
export const getStaffList = () => api.get("/tickets/staff");


export default api;
