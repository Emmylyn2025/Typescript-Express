import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout, allUsers, deleteUser, updateUser, forgotpassword, resetPassword, verifyEmail, googleAuthStart, getAuthCallBackHandler } from "../controllers/userControllers";
import { addProduct, getProducts, getProductById, deleteProduct, updateProduct } from "../controllers/productController";
import { auth, adminAuth } from "../middleware/authMiddleware";
import validation from "../middleware/zodValidationMiddleware";
import { registerSchema, loginSchema, forgotSchema, productSchema, updateSchema } from "../zod/schema";
import { upload } from "../multer/multer";
import { addToCart, getUserCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cartController";
import { createOrder, viewOrders, deleteOrder } from "../controllers/orderController";
import { rateLimiter } from "../rate-limit/rateLimit";

const router = Router();

//User routes
router.post('/users', rateLimiter, validation(registerSchema), RegisterUsers);
router.get('/verify-email', rateLimiter, verifyEmail);
router.get('/users', auth, adminAuth, rateLimiter, allUsers);
router.delete('/users/:id', auth, adminAuth, rateLimiter, deleteUser);
router.patch('/users/:id', auth, adminAuth, rateLimiter, updateUser);
router.post('/login', rateLimiter, validation(loginSchema), LoginUsers);
router.get('/refresh', rateLimiter, refresh);
router.get('/logout', rateLimiter, logout);
router.post('/forgot-password', rateLimiter, validation(forgotSchema), forgotpassword);
router.patch('/reset-password', rateLimiter, resetPassword);
router.get('/google', rateLimiter, googleAuthStart);
router.get('/google/callback', rateLimiter, getAuthCallBackHandler);


//Products routes
router.post('/products', auth, adminAuth, upload.single('image'), validation(productSchema), addProduct);
router.get('/products', auth, rateLimiter, getProducts);
router.get('/products/:id', auth, rateLimiter, getProductById);
router.delete('/products/:id', auth, adminAuth, rateLimiter, deleteProduct);
router.patch('/products/:id', auth, adminAuth, rateLimiter, upload.single('image'), validation(updateSchema), updateProduct);


//Cart routes
router.post('/cart', auth, rateLimiter, addToCart);
router.get('/cart', auth, rateLimiter, getUserCart);
router.put('/cart/:itemId', auth, rateLimiter, updateCartItem);
router.delete('/cart/:itemId', auth, rateLimiter, removeFromCart);
router.get('/cart/clear', auth, rateLimiter, clearCart);


//Order routes
router.get('/order', auth, rateLimiter, createOrder);
router.get('/order/view', auth, rateLimiter, viewOrders);
router.delete('/order/:id', auth, rateLimiter, deleteOrder);

export default router;