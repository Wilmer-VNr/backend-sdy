import ParametroSalud from "../models/ParametrosSalud.js";
import mongoose from "mongoose"


const registrarParametroSalud = async (req,res)=>{
    const {paciente} = req.body
    if( !mongoose.Types.ObjectId.isValid(paciente) ) return res.status(404).json({msg:`Lo sentimos, debe ser un id válido`});
    await ParametroSalud.create(req.body)
    res.status(200).json({msg:"Registro exitoso"})
}
const eliminarParametro = async(req,res)=>{
    const {id} = req.params
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe`})
    await ParametroSalud.findByIdAndDelete(req.params.id)
    res.status(200).json({msg:"Parametro de salud eliminado exitosamente"})
}

export{
    registrarParametroSalud,
    eliminarParametro
}