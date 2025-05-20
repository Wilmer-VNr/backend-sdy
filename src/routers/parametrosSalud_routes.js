import {Router} from 'express'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { actualizarParametro, eliminarParametro, registrarParametroSalud, verParametroId } from '../controllers/parametrosSalud_controller.js'
import { validacionParametroSalud } from '../middlewares/validacionParametroSalud.js'
const router = Router()


router.post('/parametros-salud/registro',verificarTokenJWT,validacionParametroSalud,registrarParametroSalud)
router.get('/ver-parametro/:id',verificarTokenJWT,verParametroId)
router.delete('/eliminar-parametro/:id',verificarTokenJWT,eliminarParametro)
router.put('/actualizar-parametro/:id',verificarTokenJWT,actualizarParametro)


export default router

