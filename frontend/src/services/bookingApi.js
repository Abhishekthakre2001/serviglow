import axiosInstance from "./axiosInstance";

const bookingApi = {
  getMyBookings: () => axiosInstance.get("/service-booking/my-bookings"),

  acceptBooking: (bookingId) =>
    axiosInstance.patch(`/service-booking/partner/accept/${bookingId}`),

  rejectBooking: (bookingId) =>
    axiosInstance.patch(`/service-booking/partner/reject/${bookingId}`),

  // ✅ Customer cancel booking (create this route in backend)
  cancelBooking: (bookingId) =>
    axiosInstance.patch(`/service-booking/customer/cancel/${bookingId}`),

  // ✅ Customer reschedule booking (create this route in backend)
  rescheduleBooking: (bookingId, payload) =>
    axiosInstance.patch(`/service-booking/customer/reschedule/${bookingId}`, payload),

  // ✅ Send booking OTP
  sendBookingOtp: (payload) => axiosInstance.post(`/send-otp-any`, payload),

  completeBookingOtp: (payload) =>
    axiosInstance.post(`/Complete-booking`, payload),

  // =========================================
  // GET CUSTOMER BOOKINGS
  // =========================================
  getCustomerBookings: ({
    customerId,
    page = 1,
    limit = 10,
  }) =>
    axiosInstance.get(
      `/user/customers/booking`,
      {
        params: {
          customerId,
          page,
          limit,
        },
      }
    ),

};

export default bookingApi;