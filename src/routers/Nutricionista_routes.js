import {Router} from 'express'
import { actualizarPerfil, perfil, listarTodosLosPacientes, obtenerPacientePorId, actualizarPassword, bloquearPaciente } from '../controllers/Nutricionista_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { validacionPerfil } from '../middlewares/validacionPaciente.js'
import { validarActualizarPassword } from '../middlewares/validacionPassword.js'
const router = Router()

// Ruta para ver perfil del paciente
router.get('/perfilNutri', verificarTokenJWT, perfil)
router.put('/perfil-nutricionista/:id',verificarTokenJWT,actualizarPerfil)
router.put('/nutricionista/actualizar-password/:id',verificarTokenJWT,validarActualizarPassword,actualizarPassword)
// Nuevas rutas para gestión de pacientes por nutricionistas
router.get('/listar-pacientes', verificarTokenJWT, listarTodosLosPacientes);
router.get('/listar-pacientes/:id', verificarTokenJWT, obtenerPacientePorId);
router.put('/bloquear-paciente/:id', verificarTokenJWT, bloquearPaciente);

export default router