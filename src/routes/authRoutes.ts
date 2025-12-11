import express from "express";
import {
  login,
  logout,
  refreshAccessToken,
  register,
  updateProfile,
  getProfile,
} from "../controllers/authController";
import { authenticateJwt } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

// Protected routes
router.get("/profile", authenticateJwt, getProfile);
router.put("/profile", authenticateJwt, updateProfile);

export default router;
