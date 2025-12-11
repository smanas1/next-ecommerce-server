"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const orderController_1 = require("../controllers/orderController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateJwt);
router.post("/create-paypal-order", orderController_1.createPaypalOrder);
router.post("/capture-paypal-order", orderController_1.capturePaypalOrder);
router.post("/create-final-order", orderController_1.createFinalOrder);
router.get("/get-single-order/:orderId", orderController_1.getOrder);
router.get("/get-order-by-user-id", orderController_1.getOrdersByUserId);
router.get("/get-all-orders-for-admin", authMiddleware_1.isSuperAdmin, orderController_1.getAllOrdersForAdmin);
router.put("/:orderId/status", authMiddleware_1.isSuperAdmin, orderController_1.updateOrderStatus);
exports.default = router;
