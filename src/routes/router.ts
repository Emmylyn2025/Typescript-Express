import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout, allUsers, deleteUser, updateUser, forgotpassword, resetPassword, verifyEmail } from "../controllers/userControllers";
import { auth, adminAuth } from "../middleware/authMiddleware";
import validation from "../middleware/zodValidationMiddleware";
import { registerSchema, loginSchema } from "../zod/schema";

const router = Router();

router.post('/users', validation(registerSchema), RegisterUsers);
router.get('/verify-email', verifyEmail);
router.get('/users', /*auth, adminAuth,*/ allUsers);
router.delete('/users/:id', /*auth, adminAuth,*/ deleteUser);
router.patch('/users/:id', auth, adminAuth, updateUser);
router.post('/login', validation(loginSchema), LoginUsers);
router.get('/refresh', refresh);
router.get('/logout', logout);
router.post('/forgot-password', forgotpassword);
router.patch('/reset-password/:token', resetPassword);

export default router;