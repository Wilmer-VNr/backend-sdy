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

// Función para verificar si ya existe una recomendación para hoy
const existeRecomendacionHoy = async (pacienteId, tipo) => {
    const hoy = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD
    console.log(`Verificando recomendaciones para el paciente ${pacienteId} y tipo ${tipo} en la fecha ${hoy}`);
    const recomendacion = await Recomendaciones.findOne({
        paciente: pacienteId,
        tipo,
        createdAt: { $gte: new Date(`${hoy}T00:00:00Z`), $lt: new Date(`${hoy}T23:59:59Z`) },
    });
    console.log("Recomendación encontrada:", recomendacion);
    return !!recomendacion; // Devuelve true si existe una recomendación
};

const generarRecomendacionesComidas = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        // Verificar cuántas recomendaciones de comidas ya se han generado hoy
        const hoy = new Date().toISOString().split("T")[0]; // Fecha actual en formato YYYY-MM-DD
        const recomendacionesHoy = await Recomendaciones.countDocuments({
            paciente: pacienteId,
            tipo: "comidas",
            createdAt: { $gte: new Date(`${hoy}T00:00:00Z`), $lt: new Date(`${hoy}T23:59:59Z`)},
        });
        if (recomendacionesHoy >= 3) {
            return res.status(400).json({ msg: "Ya has generado el máximo de 3 recomendaciones de comidas para hoy." });
        }

        // Obtener todas las comidas del paciente, ordenadas por fecha descendente
        const comidas = await Comida.find({ paciente: pacienteId }).sort({ createdAt: -1 });
        if (!comidas.length) {
            return res.status(404).json({ msg: "No se encontraron comidas registradas para este paciente." });
        }

        // Filtrar las comidas del último día registrado
        const ultimoDia = comidas[0].createdAt.toISOString().split("T")[0];
        const comidasUltimoDia = comidas.filter(
            (comida) => comida.createdAt.toISOString().split("T")[0] === ultimoDia
        );

        if (!comidasUltimoDia.length) {
            return res.status(404).json({ msg: "No se encontraron comidas del último día registrado." });
        }

        // Dividir las comidas por tipo
        const desayuno = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "desayuno");
        const almuerzo = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "almuerzo");
        const cena = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "cena");
        const snacks = comidasUltimoDia.filter((comida) => comida.tipoComida.toLowerCase() === "snack");

        const obtenerRecomendaciones = async (tipo, comidas) => {
            if (!comidas.length) return `No se encontraron comidas para ${tipo}.`;

            const prompt = `
                Analiza las siguientes comidas registradas para ${tipo} y proporciona una estimación aproximada de las calorías de cada una, 
                basándote en las preparaciones comunes de la gastronomía ecuatoriana. Asegúrate de identificar el nombre de cada comida 
                y las calorías aproximadas asociadas con cada una. Si la comida contiene ingredientes como aceites, grasas u otros elementos 
                adicionales, incluye también las calorías correspondientes a esos ingredientes. Si no puedes determinar con precisión las calorías, 
                indica que las calorías son aproximadas o basadas en suposiciones comunes, y explica cómo se llegó a esa estimación.

                Comidas: ${JSON.stringify(comidas)}

                Solo dame el nombre de la comida y, si contiene algún ingrediente adicional o extra (como aceites o grasas), incluye también 
                las calorías aproximadas de esos ingredientes. Si no puedes calcular las calorías, indica que no se puede determinar.
            `;


            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            });

            return response.choices[0].message.content;
        };

        // Generar recomendaciones para cada tipo de comida
        const recomendacionesDesayuno = await obtenerRecomendaciones("desayuno", desayuno);
        const recomendacionesAlmuerzo = await obtenerRecomendaciones("almuerzo", almuerzo);
        const recomendacionesCena = await obtenerRecomendaciones("cena", cena);
        const recomendacionesSnacks = await obtenerRecomendaciones("snack", snacks);

        const contenido = {
            desayuno: recomendacionesDesayuno,
            almuerzo: recomendacionesAlmuerzo,
            cena: recomendacionesCena,
            snacks: recomendacionesSnacks,
        };

        // Guardar la recomendación en la base de datos
        const nuevaRecomendacion = await Recomendaciones.create({
            paciente: pacienteId,
            tipo: "comidas",
            contenido: JSON.stringify(contenido),
            idsRelacionados: comidasUltimoDia.map((comida) => comida._id),
            tipoRelacionado: "Comida",
        });

        console.log("Recomendación de comidas guardada:", nuevaRecomendacion);

        res.status(200).json({ msg: "Recomendación generada exitosamente."});
    } catch (error) {
        console.error("Error al generar recomendaciones de comidas:", error);
        res.status(500).json({ msg: error.message });
    }
};



const generarRecomendacionesParametros = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        // Verificar si ya existe una recomendación de parámetros para hoy
        if (await existeRecomendacionHoy(pacienteId, "parametros")) {
            return res.status(400).json({ msg: "No puedes generar más recomendaciones de parámetros por hoy." });
        }

        const parametrosSalud = await ParametrosSalud.findOne({ paciente: pacienteId }).sort({ createdAt: -1 });
        if (!parametrosSalud) {
            return res.status(404).json({ msg: "No se encontraron parámetros de salud para este paciente." });
        }

        const prompt = `
            Analiza los siguientes datos de salud de un paciente y proporciona recomendaciones personalizadas, sin hacer suposiciones generales. Utiliza un tono empático, directo y comprensivo, enfocándote en mejorar la actividad física, motivación y manejo del estrés. Las sugerencias deben ser realistas y adaptadas a las condiciones del paciente, ya sea que tenga o no una discapacidad o condición médica.
            Evita recomendaciones sobre alimentación. Las recomendaciones deben ser prácticas, alcanzables y basadas exclusivamente en los datos proporcionados del paciente:

            - Peso: ${parametrosSalud.peso} kg
            - Estatura: ${parametrosSalud.estatura} cm
            - Nivel de actividad física: ${parametrosSalud.nivelActividadFisica}
            - Condiciones de salud: ${parametrosSalud.enfermedad || 'Ninguna registrada'}
            - Discapacidades: ${parametrosSalud.discapacidad || 'Ninguna registrada'}

            Asegúrate de que las sugerencias sean realistas para su nivel de salud y movilidad.
            Sé claro, conciso y efectivo, como lo haría un profesional al dar recomendaciones prácticas y realistas para mejorar la calidad de vida del paciente.
        `;




        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        const recomendaciones = response.choices[0].message.content;

        // Guardar la recomendación en la base de datos
        const nuevaRecomendacion = await Recomendaciones.create({
            paciente: pacienteId,
            tipo: "parametros",
            contenido: recomendaciones,
            idsRelacionados: [parametrosSalud._id],
            tipoRelacionado: "ParametrosSalud",
        });

        console.log("Recomendación de parámetros guardada:", nuevaRecomendacion);

        res.status(200).json({ msg: "Recomendación generada exitosamente."});
    } catch (error) {
        console.error("Error al generar recomendaciones de parámetros:", error);
        res.status(500).json({ msg: error.message });
    }

};

    


const obtenerRecomendaciones = async (req, res) => {
    try {
        const { pacienteId } = req.params; // ID del paciente
        const { tipo } = req.query; // Tipo de recomendación (opcional: "comidas" o "parametros")

        // Construir el filtro de búsqueda
        const filtro = { paciente: pacienteId };
        if (tipo) {
            filtro.tipo = tipo; // Filtrar por tipo si se proporciona
        }

        // Buscar las recomendaciones en la base de datos
        const recomendaciones = await Recomendaciones.find(filtro)
            .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente
            .populate("idsRelacionados"); // Poblar los datos relacionados (comidas o parámetros)

        // Verificar si se encontraron recomendaciones
        if (!recomendaciones.length) {
            return res.status(404).json({ msg: "No se encontraron recomendaciones para este paciente." });
        }

        // Enviar las recomendaciones al frontend
        res.status(200).json({ recomendaciones });
    } catch (error) {
        console.error("Error al obtener recomendaciones:", error);
        res.status(500).json({ msg: "Error al obtener recomendaciones." });
    }
};

const generarRecetasPersonalizadas = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        // Verificar si ya existe una recomendación de recetas para hoy
        if (await existeRecomendacionHoy(pacienteId, "recetas")) {
            return res.status(400).json({ msg: "Ya generaste recetas personalizadas hoy." });
        }

        // Obtener los últimos parámetros de salud del paciente
        const parametrosSalud = await ParametrosSalud.findOne({ paciente: pacienteId }).sort({ createdAt: -1 });
        if (!parametrosSalud) {
            return res.status(404).json({ msg: "No se encontraron parámetros de salud para este paciente." });
        }

        // Prompt para OpenAI
        const prompt = `
Eres un nutricionista especializado en pacientes ecuatorianos. A partir de los siguientes parámetros de salud:

${JSON.stringify(parametrosSalud)}

Genera un plan de recetas saludables personalizadas para desayuno, almuerzo, cena y snack, teniendo en cuenta las condiciones del paciente (peso, IMC, enfermedades, etc.).

- Las recetas deben ser típicas ecuatorianas pero adaptadas para ser saludables.
- Incluye: nombre de la receta, ingredientes, preparación paso a paso, recomendaciones nutricionales, y por qué es adecuada para el paciente.
- Usa un formato claro tipo JSON u objeto estructurado por comida.

No incluyas datos inventados del paciente. Usa solo los parámetros proporcionados. Sé preciso, profesional y breve.
Evita alimentos no recomendados si el paciente tiene sobrepeso, hipertensión, colesterol alto, etc.
No menciones calorías. Mantén el texto en español neutro y breve.        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        const recetasGeneradas = response.choices[0].message.content;

        // Guardar la recomendación como "recetas"
        const nuevaRecomendacion = await Recomendaciones.create({
            paciente: pacienteId,
            tipo: "recetas",
            contenido: recetasGeneradas,
            idsRelacionados: [parametrosSalud._id],
            tipoRelacionado: "ParametrosSalud",
        });

        console.log("Recetas personalizadas guardadas:", nuevaRecomendacion);

        res.status(200).json({ msg: "Recetas personalizadas generadas exitosamente." });

    } catch (error) {
        console.error("Error al generar recetas personalizadas:", error);
        res.status(500).json({ msg: error.message });
    }
};





export { 
    generarRecomendacionesComidas, 
    generarRecomendacionesParametros, 
    obtenerRecomendaciones,
    generarRecetasPersonalizadas
};