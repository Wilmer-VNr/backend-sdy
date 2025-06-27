import { Router } from 'express';
import { login, recuperarPassword, comprobarTokenPassword, crearNuevoPassword } from '../controllers/AuthController.js';
import { validacionEmail, validarNuevoPassword } from '../middlewares/validacionPassword.js';
const router = Router();

// Ruta de login única para ambos roles
router.post('/login', login);

// Rutas de recuperación de contraseña unificadas
router.post('/recuperar-password',validacionEmail, recuperarPassword);
router.get('/recuperar-password/:token', comprobarTokenPassword);
router.post('/recuperar-password/:token',validarNuevoPassword, crearNuevoPassword);

export default router;