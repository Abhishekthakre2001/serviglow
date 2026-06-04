import jwt from "jsonwebtoken";

export const verifyUser = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    // ✅ match the name in your .env
    req.user = jwt.verify(token, process.env.ACCESSTOKENSECRET);
    next();
  } catch {
    res.sendStatus(403);
    console.log("res",res)
  }
};