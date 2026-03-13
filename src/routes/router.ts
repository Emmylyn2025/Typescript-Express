import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout, allUsers, deleteUser, updateUser, forgotpassword, resetPassword } from "../controllers/userControllers";
import { auth, adminAuth } from "../middleware/authMiddleware";

const router = Router();

router.post('/users', RegisterUsers);
router.get('/users', auth, adminAuth, allUsers);
router.delete('/users/:id', auth, adminAuth, deleteUser);
router.patch('/users/:id', auth, adminAuth, updateUser);
router.post('/login', LoginUsers);
router.get('/refresh', refresh);
router.get('/logout', logout);
router.post('/forgot-password', forgotpassword);
router.patch('/reset-password/:token', resetPassword);

export default router;