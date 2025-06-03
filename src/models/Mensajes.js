// models/Mensaje.js
import { Schema, model } from 'mongoose';

const mensajeSchema = new Schema({
  emisor: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'emisorModel'
  },
  emisorModel: {
    type: String,
    required: true,
    enum: ['Paciente', 'Nutricionista']
  },
  receptor: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'receptorModel'
  },
  receptorModel: {
    type: String,
    required: true,
    enum: ['Paciente', 'Nutricionista']
  },
  contenido: {
    type: String,
    required: true
  },
  leido: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default model('Mensaje', mensajeSchema);