import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout, allUsers, deleteUser, updateUser, forgotpassword, resetPassword, verifyEmail, googleAuthStart, getAuthCallBackHandler } from "../controllers/userControllers";
import { addProduct, getProducts, getProductById, deleteProduct, updateProduct } from "../controllers/productController";
import { auth, adminAuth } from "../middleware/authMiddleware";
import validation from "../middleware/zodValidationMiddleware";
import { registerSchema, loginSchema, forgotSchema, productSchema, updateSchema } from "../zod/schema";
import { upload } from "../multer/multer";
import { addToCart, getUserCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cartController";
import { createOrder, viewOrders, deleteOrder } from "../controllers/orderController";

const router = Router();

//User routes
router.post('/users', validation(registerSchema), RegisterUsers);
router.get('/verify-email', verifyEmail);
router.get('/users', auth, adminAuth, allUsers);
router.delete('/users/:id', auth, adminAuth, deleteUser);
router.patch('/users/:id', auth, adminAuth, updateUser);
router.post('/login', validation(loginSchema), LoginUsers);
router.get('/refresh', refresh);
router.get('/logout', logout);
router.post('/forgot-password', validation(forgotSchema), forgotpassword);
router.patch('/reset-password', resetPassword);
router.get('/google', googleAuthStart);
router.get('/google/callback', getAuthCallBackHandler);


//Products routes
router.post('/products', auth, adminAuth, upload.single('image'), validation(productSchema), addProduct);
router.get('/products', auth, getProducts);
router.get('/products/:id', auth, getProductById);
router.delete('/products/:id', auth, adminAuth, deleteProduct);
router.patch('/products/:id', auth, adminAuth, upload.single('image'), validation(updateSchema), updateProduct);


//Cart routes
router.post('/cart', auth, addToCart);
router.get('/cart', auth, getUserCart);
router.put('/cart/:itemId', auth, updateCartItem);
router.delete('/cart/:itemId', auth, removeFromCart);
router.get('/cart/clear', auth, clearCart);


//Order routes
router.get('/order', auth, createOrder);
router.get('/order/view', auth, viewOrders);
router.delete('/order/:id', auth, deleteOrder);

export default router;