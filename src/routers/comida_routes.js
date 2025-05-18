import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { eliminarComidas, registrarComidas } from '../controllers/comida_controller.js'
const router = Router()


router.post('/comidas-paciente/registro',verificarTokenJWT,registrarComidas)
router.delete('/comida/:id',verificarTokenJWT,eliminarComidas)


export default router