import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout } from "../controllers/userControllers";

const router = Router();

router.post('/users', RegisterUsers);
router.post('/login', LoginUsers);
router.get('/refresh', refresh);
router.get('/logout', logout);

export default router;