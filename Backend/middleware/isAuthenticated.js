import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";

const isAuthenticated = catchAsync(async (req, res, next) => {
  let token;

  // Retrieve token from cookies or Authorization header
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError(
        "You are not logged in. Please log in to access this resource.",
        401
      )
    );
  }

  // Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(
      new AppError("Invalid or expired token. Please log in again.", 401)
    );
  }

  // Confirm user still exists
  const currentUser = await User.findById(decoded.id); // token payload uses { id: user._id }
  if (!currentUser) {
    return next(
      new AppError("User linked to this token no longer exists.", 401)
    );
  }

  // Attach user info to request
  req.user = {
    id: currentUser.id,
    name: currentUser.username,
  };

  next();
});

export default isAuthenticated;
