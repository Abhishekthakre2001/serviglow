// import axiosInstance from "./axiosInstance";

// const contactQuotationApi = {
//   // GET all contact quotations
//   getContacts: () => axiosInstance.get("/contact"),
//   // GET all  quotations
//   getQuotation: () => axiosInstance.get("/quote"),

//   getQuotationbypartnerwise: () => axiosInstance.get("/quote/partner"),

//   getQuotationbycustomerwise: () => axiosInstance.get("/quote/customer"),

//   // CREATE contact
//   createContact: (payload) => axiosInstance.post("/contact", payload),
//   // CREATE quote
//   createQuote: (payload) => axiosInstance.post("/quote", payload), 
//   updateViewingStatus: (payload) => axiosInstance.patch(`/contact/view/${payload}`), 
//   updateStatus: (payload) => axiosInstance.patch(`/quote/status/${payload}`), 
//   updateViewingStatusQuote: (payload) => axiosInstance.patch(`/quote/view/${payload}`), 
//   deleteContact: (payload) => axiosInstance.delete(`/contact/${payload}`), 
//   deleteQuote: (payload) => axiosInstance.delete(`/quote/${payload}`), 
// };

// export default contactQuotationApi;
import axiosInstance from "./axiosInstance";

const contactQuotationApi = {
  // ================= CONTACT APIs =================

  // GET all contact enquiries
  getContacts: (page = 1, limit = 5) => {
  return axiosInstance.get(`/contact?page=${page}&limit=${limit}`);
},

  // CREATE new contact enquiry
  createContact: (payload) => axiosInstance.post("/contact", payload),

  // UPDATE contact viewing status (mark as viewed/unviewed)
  // payload = contactId
  updateViewingStatus: (payload) => axiosInstance.patch(`/contact/view/${payload}`),

  // DELETE a contact enquiry
  // payload = contactId
  deleteContact: (payload) => axiosInstance.delete(`/contact/${payload}`),


  // ================= QUOTATION APIs =================

  // GET all quotations
  getQuotation: () => axiosInstance.get("/quote"),

  // GET quotations filtered by partner
getQuotationbypartnerwise: (page = 1, limit = 10) =>
  axiosInstance.get(
    `/quote/partner?page=${page}&limit=${limit}`
  ),
  // GET quotations filtered by customer
  getQuotationbycustomerwise: () => axiosInstance.get("/quote/customer"),

  // CREATE new quotation
  createQuote: (payload) => axiosInstance.post("/quote", payload),

  // UPDATE quotation status (e.g., pending → approved/rejected/viewed)
  // payload = quoteId
  updateStatus: (id,payload) => axiosInstance.patch(`/quote/status/${id}`, payload),


  // UPDATE quotation viewing status (mark quote as viewed)
  // payload = quoteId
  updateViewingStatusQuote: (payload) => axiosInstance.patch(`/quote/view/${payload}`),

  // DELETE a quotation
  // payload = quoteId
  deleteQuote: (payload) => axiosInstance.delete(`/quote/${payload}`),
};

export default contactQuotationApi;