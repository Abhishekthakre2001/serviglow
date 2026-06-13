import axiosInstance from "./axiosInstance";

const ExportApi = {
  exportPartners: (status, format = "excel") =>
    axiosInstance.get(
      `/export/partners?status=${status}&format=${format}`,
      {
        responseType: "blob",
      }
    ),

  exportMaster: (
    type,
    format = "excel"
  ) =>
    axiosInstance.get(
      `/export/master?type=${type}&format=${format}`,
      {
        responseType: "blob",
      }
    ),

  exportCustomers: (format = "excel") =>
    axiosInstance.get(
      `/export/customers?format=${format}`,
      {
        responseType: "blob",
      }
    ),

  exportContacts: (format = "excel") =>
    axiosInstance.get(
      `/export/contacts?format=${format}`,
      {
        responseType: "blob",
      }
    ),

  exportReviews: (format = "excel") =>
    axiosInstance.get(
      `/export/reviews?format=${format}`,
      {
        responseType: "blob",
      }
    ),

  exportSubscriptions: (
    status,
    format = "excel"
  ) =>
    axiosInstance.get(
      `/export/subscriptions?status=${status}&format=${format}`,
      {
        responseType: "blob",
      }
    ),

  // partner Export api
  exportServices: (format = "excel") =>
    axiosInstance.get(
      `/export/services?format=${format}`,
      {
        responseType: "blob",
      }
    ),

  exportQuotes: () =>
    axiosInstance.get(
      "/export/quotes?format=excel",
      {
        responseType: "blob",
      }
    ),

  exportRevenue: () =>
    axiosInstance.get(
      "/export/revenue?format=excel",
      {
        responseType: "blob",
      }
    ),

  exportBookings: (
    status = ""
  ) =>
    axiosInstance.get(
      `/export/bookings?format=excel${status
        ? `&status=${status}`
        : ""
      }`,
      {
        responseType: "blob",
      }
    ),

  exportReviews: () =>
    axiosInstance.get(
      "/export/reviews",
      {
        responseType: "blob",
      }
    ),
};

export default ExportApi;