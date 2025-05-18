import { Router } from 'express';
import { login } from '../controllers/AuthController.js';

const router = Router();

// Ruta de login única para ambos roles
router.post('/login', login);

export default router;