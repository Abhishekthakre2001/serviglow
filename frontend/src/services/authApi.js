import axiosInstance from "./axiosInstance";
const authApi = {
  // 🔹 Register a new Partner
  registerPartner: (formData) => {
    return axiosInstance.post("/partner/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 🔹 Register a normal User
  registerUser: (formData) => {
    return axiosInstance.post("/user/register", formData, {
      headers: { "Content-Type": "application/json" },
    });
  },
  sendOtp: (formData) => {
    return axiosInstance.post("/send-otp", formData, {
      headers: { "Content-Type": "application/json" },
    });
  },
  verifyOtp: (formData) => {
    return axiosInstance.post("/verify-otp", formData, {
      headers: { "Content-Type": "application/json" },
    });
  },

  // ✅ Single login API
  login: (payload) => {
    return axiosInstance.post("/auth/login", payload);
  },

  // 🔹 Get All Users
 getAllCustomer: (page = 1, limit = 5) =>
  axiosInstance.get(`/user/customers?page=${page}&limit=${limit}`),

  forgotPassword: (payload) => {
    return axiosInstance.post("/auth/forgot-password", payload);
  },
 forgotverifyOtp: (payload) => {
    return axiosInstance.post("/auth/verify-forgot-otp", payload);
  },
  resetPassword: (payload) => {
    return axiosInstance.post("/auth/reset-password", payload);
  },
};

export default authApi;
