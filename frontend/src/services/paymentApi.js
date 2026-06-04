import axiosInstance from "./axiosInstance";

const paymentApi = {
  createSubscription: (payload) =>
    axiosInstance.post("/payment/create-subscription", payload),

  getSubscriptions: (page = 1, limit = 10) =>
    axiosInstance.get(`/payment?page=${page}&limit=${limit}`),

  // GET /api/v1/payment?status=ACTIVE|PENDING|EXPIRED|CANCELLED
  getSubscriptionsByStatus: (status, page = 1, limit = 10) =>
    axiosInstance.get(
      `/payment?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`
    ),

  cancelSubscription: (subscriptionId) =>
    axiosInstance.post(`/payment/subscription/${subscriptionId}/cancel`),

  getMySubscription: () =>
    axiosInstance.get("/payment/mysubscription"),
};

export default paymentApi;