
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

  getBookingTerms: () =>
    axiosInstance.get("/admin/booking-terms"),

  upsertBookingTerms: (data) =>
    axiosInstance.post("/admin/booking-terms", data),

  // Get all pages
  getPages: () => axiosInstance.get("/admin/pages"),

  // Get single page by ID
  getPageById: (id) => axiosInstance.get(`/admin/pages/${id}`),

  // Create page
  createPage: (payload) =>
    axiosInstance.post("/admin/createpage", payload),

  // Update page
  updatePage: (id, payload) =>
    axiosInstance.put(`/admin/pages/${id}`, payload),

  // Delete page
  deletePage: (id) =>
    axiosInstance.delete(`/admin/pages/${id}`),

   getPageBySlug: (slug) =>
    axiosInstance.get(`/admin/pages/${slug}`),

};

export default cmsApi;