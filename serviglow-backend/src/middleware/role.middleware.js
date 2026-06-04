// export const authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.sendStatus(403);
//     }
//     next();
//   };
// };

export const authorizeRoles = (...allowedRoles) => {

  return (req, res, next) => {
    console.log("User Role", req.user.role)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};
