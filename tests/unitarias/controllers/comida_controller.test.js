import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  registrarComidas, 
  eliminarComidas, 
  verComidaPacienteId, 
  actualizarComida 
} from '../../../src/controllers/comida_controller.js'
import ComidasPaciente from '../../../src/models/Comida.js'
import mongoose from 'mongoose'

describe('comida_controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {}
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    vi.clearAllMocks()
  })

  describe('registrarComidas', () => {
    it('debería registrar una comida exitosamente', async () => {
      const comidaData = {
        paciente: '507f1f77bcf86cd799439011',
        tipoComida: 'Desayuno',
        descripcion: 'Avena con frutas'
      }

      mockReq.body = comidaData

      const nuevaComida = {
        _id: 'comida123',
        ...comidaData,
        fecha: new Date()
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ComidasPaciente, 'findOne').mockResolvedValue(null)
      vi.spyOn(ComidasPaciente, 'create').mockResolvedValue(nuevaComida)

      await registrarComidas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Registro de comida exitosamente comida123',
        nuevaComida
      })
    })

    it('debería fallar con ID de paciente inválido', async () => {
      mockReq.body = {
        paciente: 'invalid-id',
        tipoComida: 'Desayuno'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await registrarComidas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, debe ser un id válido'
      })
    })

    it('debería fallar si ya existe una comida del mismo tipo para hoy', async () => {
      const comidaData = {
        paciente: '507f1f77bcf86cd799439011',
        tipoComida: 'Desayuno'
      }

      mockReq.body = comidaData

      const comidaExistente = {
        _id: 'comida123',
        tipoComida: 'Desayuno'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ComidasPaciente, 'findOne').mockResolvedValue(comidaExistente)

      await registrarComidas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Ya se ha registrado un(a) Desayuno para este paciente hoy.'
      })
    })
  })

  describe('eliminarComidas', () => {
    it('debería eliminar comida exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ComidasPaciente, 'findByIdAndDelete').mockResolvedValue({ _id: id })

      await eliminarComidas(mockReq, mockRes)

      expect(ComidasPaciente.findByIdAndDelete).toHaveBeenCalledWith(id)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Comida eliminado exitosamente'
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await eliminarComidas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe'
      })
    })
  })

  describe('verComidaPacienteId', () => {
    it('debería obtener comida por ID exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const comida = {
        _id: id,
        tipoComida: 'Desayuno',
        descripcion: 'Avena con frutas',
        paciente: {
          _id: 'paciente123',
          nombre: 'Juan'
        }
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ComidasPaciente, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(comida)
      })

      await verComidaPacienteId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(comida)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await verComidaPacienteId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe el comida'
      })
    })
  })

  describe('actualizarComida', () => {
    it('debería actualizar comida exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const updateData = {
        descripcion: 'Avena con frutas y miel',
        tipoComida: 'Desayuno'
      }

      mockReq.params = { id }
      mockReq.body = updateData

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ComidasPaciente, 'findByIdAndUpdate').mockResolvedValue({
        _id: id,
        ...updateData
      })

      await actualizarComida(mockReq, mockRes)

      expect(ComidasPaciente.findByIdAndUpdate).toHaveBeenCalledWith(id, updateData)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Actualización exitosa del comida'
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }
      mockReq.body = { descripcion: 'Nueva descripción' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await actualizarComida(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe el comida invalid-id'
      })
    })
  })
}) 