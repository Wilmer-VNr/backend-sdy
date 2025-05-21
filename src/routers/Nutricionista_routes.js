import {Router} from 'express'
import { actualizarPerfil, comprobarTokenPasword, crearNuevoPassword, perfil, recuperarPassword, listarTodosLosPacientes, obtenerPacientePorId, eliminarPaciente, actualizarPassword } from '../controllers/Nutricionista_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
const router = Router()



//Rutas para recuperar contraseña
router.post('/recuperar-password/nutricionista',recuperarPassword)
router.get('/recuperar-password/:token',comprobarTokenPasword)
router.post('/nuevo-password/:token',crearNuevoPassword)


// Ruta para ver perfil del paciente

router.get('/perfilNutri', verificarTokenJWT, perfil)
router.put('/perfil-nutricionista/:id',verificarTokenJWT,actualizarPerfil)

// Nuevas rutas para gestión de pacientes por nutricionistas
router.get('/listar-pacientes', verificarTokenJWT, listarTodosLosPacientes);
router.get('/listar-pacientes/:id', verificarTokenJWT, obtenerPacientePorId);
router.delete('/eliminar-paciente/:id', verificarTokenJWT, eliminarPaciente);
router.put('/nutricionista/actualizar-password/:id',verificarTokenJWT,actualizarPassword)
export default router