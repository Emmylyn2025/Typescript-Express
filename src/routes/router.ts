import { Router } from "express";
import { RegisterUsers, LoginUsers, refresh, logout, allUsers } from "../controllers/userControllers";

const router = Router();

router.post('/users', RegisterUsers);
router.get('/users', allUsers);
router.post('/login', LoginUsers);
router.get('/refresh', refresh);
router.get('/logout', logout);

export default router;