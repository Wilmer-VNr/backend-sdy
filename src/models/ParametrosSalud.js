import mongoose, {Schema,model} from 'mongoose'

const parametroSaludSchema  = new Schema({
    fecha:{
        type:Date,
        default: Date.now
    },
    peso:{
        type:Number,
        require:true,

    },
    estatura:{
        type: Number,
        require:true,
        
    },
    nivelActividadFisica: {
        type: String,
        enum: ['Bajo', 'Moderado', 'Alto'],
        required: true,
    },
    enfermedad: { 
        type: String, 
        default: '' 
    },
    discapacidad: { 
        type: String, 
        default: '' 
    },
    paciente:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Paciente'
    },
},{
    timestamps:true
})

export default model('Parametro', parametroSaludSchema)