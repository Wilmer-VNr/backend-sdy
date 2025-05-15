
import Paciente from "../models/Paciente.js"
import Nutricionista from "../models/Nutricionista.js"
import {sendMailToRegister ,sendMailToRecoveryPassword } from "../config/nodemailer.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import mongoose from "mongoose"

const registro = async (req,res)=>{
    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    const verificarEmailBDD = await Paciente.findOne({email})
    if(verificarEmailBDD) return res.status(400).json({msg:"Lo sentimos, el email ya se encuentra registrado"})
    const nuevoPaciente = new Paciente(req.body)
    nuevoPaciente.password = await nuevoPaciente.encrypPassword(password)

    const token = nuevoPaciente.crearToken()
    await sendMailToRegister(email,token)
    await nuevoPaciente.save()
    res.status(200).json({msg:"Revisa tu correo electrónico para confirmar tu cuenta"})
    
}

const confirmarMail = async (req,res)=>{
    if(!(req.params.token)) return res.status(400).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    const pacienteBDD = await Paciente.findOne({token:req.params.token})
    if(!pacienteBDD?.token) return res.status(404).json({msg:"La cuenta ya ha sido confirmada"})
    pacienteBDD.token = null
    pacienteBDD.confirmEmail=true
    await pacienteBDD.save()
    res.status(200).json({msg:"Token confirmado, ya puedes iniciar sesión"}) 
}


const recuperarPassword = async(req,res)=>{
    const {email} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    const pacienteBDD = await Paciente.findOne({email})
    if(!pacienteBDD) return res.status(404).json({msg:"Lo sentimos, el usuario no se encuentra registrado"})
    const token = pacienteBDD.crearToken()
    pacienteBDD.token=token
    await sendMailToRecoveryPassword(email,token)
    await pacienteBDD.save()
    res.status(200).json({msg:"Revisa tu correo electrónico para reestablecer tu cuenta"})
}


const comprobarTokenPasword = async (req,res)=>{
    if(!(req.params.token)) return res.status(404).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    const pacienteBDD = await Paciente.findOne({token:req.params.token})
    if(pacienteBDD?.token !== req.params.token) return res.status(404).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    await pacienteBDD.save()
    res.status(200).json({msg:"Token confirmado, ya puedes crear tu nuevo password"}) 
}


const crearNuevoPassword = async (req,res)=>{
    const{password,confirmpassword} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    if(password != confirmpassword) return res.status(404).json({msg:"Lo sentimos, los passwords no coinciden"})
    const pacienteBDD = await Paciente.findOne({token:req.params.token})
    if(pacienteBDD?.token !== req.params.token) return res.status(404).json({msg:"Lo sentimos, no se puede validar la cuenta"})
    pacienteBDD.token = null
    pacienteBDD.password = await pacienteBDD.encrypPassword(password)
    await pacienteBDD.save()
    res.status(200).json({msg:"Felicitaciones, ya puedes iniciar sesión con tu nuevo password"}) 
}

const login = async (req, res) => {
    const { email, password } = req.body;

    // Validar si los campos están completos
    if (Object.values(req.body).includes("")) {
        return res.status(404).json({ msg: "Lo sentimos, debes llenar todos los campos" });
    }

    // Intentar encontrar el usuario primero como Paciente
    let user = await Paciente.findOne({ email }).select("-status -__v -token -updatedAt -createdAt");

    // Si no se encuentra como Paciente, buscar como Nutricionista
    if (!user) {
        user = await Nutricionista.findOne({ email }).select("-status -__v -token -updatedAt -createdAt");
    }

    // Si no se encuentra el usuario
    if (!user) {
        return res.status(404).json({ msg: "Lo sentimos, el usuario no se encuentra registrado" });
    }

    // Verificar si el email del paciente está confirmado, si es un paciente
    if (user.rol === 'paciente' && user.confirmEmail === false) {
        return res.status(403).json({ msg: "Lo sentimos, debe verificar su cuenta" });
    }

    // Verificar si la contraseña es correcta
    const verificarPassword = await user.matchPassword(password);
    if (!verificarPassword) {
        return res.status(404).json({ msg: "Lo sentimos, el password no es el correcto" });
    }

    // Extraer los datos que quieres devolver del usuario
    const { nombre, apellido, edad, direccion, celular, _id, rol } = user;

    // Crear el token (función que asumo ya tienes implementada)
    const token = crearTokenJWT(user._id, user.rol);

    // Responder con la información del usuario y el token
    return res.status(200).json({
        token,
        nombre,
        apellido,
        edad,
        direccion,
        celular,
        _id,
        email: user.email,
        rol
    });
};

const perfil =(req,res)=>{
    delete req.pacienteBDD.token
    delete req.pacienteBDD.confirmEmail
    delete req.pacienteBDD.createdAt
    delete req.pacienteBDD.updatedAt
    delete req.pacienteBDD.__v
    res.status(200).json(req.pacienteBDD)
}


const actualizarPerfil = async (req,res)=>{
    const {id} = req.params
    const {nombre,apellido,edad,direccion,celular,email} = req.body
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, debe ser un id válido`});
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    const pacienteBDD = await Paciente.findById(id)
    if(!pacienteBDD) return res.status(404).json({msg:`Lo sentimos, no existe el paciente ${id}`})
    if (pacienteBDD.email != email)
    {
        const pacienteBDDMail = await Paciente.findOne({email})
        if (pacienteBDDMail)
        {
            return res.status(404).json({msg:`Lo sentimos, el existe ya se encuentra registrado`})  
        }
    }
    pacienteBDD.nombre = nombre ?? pacienteBDD.nombre
    pacienteBDD.apellido = apellido ?? pacienteBDD.apellido
    pacienteBDD.edad = edad ?? pacienteBDD.edad
    pacienteBDD.direccion = direccion ?? pacienteBDD.direccion
    pacienteBDD.celular = celular ?? pacienteBDD.celular
    pacienteBDD.email = email ?? pacienteBDD.email
    await pacienteBDD.save()
    console.log(pacienteBDD)
    res.status(200).json(pacienteBDD)
}

const actualizarPassword = async (req,res)=>{
    const pacienteBDD = await Paciente.findById(req.pacienteBDD._id)
    if(!pacienteBDD) return res.status(404).json({msg:`Lo sentimos, no existe el paciente ${id}`})
    const verificarPassword = await pacienteBDD.matchPassword(req.body.passwordactual)
    if(!verificarPassword) return res.status(404).json({msg:"Lo sentimos, el password actual no es el correcto"})
    pacienteBDD.password = await pacienteBDD.encrypPassword(req.body.passwordnuevo)
    await pacienteBDD.save()
    res.status(200).json({msg:"Password actualizado correctamente"})
}

//PARA NUTRICIONISTA GESTIONAR PACIENTES
const listarPacientes = async (req,res)=>{
    const pacientes = await Paciente.find({estado:true}).where('nutricionista').equals(req.nutricionistaBDD).select("-createdAt -updatedAt -__v").populate('nutricionista','_id nombre apellido')
    res.status(200).json(pacientes)
}

const detallePaciente = async(req,res)=>{
    const {id} = req.params
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el nutricionista ${id}`});
    const paciente = await Paciente.findById(id).select("-createdAt -updatedAt -__v").populate('nutricionista','_id nombre apellido')
    res.status(200).json(paciente)
}


const eliminarPaciente = async (req,res)=>{
    const {id} = req.params
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el nutricionista ${id}`})
    res.status(200).json({msg:"Se elimino paciente exitosamente"})
}

export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPasword,
    crearNuevoPassword,
    login,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    listarPacientes,
    detallePaciente,
    eliminarPaciente
    

}