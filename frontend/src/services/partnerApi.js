import axiosInstance from "./axiosInstance";
const partnerApi = {
  getProfile: async () => {
    const res = await axiosInstance.get("/admin/partners");
    return res.data;
  },

  getRevenueDetailsByPartnerId: (id, page, limit) =>
    axiosInstance.get(`/partner/revenue-details/${id}?page=${page}&limit=${limit}`),

  // Get single partner
  getPartnerById: (id) =>
    axiosInstance.get(`/admin/partners/${id}`),



  // updatePartnerStatus: (id, status) =>
  //   axiosInstance.patch(`/admin/partners/${id}/${status}`),
  updatePartnerStatus: (id, status, data = {}) =>
    axiosInstance.patch(`/admin/partners/${id}/${status}`, data),

  togglePartnerActive: (id, isActive) =>
    axiosInstance.patch(`/partner/partners/${id}/toggle-active`, { isActive }),

  deletePartnerDocument: (partnerId, documentType = {}) =>
    axiosInstance.delete(`/admin/partners/${partnerId}/document/${documentType}`),

};


export default partnerApi;
