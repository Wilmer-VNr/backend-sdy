import ParametroSalud from "../models/ParametrosSalud.js";
import mongoose from "mongoose"


const registrarParametroSalud = async (req,res)=>{
    const {paciente} = req.body
    if( !mongoose.Types.ObjectId.isValid(paciente) ) return res.status(404).json({msg:`Lo sentimos, debe ser un id válido`});
    const nuevoParametro = await ParametroSalud.create(req.body)
    res.status(200).json({msg:`Registro de comida exitosamente ${nuevoParametro._id}`,nuevoParametro})
    console.log(nuevoParametro);
}
const eliminarParametro = async(req,res)=>{
    const {id} = req.params
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe`})
    await ParametroSalud.findByIdAndDelete(req.params.id)
    res.status(200).json({msg:"Parametro de salud eliminado exitosamente"})
}
const verParametroId = async(req,res)=>{
    const {id} = req.params
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el parametro`});
    const parametro = await ParametroSalud.findById(id).populate('paciente','_id nombre')
    res.status(200).json(parametro)
}
const actualizarParametro = async(req,res)=>{
    const {id} = req.params
    if (Object.values(req.body).includes("")) return res.status(400).json({msg:"Lo sentimos, debes llenar todos los campos"})
    if( !mongoose.Types.ObjectId.isValid(id) ) return res.status(404).json({msg:`Lo sentimos, no existe el parametro ${id}`})
    await ParametroSalud.findByIdAndUpdate(req.params.id,req.body)
    res.status(200).json({msg:"Actualización exitosa del parametro"})
}
export{
    registrarParametroSalud,
    eliminarParametro,
    verParametroId,
    actualizarParametro

}