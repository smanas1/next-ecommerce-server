"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const settingsController_1 = require("../controllers/settingsController");
const router = express_1.default.Router();
router.post("/banners", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, uploadMiddleware_1.upload.array("images", 5), settingsController_1.addFeatureBanners);
router.get("/get-banners", authMiddleware_1.authenticateJwt, settingsController_1.fetchFeatureBanners);
router.post("/update-feature-products", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, settingsController_1.updateFeaturedProducts);
router.get("/fetch-feature-products", authMiddleware_1.authenticateJwt, settingsController_1.getFeaturedProducts);
exports.default = router;
