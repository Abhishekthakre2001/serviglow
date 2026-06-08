"use client";

import { useState, useEffect } from "react";
import Conformatiom from "@/components/ui/Conformation";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Wrench,
} from "lucide-react";
import CalendarUI from "@/components/ui/Calender";
import serviceApi from "@/services/serviceApi";
import { useParams } from "next/navigation";
import categoryApi from "@/services/category";
import subcategoryApi from "@/services/subcategory";
import cmsApi from "@/services/cms";

export default function BookingServiceForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const params = useParams();
  const serviceId = params?.serviceId;
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const { bookService } = serviceApi;
  const [BtnLoading, BtnsetLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [bookingTerms, setBookingTerms] = useState(null);
  const [formData, setFormData] = useState({
    serviceId: "",
    serviceCategory: "",
    serviceType: "",
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    zip: "",
    notes: "",
    partnerId: "",
    partnerEmail: "",
    acceptTerms: false,
    state: "",
  });

  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const [service, setService] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState("");

  const fetchBookingTerms = async () => {
    try {
      const res = await cmsApi.getBookingTerms();

      if (res.data?.success) {
        setBookingTerms(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch booking terms", error);
    }
  };

  const update = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const [loading, setLoading] = useState(false);
  const confirmBooking = async (e) => {
    e.preventDefault();

    // Basic validation
    const requiredFields = [
      { key: "serviceCategory", label: "Service Category" },
      { key: "serviceType", label: "Service Type" },
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address" },
      { key: "state", label: "State" },
      { key: "city", label: "City" },
      { key: "zip", label: "ZIP Code" },
    ];

    const missingField = requiredFields.find(
      (field) => !String(formData[field.key] || "").trim()
    );

    if (missingField) {
      setConfirmationModal({
        open: true,
        type: "error",
        title: "Required Field Missing",
        message: `${missingField.label} is required.`,
      });
      return;
    }

    if (!formData.acceptTerms) {
      setConfirmationModal({
        open: true,
        type: "error",
        title: "Terms Required",
        message:
          "Please accept Terms and Conditions before confirming booking.",
      });
      return;
    }

    const Token = localStorage.getItem("accessToken");

    // console.log("Token", Token);

    if (Token === null) {
      setConfirmationModal({
        open: true,
        type: "error",
        title: "Login Required",
        message: "Please login to book services",
      });
      return;
    }

    try {
      setLoading(true);
      BtnsetLoading(true);

      const bookingData = {
        ...formData,
        city: `${formData.state.trim()}, ${formData.city.trim()}`
      };

      const response = await bookService(bookingData);

      console.log("Booking Success:", response);

      setConfirmationModal({
        open: true,
        type: "success",
        title: "Application Submitted!",
        message: "Submitted",
      });
      BtnsetLoading(false);
      setStep(4);
    } catch (error) {
      console.error("Booking Error:", error);

      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        // Force logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("USER");

        setConfirmationModal({
          open: true,
          type: "error",
          title: "Session Expired",
          message: "Your session has expired. Please login again.",
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);

        return;
      }

      setConfirmationModal({
        open: true,
        type: "error",
        title: "Failed",
        message: error?.response?.data?.message || "Something went wrong",
      });
    }
    finally {
      setLoading(false);
      BtnsetLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("USER");

    if (!storedUser) return;

    try {
      const user = JSON.parse(storedUser); // ✅ FIXED (no .user)

      setFormData((prev) => ({
        ...prev,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        phone: user.phone || "",
        email: user.email || "",
        address: user.addr_line1 || "",
        city: user.addr_city || "",
        state: user.addr_state || "",
        zip: user.addr_zip || "",
      }));
    } catch (error) {
      console.error("Failed to parse USER from localStorage", error);
    }
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        categoryApi.getCategories(),
        subcategoryApi.getSubcategories(),
      ]);

      // Format Categories
      const formattedCategories = catRes?.data?.data?.map((item) => ({
        id: item?.id,
        categoryName: item?.category_name,
      }));

      // Format Subcategories
      const formattedSubCategories = subRes?.data?.data?.map((item) => ({
        id: item?.id,
        subCategoryName: item?.sub_category_name,
      }));

      setCategories(formattedCategories);
      setSubCategories(formattedSubCategories);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };
  const formatDate = (d) =>
    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  useEffect(() => {
    if (service) {
      setFormData((prev) => ({
        ...prev,
        serviceId: service.id || "",
        serviceCategory: service.category?.id || "",
        serviceType: service.subCategory?.id || "",
        partnerId: service.createdBy?.id || "",
        partnerEmail: service.createdBy?.email || "",
      }));
    }
  }, [service]);

  useEffect(() => {
    setDate(new Date());
  }, []);
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);

        if (!serviceId) {
          setService(null);
          return;
        }

        const res = await serviceApi.getServiceById(serviceId);
        setService(res?.data?.data || null);
      } catch (err) {
        setService(null);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [serviceId]);
  useEffect(() => {
    fetchData();
    fetchBookingTerms();
  }, []);

  console.log("VAYRG", service);

  const isToday = (selectedDate) => {
    const today = new Date();
    return (
      selectedDate &&
      new Date(selectedDate).toDateString() === today.toDateString()
    );
  };

  const isPastSlot = (slot) => {
    const now = new Date();

    const [time, modifier] = slot.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0);

    return slotDate < now;
  };
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!/^[A-Za-z][A-Za-z\s]*$/.test(value)) {
          error = "Enter valid name";
        }
        break;

      case "phone":
        if (!/^[6-9]\d{9}$/.test(value)) {
          error = "Enter valid 10-digit phone";
        }
        break;

      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Enter valid email";
        }
        break;

      case "address":
        if (!/^[A-Za-z0-9\s,.-]{5,}$/.test(value)) {
          error = "Enter valid address";
        }
        break;

      case "city":
        if (!/^[A-Za-z][A-Za-z\s]*$/.test(value)) {
          error = "Enter valid city";
        }
        break;

      case "state":
        if (!/^[A-Za-z][A-Za-z\s]*$/.test(value)) {
          error = "Enter valid state name";
        }
        break;

      case "zip":
        if (!/^\d{5}$/.test(value)) {
          error = "Enter valid ZIP (5 digits)";
        }
        break;

      case "notes":
        if (!/^[A-Za-z0-9\s,.'-]{0,500}$/.test(value)) {
          error = "Invalid notes";
        }
        break;

      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };
  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <Conformatiom
        open={confirmationModal.open}
        type={confirmationModal.type}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onClose={() =>
          setConfirmationModal({ ...confirmationModal, open: false })
        }
      />
      <div className="max-w-4xl mx-auto px-6">
        {/* ================= HEADER ================= */}
        <div className="text-center mb-14">
          <h2 className="text-4xl font-extrabold text-gray-900">
            Book a Service
          </h2>
          <p className="mt-4 text-gray-600">
            Simple, fast & reliable booking in just a few steps
          </p>
        </div>

        {/* ================= STEPS ================= */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center w-full max-w-2xl ml-[100px]">
            {[1, 2, 3, 4].map((s, index) => (
              <div key={s} className="flex items-center flex-1">
                {/* STEP CIRCLE */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold z-10
          ${step >= s
                      ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white"
                      : "bg-gray-200 text-gray-500"
                    }`}
                >
                  {step > s ? "✓" : s}
                </div>

                {/* CONNECTOR LINE */}
                {index !== 3 && (
                  <div
                    className={`flex-1 h-[3px] mx-2 rounded-full
            ${step > s
                        ? "bg-gradient-to-r from-blue-600 to-orange-500"
                        : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ================= CARD ================= */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeUp">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Wrench className="text-blue-600" /> Select Service
              </h3>
              <select
                value={formData.serviceCategory}
                onChange={(e) => update("serviceCategory", e.target.value)}
                className="w-full p-4 border rounded-xl appearance-none"
                disabled
              >
                <option value="">Select Category</option>

                {categories.map((cat) => (
                  <option key={cat?.id} value={cat?.id}>
                    {cat?.categoryName}
                  </option>
                ))}
              </select>

              <select
                value={formData.serviceType}
                onChange={(e) => update("serviceType", e.target.value)}
                className="w-full p-4 border rounded-xl appearance-none"
                disabled
              >
                <option value="">Select Service Type</option>

                {subCategories.map((sub) => (
                  <option key={sub?.id} value={sub?.id}>
                    {sub?.subCategoryName}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold"
              >
                Continue
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-8 animate-fadeUp">
              <h3 className="text-2xl font-bold text-gray-900">
                Select Date & Time
              </h3>

              {/* GRID */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* LEFT – CALENDAR */}
                <CalendarUI
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setTime(""); // reset time when date changes
                  }}
                />

                {/* RIGHT – TIME SLOTS */}
                <div className="bg-white rounded-3xl shadow-xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4">
                    Available Time Slots
                  </h4>

                  {date ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          "09:00 AM",
                          "10:00 AM",
                          "11:00 AM",
                          "12:00 PM",
                          "02:00 PM",
                          "03:00 PM",
                          "04:00 PM",
                          "06:00 PM",
                        ].map((slot) => {
                          const disabled = isToday(date) && isPastSlot(slot);

                          return (
                            <button
                              key={slot}
                              disabled={disabled}
                              onClick={() => !disabled && setTime(slot)}
                              className={`py-3 rounded-xl border text-sm font-semibold transition
              ${disabled
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : time === slot
                                    ? "bg-gradient-to-r from-blue-600 to-orange-500 text-white border-transparent shadow-lg"
                                    : "bg-gray-50 hover:border-blue-500"
                                }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>

                      <p className="mt-4 text-sm text-gray-500">
                        Selected Date:{" "}
                        <span className="font-semibold text-gray-700">
                          {date ? formatDate(date) : ""}
                        </span>
                      </p>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-10">
                      Please select a date to view available time slots
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/2 py-3 rounded-xl border hover:bg-gray-50"
                >
                  Back
                </button>

                <button
                  disabled={!date || !time}
                  onClick={() => {
                    update("date", date ? formatDate(date) : "");
                    update("time", time);
                    setStep(3);
                  }}
                  className={`w-1/2 py-3 rounded-xl font-semibold text-white transition
          ${date && time
                      ? "bg-gradient-to-r from-blue-600 to-orange-500"
                      : "bg-gray-300 cursor-not-allowed"
                    }`}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeUp">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <User className="text-blue-600" /> Personal Details
              </h3>

              {/* Name */}
              <input
                value={formData.name}
                placeholder="Full Name"
                onChange={(e) => {
                  update("name", e.target.value);
                  validateField("name", e.target.value);
                }}
                className="w-full p-4 border rounded-xl"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}

              {/* Phone */}
              <input
                value={formData.phone}
                placeholder="Phone"
                onChange={(e) => {
                  update("phone", e.target.value);
                  validateField("phone", e.target.value);
                }}
                className="w-full p-4 border rounded-xl"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm ">{errors.phone}</p>
              )}

              {/* Email */}
              <input
                value={formData.email}
                placeholder="Email"
                onChange={(e) => {
                  update("email", e.target.value);
                  validateField("email", e.target.value);
                }}
                className="w-full p-4 border rounded-xl"
              />
              {errors.email && (
                <p className="text-red-500 text-sm ">{errors.email}</p>
              )}

              {/* Address */}
              <input
                value={formData.address}
                placeholder="Address"
                onChange={(e) => {
                  update("address", e.target.value);
                  validateField("address", e.target.value);
                }}
                className="w-full p-4 border rounded-xl"
              />
              {errors.address && (
                <p className="text-red-500 text-sm ">{errors.address}</p>
              )}

              {/* City + ZIP */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <input
                    value={formData.state}
                    placeholder="State"
                    onChange={(e) => {
                      update("state", e.target.value);
                      validateField("state", e.target.value);
                    }}
                    className="p-4 border rounded-xl w-full"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm ">{errors.state}</p>
                  )}
                </div>

                <div>
                  <input
                    value={formData.city}
                    placeholder="City"
                    onChange={(e) => {
                      update("city", e.target.value);
                      validateField("city", e.target.value);
                    }}
                    className="p-4 border rounded-xl w-full"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm ">{errors.city}</p>
                  )}
                </div>

                <div>
                  <input
                    value={formData.zip}
                    placeholder="ZIP"
                    onChange={(e) => {
                      update("zip", e.target.value);
                      validateField("zip", e.target.value);
                    }}
                    className="p-4 border rounded-xl w-full"
                  />
                  {errors.zip && (
                    <p className="text-red-500 text-sm ">{errors.zip}</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={formData.notes}
                placeholder="Additional Notes"
                onChange={(e) => {
                  update("notes", e.target.value);
                  validateField("notes", e.target.value);
                }}
                className="w-full p-4 border rounded-xl"
              />
              {errors.notes && (
                <p className="text-red-500 text-sm ">{errors.notes}</p>
              )}



              {/* Booking Terms & Conditions */}
              <div className="border rounded-xl p-4 h-48 overflow-y-auto bg-gray-50">
                <h4 className="font-semibold mb-3 text-gray-900">
                  {bookingTerms?.title || "Booking Terms & Conditions"}
                </h4>

                {bookingTerms?.content ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: bookingTerms.content,
                    }}
                  />
                ) : (
                  <p className="text-gray-500">
                    Terms & Conditions not available.
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => update("acceptTerms", e.target.checked)}
                  className=" h-4 w-4 accent-blue-600"
                />
                <span>
                  I accept the Terms & Conditions and Privacy Policy.
                </span>
              </label>

              {!formData.acceptTerms && (
                <p className="text-red-500 text-sm">
                  Please accept Terms and Conditions to continue.
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-1/2 py-3 rounded-xl border"
                >
                  Back
                </button>
                <button
                  disabled={BtnLoading || !formData.acceptTerms}
                  onClick={confirmBooking}
                  className={`w-1/2 py-3 rounded-xl text-white ${BtnLoading || !formData.acceptTerms
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-orange-500"
                    }`}
                >
                  {BtnLoading ? "Booking ..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <>
              <div className="text-center space-y-6 animate-fadeUp">
                <CheckCircle size={80} className="text-green-500 mx-auto" />
                <h3 className="text-3xl font-bold text-gray-900">
                  Booking Confirmed!
                </h3>
                <p className="text-gray-600">
                  Our team will contact you shortly.
                </p>

                <div className="rounded-2xl  bg-gradient-to-br from-blue-50 to-orange-50 p-6 shadow-md">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">
                    Booking Summary
                  </h4>

                  <div className="space-y-4 text-sm">
                    {/* <div className="flex items-center gap-3">
                    <Wrench className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-500 w-24">Service</span>
                    <span className="font-semibold text-gray-800">
                      {categories?.categoryName}
                    </span>
                  </div> */}

                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-500 w-24">Date</span>
                      <span className="font-semibold text-gray-800">
                        {formData.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-500 w-24">Time</span>
                      <span className="font-semibold text-gray-800">
                        {formData.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-500 w-24">Location</span>
                      <span className="font-semibold text-gray-800">
                        {formData.city}, {formData.zip}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/")}
                  className="px-8 py-3 mt-6 rounded-xl text-white font-semibold 
  bg-gradient-to-r from-blue-600 to-orange-500 hover:shadow-lg transition"
                >
                  Go to Home Page
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
