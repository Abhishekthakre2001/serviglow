import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const hashPassword = (password) => bcrypt.hash(password, 10);

export const comparePassword = (password, hash) =>
  bcrypt.compare(password, hash);

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.ACCESSTOKENSECRET,
    { expiresIn: process.env.ACCESSTOKENEXPIRY }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESHTOKENSECRET,
    { expiresIn: process.env.REFRESHTOKEN_EXPIRY }
  );
};