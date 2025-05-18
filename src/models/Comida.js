import mongoose, {Schema,model} from 'mongoose'

const comidaSchema = new Schema({
    fecha:{
        type:Date,
        default: Date.now
    },
    tipoComida: { 
        type: String, 
        enum: ['Desayuno', 'Almuerzo', 'Cena', 'Snack'], 
        required: true 
    },
    descripcion: { 
        type: String, 
        required: true 
    },
    paciente:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Paciente'
    },
    
    },{
        timestamps:true
    })

export default model('Comida', comidaSchema);