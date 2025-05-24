import OpenAI from "openai";
import dotenv from "dotenv";
import Comida from "../models/Comida.js";
import ParametrosSalud from "../models/ParametrosSalud.js";
import Recomendaciones from "../models/Recomendaciones.js";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    apiBaseUrl: process.env.OPENAI_API_BASE_URL,
});

// Contar cuántas recomendaciones existen hoy para un paciente y tipo
const contarRecomendacionesHoy = async (pacienteId, tipo) => {
    const hoy = new Date().toISOString().split("T")[0];
    const desde = new Date(`${hoy}T00:00:00Z`);
    const hasta = new Date(`${hoy}T23:59:59Z`);

    return await Recomendaciones.countDocuments({
        paciente: pacienteId,
        tipo,
        createdAt: { $gte: desde, $lt: hasta },
    });
};

const generarRecomendacionesComidas = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        const conteoHoy = await contarRecomendacionesHoy(pacienteId, "comidas");
        if (conteoHoy >= 3) {
            return res.status(400).json({ msg: "Ya se han generado 3 recomendaciones de comidas hoy." });
        }

        const comidas = await Comida.find({ paciente: pacienteId }).sort({ createdAt: -1 });
        if (!comidas.length) {
            return res.status(404).json({ msg: "No se encontraron comidas registradas para este paciente." });
        }

        const ultimoDia = comidas[0].createdAt.toISOString().split("T")[0];
        const comidasUltimoDia = comidas.filter(
            (comida) => comida.createdAt.toISOString().split("T")[0] === ultimoDia
        );

        if (!comidasUltimoDia.length) {
            return res.status(404).json({ msg: "No se encontraron comidas del último día registrado." });
        }

        const desayuno = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "desayuno");
        const almuerzo = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "almuerzo");
        const cena = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "cena");
        const snacks = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "snack");

        const obtenerRecomendaciones = async (tipo, comidas) => {
            if (!comidas.length) return `No se encontraron comidas para ${tipo}.`;

            const prompt = `
                Analiza las siguientes comidas registradas para ${tipo} y proporciona las calorías de cada una:
                - Comidas: ${JSON.stringify(comidas)}
                Solo dame el nombre de la comida y las calorías.
            `;

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            });

            return response.choices[0].message.content;
        };

        const contenido = {
            desayuno: await obtenerRecomendaciones("desayuno", desayuno),
            almuerzo: await obtenerRecomendaciones("almuerzo", almuerzo),
            cena: await obtenerRecomendaciones("cena", cena),
            snacks: await obtenerRecomendaciones("snack", snacks),
        };

        const nuevaRecomendacion = await Recomendaciones.create({
            paciente: pacienteId,
            tipo: "comidas",
            contenido: JSON.stringify(contenido),
            idsRelacionados: comidasUltimoDia.map((comida) => comida._id),
            tipoRelacionado: "Comida",
        });


        res.status(200).json({ msg: "Recomendación generada exitosamente." });
    } catch (error) {
        console.error("Error al generar recomendaciones de comidas:", error);
        res.status(500).json({ msg: error.message });
    }
};

const generarRecomendacionesParametros = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        const conteoHoy = await contarRecomendacionesHoy(pacienteId, "parametros");
        if (conteoHoy >= 3) {
            return res.status(400).json({ msg: "Ya se han generado 3 recomendaciones de parámetros hoy." });
        }

        const parametrosSalud = await ParametrosSalud.findOne({ paciente: pacienteId }).sort({ createdAt: -1 });
        if (!parametrosSalud) {
            return res.status(404).json({ msg: "No se encontraron parámetros de salud para este paciente." });
        }

        const prompt = `
            Analiza los siguientes datos de salud de un paciente y proporciona recomendaciones personalizadas:
            - Últimos parámetros de salud: ${JSON.stringify(parametrosSalud)}
            Incluye recomendaciones sobre hábitos saludables y posibles mejoras. No me des una respuesta muy larga y evita hablar sobre alimentación.
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        const recomendaciones = response.choices[0].message.content;

        const nuevaRecomendacion = await Recomendaciones.create({
            paciente: pacienteId,
            tipo: "parametros",
            contenido: recomendaciones,
            idsRelacionados: [parametrosSalud._id],
            tipoRelacionado: "ParametrosSalud",
        });

        
        res.status(200).json({ msg: "Recomendación generada exitosamente." });
    } catch (error) {
        console.error("Error al generar recomendaciones de parámetros:", error);
        res.status(500).json({ msg: error.message });
    }
};

const obtenerRecomendaciones = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const { tipo } = req.query;

        const filtro = { paciente: pacienteId };
        if (tipo) filtro.tipo = tipo;

        const recomendaciones = await Recomendaciones.find(filtro)
            .sort({ createdAt: -1 })
            .populate("idsRelacionados");

        if (!recomendaciones.length) {
            return res.status(404).json({ msg: "No se encontraron recomendaciones para este paciente." });
        }

        res.status(200).json({ recomendaciones });
    } catch (error) {
        console.error("Error al obtener recomendaciones:", error);
        res.status(500).json({ msg: "Error al obtener recomendaciones." });
    }
};

export {
    generarRecomendacionesComidas,
    generarRecomendacionesParametros,
    obtenerRecomendaciones
};
