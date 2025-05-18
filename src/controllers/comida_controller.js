import ComidasPaciente from "../models/Comida.js";
import mongoose from "mongoose"


const registrarComidas = async (req,res)=>{
    const {paciente} = req.body
    if( !mongoose.Types.ObjectId.isValid(paciente) ) return res.status(404).json({msg:`Lo sentimos, debe ser un id válido`});
    await ComidasPaciente.create(req.body)
    res.status(200).json({msg:"Registro de comida exitosamente"})
    console.log(ComidasPaciente);
    
}
const eliminarComidas = async(req,res)=>{
    const {id} = req.params
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe`})
    await ComidasPaciente.findByIdAndDelete(req.params.id)
    res.status(200).json({msg:"Comida eliminado exitosamente"})
}

export{
    registrarComidas,
    eliminarComidas
}