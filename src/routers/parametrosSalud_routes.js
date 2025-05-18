import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { eliminarParametro, registrarParametroSalud } from '../controllers/parametrosSalud_controller.js'
const router = Router()


router.post('/parametros-salud/registro',verificarTokenJWT,registrarParametroSalud)
router.delete('/parametro/:id',verificarTokenJWT,eliminarParametro)


export default router