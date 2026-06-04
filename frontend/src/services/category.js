import axiosInstance from "./axiosInstance";

const categoryApi = {
  // GET all categories
  getCategories: (page = 1, limit = 5) =>
  axiosInstance.get(`/master/category?page=${page}&limit=${limit}`),


  // CREATE category
  createCategory: (formData) =>
    axiosInstance.post("/master/category", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // UPDATE category
  updateCategory: (id, formData) =>
    axiosInstance.put(`/master/category/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // DELETE category (soft delete)
  deleteCategory: (id) =>
    axiosInstance.delete(`/master/category/${id}`),
};

export default categoryApi;