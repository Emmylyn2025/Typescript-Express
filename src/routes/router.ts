import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout, allUsers, deleteUser, updateUser, forgotpassword, resetPassword, verifyEmail, googleAuthStart, getAuthCallBackHandler } from "../controllers/userControllers";
import { addProduct, getProducts, getProductById, deleteProduct, updateProduct } from "../controllers/productController";
import { auth, adminAuth } from "../middleware/authMiddleware";
import validation from "../middleware/zodValidationMiddleware";
import { registerSchema, loginSchema, forgotSchema } from "../zod/schema";
import { upload } from "../multer/multer";

const router = Router();

router.post('/users', validation(registerSchema), RegisterUsers);
router.get('/verify-email', verifyEmail);
router.get('/users', /*auth, adminAuth,*/ allUsers);
router.delete('/users/:id', /*auth, adminAuth,*/ deleteUser);
router.patch('/users/:id', auth, /* adminAuth, */ updateUser);
router.post('/login', validation(loginSchema), LoginUsers);
router.get('/refresh', refresh);
router.get('/logout', logout);
router.post('/forgot-password', validation(forgotSchema), forgotpassword);
router.patch('/reset-password', resetPassword);
router.get('/google', googleAuthStart);
router.get('/google/callback', getAuthCallBackHandler);




router.post('/products', auth, adminAuth, upload.single('image'), addProduct);
router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.delete('/products/:id', deleteProduct);
router.patch('/products/:id', updateProduct);

export default router;