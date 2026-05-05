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
// Also remove Content-Type for FormData so axios sets the multipart boundary correctly
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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

// Notice API calls
export const getNotices    = ()         => api.get("/notices");
export const getNoticeById = (id)       => api.get(`/notices/${id}`);
export const createNotice  = (data)     => api.post("/notices", data);
export const updateNotice  = (id, data) => api.put(`/notices/${id}`, data);
export const deleteNotice  = (id)       => api.delete(`/notices/${id}`);

// Internship API calls
export const createInternship = (data) => api.post("/internship", data);

// Internship supervisor management
export const getSupervisors = () => api.get("/internship/supervisors");
export const getAllLecturers = () => api.get("/internship/lecturers");
export const assignSupervisor = (lecturerId) => api.post(`/internship/supervisors/${lecturerId}`);
export const removeSupervisor = (lecturerId) => api.delete(`/internship/supervisors/${lecturerId}`);

// Sathya — Marks & Results API calls
export const createResult     = (data)     => api.post("/results", data);
export const getMyResults     = ()         => api.get("/results/my");
export const getCourseResults = (courseId) => api.get(`/results/course/${courseId}`);
export const updateResult     = (id, data) => api.put(`/results/${id}`, data);
export const deleteResult     = (id)       => api.delete(`/results/${id}`);
export const togglePublish    = (id)       => api.patch(`/results/${id}/publish`);
export const toggleLock       = (id)       => api.patch(`/results/${id}/lock`);
export const exportResults    = ()         => api.get("/results/export");
export const uploadConcernFile = (id, formData) =>
  api.post(`/results/${id}/upload`, formData);

export default api;
