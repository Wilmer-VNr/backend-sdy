import express from "express";
import { generarRecomendacionesComidas,generarRecomendacionesParametros,obtenerRecomendaciones } from "../controllers/recomendaciones_controller.js";

const router = express.Router();

router.get("/recomendacionesParametros/:pacienteId", generarRecomendacionesParametros);
router.get("/recomendacionesComidas/:pacienteId", generarRecomendacionesComidas);
router.get("/obtener-recomendaciones/:pacienteId", obtenerRecomendaciones);


export default router;