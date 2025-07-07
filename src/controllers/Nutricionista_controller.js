
import Nutricionista from "../models/Nutricionista.js"
import mongoose from "mongoose"
import Paciente from "../models/Paciente.js";


const perfil =(req,res)=>{
    delete req.nutricionistaBDD.token
    delete req.nutricionistaBDD.confirmEmail
    delete req.nutricionistaBDD.createdAt
    delete req.nutricionistaBDD.updatedAt
    delete req.nutricionistaBDD.__v
    res.status(200).json(req.nutricionistaBDD)
}

const listarTodosLosPacientes = async (req, res) => {
    try {
        // Verificar que el usuario es nutricionista (el middleware JWT ya lo hizo)
        if (req.user.rol !== "nutricionista") {
            return res.status(403).json({
                success: false,
                msg: "No autorizado. Solo nutricionistas pueden acceder a esta función"
            });
        }

        // Buscar todos los pacientes activos, con información básica
        const pacientes = await Paciente.find({ estado: true })
            .select("-password -token -__v -createdAt -updatedAt")
            .lean();

        res.status(200).json({
            success: true,
            count: pacientes.length,
            pacientes
        });

    } catch (error) {
        console.error("Error al listar pacientes:", error);
        res.status(500).json({
            success: false,
            msg: "Error al obtener los pacientes",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};


const obtenerPacientePorId = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar que el usuario es nutricionista
        if (req.user.rol !== "nutricionista") {
            return res.status(403).json({
                success: false,
                msg: "No autorizado. Solo nutricionistas pueden acceder a esta función"
            });
        }

        // Validar el ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                msg: "ID de paciente no válido"
            });
        }

        // Buscar paciente por ID, excluyendo datos sensibles
        const paciente = await Paciente.findById(id)
            .select("-password -token -__v -updatedAt")
            .lean();

        if (!paciente) {
            return res.status(404).json({
                success: false,
                msg: "Paciente no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            paciente
        });

    } catch (error) {
        console.error("Error al buscar paciente por ID:", error);
        res.status(500).json({
            success: false,
            msg: "Error al obtener el paciente",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

const bloquearPaciente = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.rol !== "nutricionista") {return res.status(403).json({ success: false,
                msg: "Acceso denegado. Requiere rol de nutricionista"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                msg: "ID de paciente no válido"
            });
        }

        const pacienteExistente = await Paciente.findOne({ _id: id, status: true});

        if (!pacienteExistente) {
            return res.status(404).json({
                success: false,
                msg: "Paciente no encontrado"
            });
        }
        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            id,
            { status: false },
            { new: true, select: "-password -token -__v -createdAt -updatedAt" }
        );

        res.status(200).json({
            success: true,
            msg: "Paciente bloqueado correctamente",
            paciente: pacienteActualizado
        });

    } catch (error) {
        console.error("Error al bloquear paciente:", error);
        res.status(500).json({
            success: false,
            msg: "Error interno al bloquear paciente",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};


const actualizarPerfil = async (req,res)=>{
    const {id} = req.params
    const {nombre,apellido,edad,direccion,celular,email} = req.body
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, debe ser un id válido`});
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    const nutricionistaBDD = await Nutricionista.findById(id)
    if(!nutricionistaBDD) return res.status(404).json({msg:`Lo sentimos, no existe el Nutricionista ${id}`})
    if (nutricionistaBDD.email != email)
    {
        const nutricionistaBDDMail = await Nutricionista.findOne({email})
        if (nutricionistaBDDMail)
        {
            return res.status(404).json({msg:`Lo sentimos, el existe ya se encuentra registrado`})  
        }
    }
    nutricionistaBDD.nombre = nombre ?? nutricionistaBDD.nombre
    nutricionistaBDD.apellido = apellido ?? nutricionistaBDD.apellido
    nutricionistaBDD.edad = edad ?? nutricionistaBDD.edad
    nutricionistaBDD.direccion = direccion ?? nutricionistaBDD.direccion
    nutricionistaBDD.celular = celular ?? nutricionistaBDD.celular
    nutricionistaBDD.email = email ?? nutricionistaBDD.email
    await nutricionistaBDD.save()
    res.status(200).json(nutricionistaBDD)
}

const actualizarPassword = async (req,res)=>{
    const nutricionistaBDD = await Nutricionista.findById(req.nutricionistaBDD._id)
    if(!nutricionistaBDD) return res.status(404).json({msg:`Lo sentimos, no existe el nutricionista ${id}`})
    const verificarPassword = await nutricionistaBDD.matchPassword(req.body.passwordactual)
    if(!verificarPassword) return res.status(404).json({msg:"Lo sentimos, el password actual no es el correcto"})
    nutricionistaBDD.password = await nutricionistaBDD.encrypPassword(req.body.passwordnuevo)
    await nutricionistaBDD.save()
    res.status(200).json({msg:"Password actualizado correctamente"})
}

export {
    perfil,
    actualizarPerfil,
    actualizarPassword,
    listarTodosLosPacientes,
    obtenerPacientePorId,
    bloquearPaciente
}

