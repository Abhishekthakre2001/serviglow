import axiosInstance from "./axiosInstance";

const subcategoryApi = {
  getSubcategories: (params = {}) => {
    return axiosInstance.get("/master/subcategory", {
      params,
    });
  },

  createSubcategory: (formData) => {
    return axiosInstance.post(`/master/subcategory`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateSubcategory: (id, formData) => {
    return axiosInstance.put(`/master/subcategory/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteSubcategory: (id) => {
    return axiosInstance.delete(`/master/subcategory/${id}`);
  },
};

export default subcategoryApi;