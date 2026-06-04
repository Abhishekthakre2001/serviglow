"use client";

import { useEffect, useState } from "react";
import { User, MapPin, Lock, AlertCircle } from "lucide-react";
import InputField from "@/components/ui/InputField";
import { useAuth } from "@/hooks/useAuth";
import Alert from "@/components/ui/Conformation";
import { useRouter } from "next/navigation";

export default function UserRegistration() {

  const OTP_EXPIRE_TIME = Number(process.env.NEXT_PUBLIC_OTP_EXPIRE_TIME);

  const router = useRouter();
  const { registerUser, loading, sendOtp, verifyOtp, error } = useAuth();
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [formResetKey, setFormResetKey] = useState(0);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [verifyingOtp, setVefifyingOtp] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "warning",
    title: "",
    message: "",
  });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    contact: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    password: "",
    confirm_password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    if (name === "email") {
      setOtp("");
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCountdown(0);
      setCanResendOtp(false);
      setOtpCountdown(OTP_EXPIRE_TIME);
    }
  };

  const handleSubmit = async () => {
    setSubmitAttempted(true);

    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.contact ||
      !form.password ||
      !form.confirm_password ||
      !form.address1 ||
      !form.city ||
      !form.state ||
      !form.zip
    ) {
      return;
    }
    if (!otpVerified) {
      setAlertConfig({
        open: true,
        type: "error",
        title: "Error",
        message: "Please Verify Email First",
      });
      return;
    }
    if (form.password !== form.confirm_password) {
      return;
    }

    // Address validation
    const addressRegex = /^[A-Za-z0-9\s,./#()-]+$/;

    if (!addressRegex.test(form.address1)) {
      return setAlertConfig({
        open: true,
        type: "error",
        title: "Invalid Address",
        message: "Address Line 1 contains invalid characters",
      });
    }

    if (form.address2 && !addressRegex.test(form.address2)) {
      return setAlertConfig({
        open: true,
        type: "error",
        title: "Invalid Address",
        message: "Address Line 2 contains invalid characters",
      });
    }

    try {
      const payload = {
        firstName: form.first_name,
        lastName: form.last_name,
        email: form.email,
        phone: form.contact,
        password: form.password,
        address: {
          line1: form.address1,
          line2: form.address2,
          city: form.city,
          state: form.state,
          zip: form.zip,
        },
      };

      const data = await registerUser(payload);

      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
      }

      if (data?.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }

      setAlertConfig({
        open: true,
        type: "success",
        title: "Success",
        message: "User registered successfully",
      });

      setOtp('');
      setOtpSent(false);

      setForm({
        first_name: "",
        last_name: "",
        contact: "",
        email: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zip: "",
        password: "",
        confirm_password: "",
      });
      setOtpVerified(false)

      setSubmitAttempted(false);

      setFormResetKey((prev) => prev + 1);

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      let errorMessage = "Failed to register user";

      // 🔥 Case 1: Proper JSON response
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      // 🔥 Case 2: HTML response (like your current error)
      else if (typeof err?.response?.data === "string") {
        if (err.response.data.toLowerCase().includes("already exists")) {
          errorMessage = "Email already exists. Please use another email.";
        }
      }

      // 🔥 Case 3: Fallback from error object
      else if (err?.message?.toLowerCase().includes("already exists")) {
        errorMessage = "Email already exists. Please use another email.";
      }

      setAlertConfig({
        open: true,
        type: "error",
        title: "Error",
        message: errorMessage,
      });
    }
  };
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOtp = async () => {
    try {
      if (!validateEmail(form.email)) return;

      setLoadingOtp(true);

      await sendOtp({ email: form.email, type: "register" });

      setOtpSent(true);
      setOtpVerified(false);
      setOtp("");
      setOtpCountdown(OTP_EXPIRE_TIME);
      setCanResendOtp(false);

      setAlertConfig({
        open: true,
        type: "success",
        title: "OTP Sent",
        message: "OTP sent successfully. Please check your email.",
      });
    } catch (error) {
      setAlertConfig({
        open: true,
        type: "error",
        title: "Failed",
        message: error?.message || "Something went wrong",
      });
    } finally {
      setLoadingOtp(false);
    }
  };

  // const handleVerifyOtp = async () => {
  //   try {
  //     setVefifyingOtp(true);

  //     await verifyOtp({
  //       email: form.email,
  //       otp,
  //     });

  //     setOtpVerified(true);
  //     setAlertConfig({
  //       open: true,
  //       type: "success",
  //       title: "Email verified",
  //       message: "Email verified successfully",
  //     });
  //     setVefifyingOtp(true);
  //   } catch (error) {
  //     setOtpVerified(false);
  //     setAlertConfig({
  //       open: true,
  //       type: "error",
  //       title: "Failed ",
  //       message: error?.message || "Something went wrong",
  //     });
  //   } finally {
  //     setVefifyingOtp(false);
  //   }
  // };

  const handleVerifyOtp = async () => {
    if (otpCountdown === 0) {
      return setAlertConfig({
        open: true,
        type: "error",
        title: "Expired",
        message: "OTP expired. Please resend OTP.",
      });
    }

    try {
      setVefifyingOtp(true);

      await verifyOtp({
        email: form.email,
        otp,
      });

      setOtpVerified(true);

      setAlertConfig({
        open: true,
        type: "success",
        title: "Email verified",
        message: "Email verified successfully",
      });

    } catch (error) {
      setOtpVerified(false);
      setAlertConfig({
        open: true,
        type: "error",
        title: "Failed",
        message: error?.message || "Something went wrong",
      });
    } finally {
      setVefifyingOtp(false);
    }
  };


  useEffect(() => {
    let timer;

    if (otpSent && !otpVerified && otpCountdown > 0) {
      timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }

    if (otpSent && !otpVerified && otpCountdown === 0) {
      setCanResendOtp(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpSent, otpVerified, otpCountdown]);


  return (
    <>
      <Alert
        open={alertConfig.open}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, open: false }))}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-800">
              Create Your Account
            </h1>
            <p className="text-slate-500">
              Fill in your details to get started
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-10">
            {/* PERSONAL DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <User size={18} /> Personal Details
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  required
                  minLength={2}
                  pattern={/^[A-Za-z\s]+$/}
                  submitAttempted={submitAttempted}
                  key={`first_name-${formResetKey}`}
                />

                <InputField
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  minLength={2}
                  onChange={handleChange}
                  required
                  pattern={/^[A-Za-z\s]+$/}
                  submitAttempted={submitAttempted}
                  key={`last_name-${formResetKey}`}
                />

                <InputField
                  key={`contact-${formResetKey}`}
                  label="Contact Number"
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  required
                  const phoneRegex={/^(?:[6-9]\d{9}|(?:\+1\s?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4})$/}
                  submitAttempted={submitAttempted}
                />

                {/* <InputField
                  key={`email-${formResetKey}`}
                  label="Email Address"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                  submitAttempted={submitAttempted}
                /> */}

                <div className="md:col-span-2 flex flex-col gap-2">

                  {/* EMAIL FIELD + ERROR */}
                  <div className="flex flex-col gap-1">
                    <InputField
                      label="Email Address"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      disabled={otpVerified}
                      submitAttempted={submitAttempted}
                      key={`email-${formResetKey}`}
                    />

                    {form.email && !validateEmail(form.email) && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle size={14} /> Please enter a valid email address
                      </p>
                    )}

                    {/* VERIFIED MESSAGE */}
                    {otpVerified && (
                      <p className="text-green-600 text-sm">
                        Email verified successfully
                      </p>
                    )}
                  </div>

                  {/* SEND OTP BUTTON */}
                  {form.email && validateEmail(form.email) && !otpVerified && !otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loadingOtp}
                      className="text-nowrap bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                      {loadingOtp ? "Sending..." : "Send OTP"}
                    </button>
                  )}

                  {otpSent && !otpVerified && !canResendOtp && (
                    <span className="text-sm text-orange-600 font-medium">
                      OTP expires in {formatTime(otpCountdown)}
                    </span>
                  )}

                  {otpSent && !otpVerified && canResendOtp && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loadingOtp}
                      className="text-nowrap bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                      {loadingOtp ? "Sending..." : "Resend OTP"}
                    </button>
                  )}

                  {/* OTP INPUT + VERIFY (ALWAYS VISIBLE UNTIL VERIFIED) */}
                  {!otpVerified && (
                    <div className="flex flex-row gap-3">
                      <InputField
                        label="Enter OTP"
                        name="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6 digit OTP"
                        required
                      />

                      <div>
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || !otp || !otpSent || otpCountdown === 0}
                          className="text-nowrap mt-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:bg-gray-400"
                        >
                          {verifyingOtp ? "Verifying..." : "Verify OTP"}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* ADDRESS DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <MapPin size={18} /> Address Details
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  key={`address1-${formResetKey}`}
                  label="Address Line 1"
                  name="address1"
                  minLength={2}
                  value={form.address1}
                  onChange={handleChange}
                  required
                  pattern={/^[A-Za-z0-9\s,./#()-]+$/}
                  submitAttempted={submitAttempted}
                />
                <InputField
                  key={`address2-${formResetKey}`}
                  label="Address Line 2"
                  name="address2"
                  value={form.address2}
                  onChange={handleChange}
                  pattern={/^[A-Za-z0-9\s,./#()-]+$/}
                  submitAttempted={submitAttempted}
                />
                <InputField
                  key={`city-${formResetKey}`}
                  label="City"
                  name="city"
                  minLength={2}
                  value={form.city}
                  onChange={handleChange}
                  pattern={/^[A-Za-z\s]+$/}
                  required
                  submitAttempted={submitAttempted}
                />
                <InputField
                  key={`state-${formResetKey}`}
                  label="State"
                  name="state"
                  minLength={2}
                  value={form.state}
                  onChange={handleChange}
                  pattern={/^[A-Za-z\s]+$/}
                  required
                  submitAttempted={submitAttempted}
                />
                <InputField
                  key={`zip-${formResetKey}`}
                  label="ZIP Code"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  required
                  pattern={/^[0-9]{5,6}$/}
                  submitAttempted={submitAttempted}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-700">
                <Lock size={18} /> Login Credentials
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <InputField
                  key={`password-${formResetKey}`}
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  validator={(value) => {
                    if (!/[A-Z]/.test(value))
                      return "Must contain at least one uppercase letter";
                    if (!/[0-9]/.test(value))
                      return "Must contain at least one number";
                    return "";
                  }}
                  submitAttempted={submitAttempted}
                />

                <InputField
                  key={`confirm_password-${formResetKey}`}
                  label="Confirm Password"
                  name="confirm_password"
                  type="password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                  validator={(value) =>
                    value !== form.password ? "Passwords do not match" : ""
                  }
                  submitAttempted={submitAttempted}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-10 py-3 rounded-xl font-semibold text-white transition
                  ${loading
                    ? "bg-gray-400"
                    : "bg-gradient-to-r from-blue-600 to-orange-500 hover:shadow-lg"
                  }`}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
