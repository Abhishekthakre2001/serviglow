import axiosInstance from "./axiosInstance";

const userApi = {

    // =========================================
    // GET ALL CUSTOMERS
    // =========================================
    getAllCustomer: (page = 1, limit = 5) =>
        axiosInstance.get(
            `/user/customers?page=${page}&limit=${limit}`
        ),

    // =========================================
    // DELETE CUSTOMER
    // =========================================
    deleteCustomer: (id) =>
        axiosInstance.delete(
            `/user/customers/${id}`
        ),

    // =========================================
    // TOGGLE CUSTOMER STATUS
    // =========================================
    toggleCustomerStatus: (id) =>
        axiosInstance.patch(
            `/user/customers/${id}/status`
        ),

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

export default userApi;