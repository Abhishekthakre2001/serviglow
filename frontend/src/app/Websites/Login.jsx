"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Conformation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginSection() {
  const router = useRouter();
  const { login, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "error",
    title: "",
    message: "",
    onConfirm: null,
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
      };

      const response = await login(payload);
      const userData = response?.data.user;
      const Subscriptiondata = response?.data.subscription;
      const Freebookinglimit = response?.data.freebooking;
      console.log("userData", response?.data?.accessToken)

      if (userData) {
        localStorage.setItem("accessToken", response?.data?.accessToken);
        localStorage.setItem("USER", JSON.stringify(userData));
        localStorage.setItem("ROLE", userData.role);
        localStorage.setItem("IS_LOGGED_IN", "true");
        localStorage.setItem("SUBSCRIPTION", JSON.stringify(Subscriptiondata));
        localStorage.setItem("FREEBOOKINGLIMIT", Freebookinglimit);
      }

      setFormData({
        email: "",
        password: "",
        remember: false,
      });

      // ✅ Role wise redirect
      if (userData?.role === "customer") {
        const redirectUrl = localStorage.getItem("Past_booking_url");
        if (redirectUrl) {
          router.push(redirectUrl);
          localStorage.removeItem("Past_booking_url");
        } else {
          router.push("/Users/dashboard");
        }
      } else if (userData?.role === "partner") {
        router.push("/partner/dashboard");
      } else if (
        userData?.role === "admin" ||
        userData?.role === "superadmin"
      ) {
        router.push("/admin/dashboard");
      } else {
        setAlertConfig({
          open: true,
          type: "error",
          title: "Login Failed",
          message: "Unknown role received from server",
        });
      }
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid login credentials";

      setAlertConfig({
        open: true,
        type: "error",
        title: "Login Failed",
        message: apiMessage,
      });
    }
  };

  return (
    <>
      <Alert
        open={alertConfig.open}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, open: false }))}
        onConfirm={alertConfig.onConfirm}
      />

      <section className="py-8 sm:py-10 bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900">
              Login to Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-orange-500 py-4">
                Account
              </span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-1 gap-12 items-start">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full sm:w-[90%] md:w-[70%] lg:w-[32%] mx-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="p-3 sm:p-4 border border-gray-400 rounded-xl w-full text-sm sm:text-base focus:ring-2 focus:ring-blue-500"
                />

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    className="p-3 sm:p-4 border border-gray-400 rounded-xl w-full text-sm sm:text-base focus:ring-2 focus:ring-blue-500 pr-12"
                  />

                  {/* ICON BUTTON */}
                  {formData.password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 flex-wrap gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formData.remember}
                      onChange={handleChange}
                    />
                    Remember me
                  </label>

                  <Link href="/forgot-password">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 to-orange-500 text-white font-semibold shadow-lg hover:scale-105 transition"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="text-center mt-4 text-sm text-gray-600 space-y-2">
                <p>
                  Not registered as a customer?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/user_registration")}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Customer Registration
                  </button>
                </p>

                <p>
                  Want to become a partner?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/pathner_registration")}
                    className="text-orange-600 font-semibold hover:underline"
                  >
                    Partner Registration
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}