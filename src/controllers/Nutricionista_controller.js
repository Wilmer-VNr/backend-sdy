
import Nutricionista from "../models/Nutricionista.js"
import {sendMailToRecoveryPassword } from "../config/nodemailer.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import mongoose from "mongoose"


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



export {
 
    recuperarPassword,
    comprobarTokenPasword,
    crearNuevoPassword,
    perfil,
    actualizarPerfil
}


