import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  loginService,
  forgotPasswordService,
  verifyForgotOtpService,
  resetPasswordService,
} from "./auth.service.js";

// export const login = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;
//   const data = await loginService({ email, password });

//   res
//     .cookie("accessToken",  data.accessToken,  { httpOnly: true, secure: true, sameSite: "Strict" })
//     .cookie("refreshToken", data.refreshToken, { httpOnly: true, secure: true, sameSite: "Strict" })
//     .status(200)
//     .json({ success: true, message: "Login successful", data });
// });
export const login = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  // Trim whitespace
  email = email?.trim();
  password = password?.trim();

  const result = await loginService({ email, password });

  // ── Handle error statuses returned from service ──
  if (result.status !== 200) {
    return res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", result.accessToken, cookieOptions)
    .cookie("refreshToken", result.refreshToken, cookieOptions)
    .json({
      success: true,
      message: "Logged in successfully",
      data: {
        id: result.user.id,
        role: result.user.role,
        email: result.user.email,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        subscription: result.subscription,
        freebooking: result.freebooking,
      },
    });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await forgotPasswordService(email);
  res.status(200).json({ success: true, ...result });
});

export const verifyForgotOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result = await verifyForgotOtpService({ email, otp });
  res.status(200).json({ success: true, ...result });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const result = await resetPasswordService({ email, otp, newPassword });
  res.status(200).json({ success: true, ...result });
});