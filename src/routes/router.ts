import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout, allUsers, deleteUser, updateUser, forgotpassword, resetPassword } from "../controllers/userControllers";

const router = Router();

router.post('/users', RegisterUsers);
router.get('/users', allUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id', updateUser)
router.post('/login', LoginUsers);
router.get('/refresh', refresh);
router.get('/logout', logout);
router.post('/forgot-password', forgotpassword);
router.patch('/reset-password/:token', resetPassword);

export default router;