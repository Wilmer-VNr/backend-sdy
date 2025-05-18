import {Router} from 'express'
import { actualizarPassword, actualizarPerfil, comprobarTokenPasword, confirmarMail, crearNuevoPassword, detalleComidasPaciente, detalleParametrosPaciente, perfil, recuperarPassword, registro } from '../controllers/Paciente_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
const router = Router()


// Rutas para registrar usuario
router.post('/registro', registro)
router.get('/confirmar/:token',confirmarMail)

//Rutas para recuperar contraseña
router.post('/recuperar-password',recuperarPassword)
router.get('/recuperar-password/:token',comprobarTokenPasword)
router.post('/nuevo-password/:token',crearNuevoPassword)


// Ruta para ver y actualizar perfil del paciente

router.get('/perfil', verificarTokenJWT, perfil)
router.put('/paciente/:id',verificarTokenJWT,actualizarPerfil)
router.put('/paciente/actualizar-password/:id',verificarTokenJWT,actualizarPassword)
router.get('/paciente/parametro/:id', verificarTokenJWT, detalleParametrosPaciente)
router.get('/paciente/comidas/:id', verificarTokenJWT, detalleComidasPaciente)
export default router