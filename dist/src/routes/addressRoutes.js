"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const addressController_1 = require("../controllers/addressController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateJwt);
router.post("/add-address", addressController_1.createAddress);
router.get("/get-address", addressController_1.getAddresses);
router.delete("/delete-address/:id", addressController_1.deleteAddress);
router.put("/update-address/:id", addressController_1.updateAddress);
exports.default = router;
