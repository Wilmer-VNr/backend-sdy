import Cita from "../models/Cita.js"
import Paciente from "../models/Paciente.js"
import Nutricionista from "../models/Nutricionista.js"
import mongoose from "mongoose"
import { sendMailToConfirmCita } from "../config/nodemailer.js";

const crearCita = async (req, res) => {
    const { paciente, nutricionista, fecha, modalidad, descripcion } = req.body;

    if (!paciente || !nutricionista || !modalidad || !descripcion) {
        return res.status(400).json({ msg: "Lo sentimos, debes llenar todos los campos obligatorios" });
    }

    if (!mongoose.Types.ObjectId.isValid(paciente) || !mongoose.Types.ObjectId.isValid(nutricionista)) {
        return res.status(404).json({ msg: "Lo sentimos, IDs no válidos" });
    }

    const existePaciente = await Paciente.findById(paciente);
    const existeNutricionista = await Nutricionista.findById(nutricionista);
    if (!existePaciente || !existeNutricionista) {
        return res.status(404).json({ msg: "Lo sentimos, paciente o nutricionista no encontrado" });
    }

    const nuevaCita = new Cita({ paciente, nutricionista, fecha, modalidad, descripcion });
    await nuevaCita.save();

   
    await sendMailToConfirmCita(existeNutricionista.email, {
        nombrePaciente: `${existePaciente.nombre} ${existePaciente.apellido}`,
        modalidad,
        descripcion,
        citaId: nuevaCita._id 
    });

    res.status(200).json({ msg: "Cita solicitada correctamente. El nutricionista confirmará fecha y hora.", cita: nuevaCita });
};
const confirmarCitaConFecha = async (req, res) => {
    const { id } = req.params;
    const { fecha, linkReunion, lugar } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "ID de cita no válido" });
    }

    const cita = await Cita.findById(id).populate('paciente nutricionista', 'email nombre apellido');
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" });

    if (!fecha) return res.status(400).json({ msg: "Debes ingresar la fecha y hora de la cita" });

    // ✅ Validar campos según modalidad
    if (cita.modalidad === 'virtual') {
        if (!linkReunion) {
            return res.status(400).json({ msg: "Para citas virtuales es necesario proporcionar el link de la reunión" });
        }
    }

    if (cita.modalidad === 'presencial') {
        if (!lugar) {
            return res.status(400).json({ msg: "Para citas presenciales debes indicar el lugar de la cita" });
        }
        cita.lugar = lugar;
    }

    cita.fecha = fecha;
    cita.linkReunion = linkReunion;
    cita.estado = "confirmada";
    await cita.save();


    await sendMailToConfirmCita(cita.paciente.email, {
        nombrePaciente: cita.paciente.nombre,
        nombreNutricionista: `${cita.nutricionista.nombre} ${cita.nutricionista.apellido}`,
        fecha,
        modalidad: cita.modalidad,
        descripcion: cita.descripcion,
        linkReunion: cita.linkReunion,
        lugar: cita.lugar, 
        citaId: cita._id
    });

    res.status(200).json({ msg: "Cita confirmada correctamente", cita });
};


const listarCitasPaciente = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: `Lo sentimos, el ID ${id} no es válido` })

    const citas = await Cita.find({ paciente: id }).populate('nutricionista', 'nombre apellido email').sort({ fecha: 1 })
    res.status(200).json(citas)
}


const listarCitasNutricionista = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: `Lo sentimos, el ID ${id} no es válido` })

    const citas = await Cita.find({ nutricionista: id }).populate('paciente', 'nombre apellido email').sort({ fecha: 1 })
    res.status(200).json(citas)
}

const detalleCita = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: `ID de cita no válido` })

    const cita = await Cita.findById(id).populate('paciente nutricionista', 'nombre apellido email')
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" })

    res.status(200).json(cita)
}



const eliminarCita = async (req, res) => {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ msg: `ID no válido` })

    const cita = await Cita.findById(id)
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" })

    await cita.deleteOne()
    res.status(200).json({ msg: "Cita eliminada correctamente" })
}

const cancelarCita = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({ msg: "ID de cita no válido" })
    }

    const cita = await Cita.findById(id)
    if (!cita) return res.status(404).json({ msg: "Cita no encontrada" })

    if (cita.estado === "cancelada") {
        return res.status(400).json({ msg: "La cita ya está cancelada" })
    }

    cita.estado = "cancelada"
    await cita.save()

    res.status(200).json({ msg: "La cita ha sido cancelada correctamente", cita })
}


export {
    crearCita,
    confirmarCitaConFecha,
    listarCitasPaciente,
    listarCitasNutricionista,
    detalleCita,
    eliminarCita,
    cancelarCita
}