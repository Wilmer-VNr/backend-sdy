import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  registrarParametroSalud, 
  eliminarParametro, 
  verParametroId, 
  actualizarParametro 
} from '../../../src/controllers/parametrosSalud_controller.js'
import ParametroSalud from '../../../src/models/ParametrosSalud.js'
import mongoose from 'mongoose'

describe('parametrosSalud_controller', () => {
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

  describe('registrarParametroSalud', () => {
    it('debería registrar un parámetro de salud exitosamente', async () => {
      const parametroData = {
        paciente: '507f1f77bcf86cd799439011',
        peso: 70.5,
        estatura: 170,
        nivelActividadFisica: 'Moderado',
        enfermedad: 'Diabetes',
        discapacidad: ''
      }

      mockReq.body = parametroData

      const nuevoParametro = {
        _id: 'parametro123',
        ...parametroData,
        fecha: new Date()
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ParametroSalud, 'create').mockResolvedValue(nuevoParametro)

      await registrarParametroSalud(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Registro de parametros exitosamente parametro123',
        nuevoParametro
      })
    })

    it('debería fallar con ID de paciente inválido', async () => {
      mockReq.body = {
        paciente: 'invalid-id',
        peso: 70.5
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await registrarParametroSalud(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, debe ser un id válido'
      })
    })
  })

  describe('eliminarParametro', () => {
    it('debería eliminar parámetro exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ParametroSalud, 'findByIdAndDelete').mockResolvedValue({ _id: id })

      await eliminarParametro(mockReq, mockRes)

      expect(ParametroSalud.findByIdAndDelete).toHaveBeenCalledWith(id)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Parametro de salud eliminado exitosamente'
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await eliminarParametro(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe'
      })
    })
  })

  describe('verParametroId', () => {
    it('debería obtener parámetro por ID exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const parametro = {
        _id: id,
        peso: 70.5,
        estatura: 170,
        nivelActividadFisica: 'Moderado',
        enfermedad: 'Diabetes',
        discapacidad: '',
        paciente: {
          _id: 'paciente123',
          nombre: 'Juan'
        }
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ParametroSalud, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(parametro)
      })

      await verParametroId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(parametro)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await verParametroId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe el parametro'
      })
    })

    it('debería fallar si parámetro no existe', async () => {
      const id = '507f1f77bcf86cd799439011'
      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ParametroSalud, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await verParametroId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Parámetro de salud no encontrado'
      })
    })
  })

  describe('actualizarParametro', () => {
    it('debería actualizar parámetro exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const updateData = {
        peso: 71.0,
        estatura: 170,
        nivelActividadFisica: 'Alto'
      }

      mockReq.params = { id }
      mockReq.body = updateData

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(ParametroSalud, 'findByIdAndUpdate').mockResolvedValue({
        _id: id,
        ...updateData
      })

      await actualizarParametro(mockReq, mockRes)

      expect(ParametroSalud.findByIdAndUpdate).toHaveBeenCalledWith(id, updateData)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Actualización exitosa del parametro'
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }
      mockReq.body = { peso: 71.0 }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await actualizarParametro(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe el parametro invalid-id'
      })
    })
  })
}) 