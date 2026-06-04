import axiosInstance from "./axiosInstance";

const profileApi = {
// User/Customer
  getProfile: () =>
    axiosInstance.get(`/user`),
// Partner
  getPartnerProfile: () =>
    axiosInstance.get(`/partner/profile`),
  updatePartnerProfile: (payload) => axiosInstance.patch(`/partner/profile`, payload),
// Admin
  updateProfile: (payload) => axiosInstance.patch(`/user/profile`, payload),
  updateAdminProfile: (payload) => axiosInstance.patch(`/admin/profile`, payload),
};

export default profileApi;
