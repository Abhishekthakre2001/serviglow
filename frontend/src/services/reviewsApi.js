import axiosInstance from "./axiosInstance";

const reviewsApi = {
  addReviews: (payload) => axiosInstance.post("/reviews", payload),
  // Admin
  getAllReviews: (page, limit) => {
    const res = axiosInstance.get(`/reviews/admin?page=${page}&limit=${limit}`);
    return res;
  },
  toggleReview: (id) => axiosInstance.patch(`/reviews/admin/${id}/toggle`),
  deleteReview: (id) => axiosInstance.delete(`/reviews/admin/${id}`),
  updateReview: (id, payload) => axiosInstance.patch(`/reviews/admin/${id}`, payload),

  // Partner
  getPartnerReviews: (page = 1, limit = 10) =>
    axiosInstance.get(`/reviews/partner?page=${page}&limit=${limit}`),
  getServiceReviews: (id) => axiosInstance.get(`/reviews/service/${id}`),

  // Approved reviews for customers
  getApprovedReviews: () => axiosInstance.get("/reviews/approved"),
};

export default reviewsApi;
