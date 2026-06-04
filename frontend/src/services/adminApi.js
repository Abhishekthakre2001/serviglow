import axiosInstance from "./axiosInstance";

const adminApi = {
    // =========================
    // ADMIN LIST
    // =========================
    getAdmins: () =>
        axiosInstance.get("/admin/admins"),

    // =========================
    // CREATE ADMIN
    // =========================
    createAdmin: (data) =>
        axiosInstance.post("/admin/register", data),

    // =========================
    // UPDATE ADMIN
    // =========================
    updateAdmin: (id, data) =>
        axiosInstance.put(`/admin/admins/${id}`, data),

    // =========================
    // DELETE ADMIN
    // =========================
    deleteAdmin: (id) =>
        axiosInstance.delete(`/admin/admins/${id}`),

    // =========================
    // UPDATE STATUS
    // =========================
    updateStatus: (id, status) =>
        axiosInstance.patch(`/admin/admins/${id}/status`, {
            status,
        }),

    // =========================
    // UPDATE PERMISSIONS
    // =========================
    updatePermissions: (id, permissions) =>
        axiosInstance.patch(`/admin/admins/${id}/permissions`, {
            permissions,
        }),

    // =========================
    // GET SINGLE ADMIN PERMISSIONS
    // =========================
    getAdminPermissions: (id) =>
        axiosInstance.get(`/admin/admins/${id}/permissions`),

  

};

export default adminApi;