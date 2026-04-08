"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userControllers_1 = require("../controllers/userControllers");
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const zodValidationMiddleware_1 = __importDefault(require("../middleware/zodValidationMiddleware"));
const schema_1 = require("../zod/schema");
const multer_1 = require("../multer/multer");
const cartController_1 = require("../controllers/cartController");
const orderController_1 = require("../controllers/orderController");
const rateLimit_1 = require("../rate-limit/rateLimit");
const router = (0, express_1.Router)();
//User routes
router.post('/users', rateLimit_1.rateLimiter, (0, zodValidationMiddleware_1.default)(schema_1.registerSchema), userControllers_1.RegisterUsers);
router.get('/verify-email', rateLimit_1.rateLimiter, userControllers_1.verifyEmail);
router.get('/users', authMiddleware_1.auth, authMiddleware_1.adminAuth, rateLimit_1.rateLimiter, userControllers_1.allUsers);
router.delete('/users/:id', authMiddleware_1.auth, authMiddleware_1.adminAuth, rateLimit_1.rateLimiter, userControllers_1.deleteUser);
router.patch('/users/:id', authMiddleware_1.auth, authMiddleware_1.adminAuth, rateLimit_1.rateLimiter, userControllers_1.updateUser);
router.post('/login', rateLimit_1.rateLimiter, (0, zodValidationMiddleware_1.default)(schema_1.loginSchema), userControllers_1.LoginUsers);
router.get('/refresh', rateLimit_1.rateLimiter, userControllers_1.refresh);
router.get('/logout', rateLimit_1.rateLimiter, userControllers_1.logout);
router.post('/forgot-password', rateLimit_1.rateLimiter, (0, zodValidationMiddleware_1.default)(schema_1.forgotSchema), userControllers_1.forgotpassword);
router.patch('/reset-password', rateLimit_1.rateLimiter, userControllers_1.resetPassword);
router.get('/google', rateLimit_1.rateLimiter, userControllers_1.googleAuthStart);
router.get('/google/callback', rateLimit_1.rateLimiter, userControllers_1.getAuthCallBackHandler);
//Products routes
router.post('/products', authMiddleware_1.auth, authMiddleware_1.adminAuth, multer_1.upload.single('image'), (0, zodValidationMiddleware_1.default)(schema_1.productSchema), productController_1.addProduct);
router.get('/products', authMiddleware_1.auth, rateLimit_1.rateLimiter, productController_1.getProducts);
router.get('/products/:id', authMiddleware_1.auth, rateLimit_1.rateLimiter, productController_1.getProductById);
router.delete('/products/:id', authMiddleware_1.auth, authMiddleware_1.adminAuth, rateLimit_1.rateLimiter, productController_1.deleteProduct);
router.patch('/products/:id', authMiddleware_1.auth, authMiddleware_1.adminAuth, rateLimit_1.rateLimiter, multer_1.upload.single('image'), (0, zodValidationMiddleware_1.default)(schema_1.updateSchema), productController_1.updateProduct);
//Cart routes
router.post('/cart', authMiddleware_1.auth, rateLimit_1.rateLimiter, cartController_1.addToCart);
router.get('/cart', authMiddleware_1.auth, rateLimit_1.rateLimiter, cartController_1.getUserCart);
router.put('/cart/:itemId', authMiddleware_1.auth, rateLimit_1.rateLimiter, cartController_1.updateCartItem);
router.delete('/cart/:itemId', authMiddleware_1.auth, rateLimit_1.rateLimiter, cartController_1.removeFromCart);
router.get('/cart/clear', authMiddleware_1.auth, rateLimit_1.rateLimiter, cartController_1.clearCart);
//Order routes
router.get('/order', authMiddleware_1.auth, rateLimit_1.rateLimiter, orderController_1.createOrder);
router.get('/order/view', authMiddleware_1.auth, rateLimit_1.rateLimiter, orderController_1.viewOrders);
router.delete('/order/:id', authMiddleware_1.auth, rateLimit_1.rateLimiter, orderController_1.deleteOrder);
exports.default = router;
