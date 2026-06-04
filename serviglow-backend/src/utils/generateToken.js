import jwt from "jsonwebtoken";
import { UserModel } from "../modules/auth/auth.model.js";

export const generateAccessRefreshToken = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const accessToken = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.ACCESSTOKENSECRET,
    { expiresIn: process.env.ACCESSTOKENEXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESHTOKENSECRET,
    { expiresIn: process.env.REFRESHTOKEN_EXPIRY }
  );

  await UserModel.updateRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
};