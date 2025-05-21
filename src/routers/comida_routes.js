import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { actualizarComida, eliminarComidas, registrarComidas, verComidaPacienteId } from '../controllers/comida_controller.js'
import { validacionComida } from '../middlewares/validacionComida.js'
const router = Router()


router.post('/comidas-paciente/registro',verificarTokenJWT,validacionComida,registrarComidas)
router.get('/ver-comida/:id',verificarTokenJWT,verComidaPacienteId)
router.delete('/eliminar-comida/:id',verificarTokenJWT,eliminarComidas)
router.put('/actualizar-comida/',verificarTokenJWT,actualizarComida)



export default router