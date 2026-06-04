
import axiosInstance from "./axiosInstance";

const cmsApi = {

  getFooter: () => axiosInstance.get("/admin/footer"),
  getBanner: () => axiosInstance.get("/admin/banner"),
  getHomeSection: () => axiosInstance.get("/admin/homeSection"),

  // CREATE new contact enquiry
  upsertFooter: (payload) => axiosInstance.post("/admin/footer", payload),
  upsertHomeSection: (payload) => axiosInstance.post("/admin/homeSection", payload),
  upsertbanner: (payload) => axiosInstance.post("/admin/banner", payload),

  // Policies
  getPolicies: () => axiosInstance.get("/admin/policies"),
  getPolicy: (id) => axiosInstance.get(`/admin/policies/${id}`),
  upsertPolicy: (payload) => axiosInstance.post("/admin/policies", payload),
  deletePolicy: (id) => axiosInstance.delete(`/admin/policies/${id}`),

  // Announcement
  getAnnouncement: () => axiosInstance.get("/announcement"),
  upsertAnnouncement: (payload) =>
    axiosInstance.post("/announcement/upsert", payload),

  // paypal plans
  getPlanDetails: () =>
    axiosInstance.get("/payment/plan-details"),

  updatePlan: (planKey, payload) =>
    axiosInstance.post(`/payment/plans-update/${planKey}`, payload),

};

export default cmsApi;