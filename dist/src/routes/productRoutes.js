"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const productController_1 = require("../controllers/productController");
const router = express_1.default.Router();
router.post("/create-new-product", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, uploadMiddleware_1.upload.array("images", 5), productController_1.createProduct);
router.get("/fetch-admin-products", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, productController_1.fetchAllProductsForAdmin);
router.get("/fetch-client-products", authMiddleware_1.authenticateJwt, productController_1.getProductsForClient);
router.get("/:id", authMiddleware_1.authenticateJwt, productController_1.getProductByID);
router.put("/:id", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, productController_1.updateProduct);
router.delete("/:id", authMiddleware_1.authenticateJwt, authMiddleware_1.isSuperAdmin, productController_1.deleteProduct);
exports.default = router;
