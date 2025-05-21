
import Nutricionista from "../models/Nutricionista.js"
import {sendMailToRecoveryPassword } from "../config/nodemailer.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import mongoose from "mongoose"
import Paciente from "../models/Paciente.js";

const recuperarPassword = async(req,res)=>{
    const {email} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    const nutricionistaBDD = await Nutricionista.findOne({email})
    if(!nutricionistaBDD) return res.status(404).json({msg:"Lo sentimos, el usuario no se encuentra registrado"})
    const token = nutricionistaBDD.crearToken()
    nutricionistaBDD.token=token
    await sendMailToRecoveryPassword(email,token)
    await nutricionistaBDD.save()
    res.status(200).json({msg:"Revisa tu correo electrónico para reestablecer tu cuenta"})
}


const comprobarTokenPasword = async (req,res)=>{
    if(!(req.params.token)) return res.status(404).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    const nutricionistaBDD = await Nutricionista.findOne({token:req.params.token})
    if(nutricionistaBDD?.token !== req.params.token) return res.status(404).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    await nutricionistaBDD.save()
    res.status(200).json({msg:"Token confirmado, ya puedes crear tu nuevo password"}) 
}


const crearNuevoPassword = async (req,res)=>{
    const{password,confirmpassword} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    if(password != confirmpassword) return res.status(404).json({msg:"Lo sentimos, los passwords no coinciden"})
    const nutricionistaBDD = await Nutricionista.findOne({token:req.params.token})
    if(nutricionistaBDD?.token !== req.params.token) return res.status(404).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    nutricionistaBDD.token = null
    nutricionistaBDD.password = await nutricionistaBDD.encrypPassword(password)
    await nutricionistaBDD.save()
    res.status(200).json({msg:"Felicitaciones, ya puedes iniciar sesión con tu nuevo password"}) 
}



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
            .select("-password -token -__v -createdAt -updatedAt")
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

const eliminarPaciente = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Verificar permisos (solo nutricionistas)
        if (req.user.rol !== "nutricionista") {
            return res.status(403).json({
                success: false,
                msg: "Acceso denegado. Requiere rol de nutricionista"
            });
        }

        // 2. Validar el ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                msg: "ID de paciente no válido"
            });
        }

        // 3. Verificar si el paciente existe y está activo
        const pacienteExistente = await Paciente.findOne({
            _id: id,
            status: true
        });

        if (!pacienteExistente) {
            return res.status(404).json({
                success: false,
                msg: "Paciente no encontrado"
            });
        }

        // 4. Actualizar el status a false (borrado lógico)
        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            id,
            { status: false },
            { new: true, select: "-password -token -__v -createdAt -updatedAt" }
        );

        // 5. Responder con el resultado
        res.status(200).json({
            success: true,
            msg: "Paciente eliminado correctamente",
            paciente: pacienteActualizado
        });

    } catch (error) {
        console.error("Error al eliminar paciente:", error);
        res.status(500).json({
            success: false,
            msg: "Error interno al eliminar paciente",
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
    console.log(nutricionistaBDD)
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
 
    recuperarPassword,
    comprobarTokenPasword,
    crearNuevoPassword,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    listarTodosLosPacientes,
    obtenerPacientePorId,
    eliminarPaciente
}


