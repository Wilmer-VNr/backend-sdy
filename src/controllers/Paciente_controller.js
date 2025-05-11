
import Paciente from "../models/Paciente.js"
import {sendMailToRegister ,sendMailToRecoveryPassword } from "../config/nodemailer.js"



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

const login = async(req,res)=>{
    const {email,password} = req.body
    if (Object.values(req.body).includes("")) return res.status(404).json({msg:"Lo sentimos, debes llenar todos los campos"})
    const pacienteBDD = await Paciente.findOne({email}).select("-status -__v -token -updatedAt -createdAt")
    if(pacienteBDD?.confirmEmail===false) return res.status(403).json({msg:"Lo sentimos, debe verificar su cuenta"})
    if(!pacienteBDD) return res.status(404).json({msg:"Lo sentimos, el usuario no se encuentra registrado"})
    const verificarPassword = await pacienteBDD.matchPassword(password)
    if(!verificarPassword) return res.status(404).json({msg:"Lo sentimos, el password no es el correcto"})
    const {nombre,apellido,edad,direccion,celular,_id,rol} = pacienteBDD
    res.status(200).json({
        rol,
        nombre,
        apellido,
        edad,
        direccion,
        celular,
        _id,
        email:pacienteBDD.email
    })
}

export {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPasword,
    crearNuevoPassword,
    login
}


