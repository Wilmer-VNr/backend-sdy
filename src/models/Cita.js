import mongoose, {Schema,model} from 'mongoose'

const citaSchema  = new Schema({
    paciente:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Paciente'
    },
    nutricionista: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nutricionista',
        required: true
    },
    fecha: {
        type: Date,
        required: false
    },
    modalidad: {
        type: String,
        enum: ['presencial', 'virtual'],
        required: true
    },
    descripcion: { 
        type: String, 
        required: true 
    },
    estado: {
        type: String,
        enum: ['pendiente', 'confirmada', 'cancelada', 'completada'],
        default: 'pendiente'
    },
    linkReunion: {
        type: String,
        required: false 
    }
    
},{
    timestamps:true
})

export default model('Cita', citaSchema)