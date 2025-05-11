
import Paciente from "../models/Paciente.js"
import sendMailToRegister from "../config/nodemailer.js"


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

export {
    registro
}
