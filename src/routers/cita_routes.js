import express from "express"
import {
    crearCita,
    listarCitasPaciente,
    listarCitasNutricionista,
    detalleCita,
    eliminarCita,
    cancelarCita,
    confirmarCitaConFecha
} from "../controllers/Cita_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"

const router = express.Router()

router.post("/registrar-cita", verificarTokenJWT ,crearCita)
router.get("/paciente/:id", verificarTokenJWT,listarCitasPaciente)
router.get("/nutricionista/:id",verificarTokenJWT, listarCitasNutricionista)
router.get("/detalle-cita/:id",verificarTokenJWT, detalleCita)
router.put("/cancelar-cita/:id", verificarTokenJWT, cancelarCita)
router.delete("/eliminar-cita/:id",verificarTokenJWT, eliminarCita)

 
// Nutricionista
router.put("/confirmar-cita/:id", verificarTokenJWT, confirmarCitaConFecha);

export default router
