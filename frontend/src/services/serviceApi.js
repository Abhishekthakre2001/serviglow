import axiosInstance from "./axiosInstance";

const serviceApi = {
  // ✅ GET used service categories
 getUsedCategories: (zipCode = "") =>
  axiosInstance.get(`/service/used-categories?zipCode=${zipCode}`),

  // ✅ Get used subcategories by category
  getUsedSubCategories: (categoryId, zip) => {
    return axiosInstance.get(`/service/used-subcategories/${categoryId}?zipCode=${zip}`);
  },

  // ✅ Partners list by subCategoryId
  getPartnersBySubCategory: (subCategoryId) =>
    axiosInstance.get(`/service/partners-by-subcategory/${subCategoryId}`),

  // Get all services
  getServices: () => {
    return axiosInstance.get(`/service`);
  },

  // Get single service by ID (for edit page)
  getServiceById: (id) => {
    return axiosInstance.get(`/service/${id}`);
  },
  getPartnerServices: () => {
    return axiosInstance.get(`/service/my-services`);
  },

  // Get service by slug (public page)
  getServiceBySlug: (slug) => {
    return axiosInstance.get(`/service/slug/${slug}`);
  },

  // Create service
  createService: (formData) => {
    return axiosInstance.post(`/service`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Update service
  updateService: (id, formData) => {
    return axiosInstance.put(`/service/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Delete service
  deleteService: (id) => {
    return axiosInstance.delete(`/service/${id}`);
  },
  toggleServiceStatus: (id) => {
    return axiosInstance.patch(`/service/toggle-status/${id}`);
  },

  // Admin review
  reviewService: (id, status) => {
    return axiosInstance.patch(`/service/review/${id}`, { status });
  },

 getPartnerServices: (page=1, limit=5) =>
  axiosInstance.get(`/service/my?page=${page}&limit=${limit}`),

  // Book Service
  bookService: (formData) => {
    return axiosInstance.post("/service-booking", formData);
  },
  // getAll Booking Services
  getBookedServices: () => {
    return axiosInstance.get(`/service-booking/admin`);
  },
 getAvailablePartnerServices: ({ categoryId, subCategoryId, pincode }) => {
  return axiosInstance.get(`/service/services/available-services`, {
    params: {
      categoryId,
      subCategoryId,
      pincode
    },
  });
},
};

export default serviceApi;
