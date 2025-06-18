import {Router} from 'express'
import { actualizarAvatar, actualizarPassword, actualizarPerfil, comprobarTokenPasword, confirmarMail, crearNuevoPassword, detalleComidasPaciente, detalleParametrosPaciente, listarNutricionistas, perfil, recuperarPassword, registro } from '../controllers/Paciente_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { validacionPaciente } from '../middlewares/validacionPaciente.js'
import { validacionEmail, validarActualizarPassword, validarNuevoPassword } from '../middlewares/validacionPassword.js'
const router = Router()


// Rutas para registrar usuario
router.post('/registro', validacionPaciente, registro)
router.get('/confirmar/:token',confirmarMail)

//Rutas para recuperar contraseña
router.post('/recuperar-password',validacionEmail,recuperarPassword)
router.get('/recuperar-password/:token',comprobarTokenPasword)
router.post('/nuevo-password/:token',validarNuevoPassword,crearNuevoPassword)

// Ruta para ver y actualizar perfil del paciente
router.get('/perfil', verificarTokenJWT, perfil)
router.put('/paciente/:id',verificarTokenJWT,validacionPaciente,actualizarPerfil)
router.put('/paciente/actualizar-password/:id',verificarTokenJWT,validarActualizarPassword,actualizarPassword)
router.get('/paciente/parametro/:id', verificarTokenJWT, detalleParametrosPaciente)
router.get('/paciente/comidas/:id', verificarTokenJWT, detalleComidasPaciente)

router.get('/listar-nutricionistas',verificarTokenJWT, listarNutricionistas);

router.put('/paciente/avatar/:id', verificarTokenJWT, actualizarAvatar);

export default router