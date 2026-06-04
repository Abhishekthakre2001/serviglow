import axiosInstance from "./axiosInstance";

const dashboardApi = {
  // Admin Routes
  getAdminDashboardData: () => axiosInstance.get("/admin/dashboard"),
 getAdminLast7DaysBookings: () =>
    axiosInstance.get("/admin/last7days-bookings"),
  //   #############################################################

  // Partner Routes
  getPartnerDashboardData: () => axiosInstance.get("/partner/dashboard"),
  getPartnerLast7DaysBookings: () =>
    axiosInstance.get("/partner/last7days-bookings"),

  //   #############################################################
  // Customer Routes
  getCustomerDashboardData: () => axiosInstance.get("/user/dashboard"),
};

export default dashboardApi;
