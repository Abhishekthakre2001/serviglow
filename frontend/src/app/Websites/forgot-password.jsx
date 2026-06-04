"use client";

import { useState, useEffect } from "react";
import authApi from "@/services/authApi";
import Alert from "@/components/ui/Conformation";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword, forgotverifyOtp, resetPassword } = authApi;
  const OTP_EXPIRE_TIME = Number(process.env.NEXT_PUBLIC_OTP_EXPIRE_TIME) ;

  const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ timer states
  const [resendTimer, setResendTimer] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });

  const showAlert = (type, title, message) => {
    setAlertConfig({
      open: true,
      type,
      title,
      message,
    });
  };

  // ✅ countdown effect
  useEffect(() => {
    let interval;

    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleSendOtp = async () => {
    try {
      setLoading(true);

      const res = await forgotPassword({ email });

      setStep(2);
      setResendTimer(OTP_EXPIRE_TIME); // ✅ start timer
      showAlert("success", "OTP Sent", res?.message || "OTP sent successfully");
    } catch (err) {
      showAlert(
        "error",
        "Error",
        err?.response?.data?.message || "Failed to send OTP",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ resend otp
  const handleResendOtp = async () => {
    try {
      setResendLoading(true);

      const res = await forgotPassword({ email });

      setResendTimer(OTP_EXPIRE_TIME); // ✅ restart timer
      showAlert("success", "OTP Resent", res?.message || "OTP resent successfully");
    } catch (err) {
      showAlert(
        "error",
        "Error",
        err?.response?.data?.message || "Failed to resend OTP",
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);

      const res = await forgotverifyOtp({ email, otp });

      setStep(3);
      showAlert(
        "success",
        "Verified",
        res?.message || "OTP verified successfully",
      );
    } catch (err) {
      showAlert(
        "error",
        "Invalid OTP",
        err?.response?.data?.message || "OTP verification failed",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);

      const res = await resetPassword({ email, otp, newPassword: password });

      showAlert(
        "success",
        "Success",
        res?.message || "Password reset successfully",
      );

      setStep(1);
      setEmail("");
      setOtp("");
      setPassword("");
      setResendTimer(0);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      showAlert(
        "error",
        "Error",
        err?.response?.data?.message || "Reset failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transition-all">
        <h2 className="text-2xl font-bold text-center mb-2">Forgot Password</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Follow steps to reset your password
        </p>

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={handleSendOtp}
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-gray-500 mb-2">
              OTP sent to <span className="font-semibold">{email}</span>
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full border p-3 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={handleVerifyOtp}
              disabled={loading || !otp}
              className="w-full bg-green-600 hover:bg-green-700 transition text-white p-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            {/* ✅ Timer + Resend button */}
            <div className="mt-4 text-center">
              {resendTimer > 0 ? (
                <p className="text-sm text-red-500">
                  Resend OTP in <span className="font-semibold">{formatTime(resendTimer)}</span>
                </p>
              ) : (
                <button
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {resendLoading ? "Resending..." : "Resend OTP"}
                </button>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-gray-500 mb-2">
              Reset password for <span className="font-semibold">{email}</span>
            </p>

            <input
              type="password"
              placeholder="Enter new password"
              className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleResetPassword}
              disabled={loading || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white p-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
      </div>

      <Alert
        open={alertConfig.open}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig((prev) => ({ ...prev, open: false }))}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}