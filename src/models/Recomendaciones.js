import mongoose, { Schema, model } from "mongoose";

const recomendacionesSchema = new Schema(
    {
        paciente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Paciente",
            required: true,
        },
        tipo: {
            type: String,
            enum: ["comidas", "parametros"],
            required: true,
        },
        contenido: {
            type: String,
            required: true,
        },
        idsRelacionados: {
            type: [mongoose.Schema.Types.ObjectId], 
            refPath: "tipoRelacionado",
        },
        tipoRelacionado: {
            type: String,
            enum: ["Comida", "ParametrosSalud"], 
        },
    },
    {
        timestamps: true, 
    }
);

export default model("Recomendaciones", recomendacionesSchema);