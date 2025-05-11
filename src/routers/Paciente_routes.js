import {Router} from 'express'
import { comprobarTokenPasword, confirmarMail, crearNuevoPassword, login, recuperarPassword, registro } from '../controllers/Paciente_controller.js'
const router = Router()


// Rutas para registrar usuario
router.post('/registro',registro)
router.get('/confirmar/:token',confirmarMail)

//Rutas para recuperar contraseña
router.post('/recuperar-password',recuperarPassword)
router.get('/recuperar-password/:token',comprobarTokenPasword)
router.post('/nuevo-password/:token',crearNuevoPassword)

//Ruta para iniciar sesion
router.post('/login', login)

export default router