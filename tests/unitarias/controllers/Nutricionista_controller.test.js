import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  perfil, 
  actualizarPerfil, 
  actualizarPassword,
  listarTodosLosPacientes,
  obtenerPacientePorId,
  bloquearPaciente
} from '../../../src/controllers/Nutricionista_controller.js'
import Nutricionista from '../../../src/models/Nutricionista.js'
import Paciente from '../../../src/models/Paciente.js'
import mongoose from 'mongoose'

describe('Nutricionista_controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      nutricionistaBDD: {},
      user: { rol: 'nutricionista' }
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    vi.clearAllMocks()
  })

  describe('perfil', () => {
    it('debería retornar perfil del nutricionista sin datos sensibles', async () => {
      const nutricionistaData = {
        _id: 'nutri123',
        nombre: 'Dr. Ana',
        apellido: 'García',
        email: 'ana@test.com',
        especialidad: 'Nutrición Clínica',
        token: 'sensitive-token',
        confirmEmail: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        __v: 0
      }

      mockReq.nutricionistaBDD = { ...nutricionistaData }

      await perfil(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        _id: 'nutri123',
        nombre: 'Dr. Ana',
        apellido: 'García',
        email: 'ana@test.com',
        especialidad: 'Nutrición Clínica'
      })
    })
  })

  describe('actualizarPerfil', () => {
    it('debería actualizar perfil exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const updateData = {
        nombre: 'Dr. Ana Actualizada',
        apellido: 'García',
        especialidad: 'Nutrición Deportiva',
        experiencia: '6 años',
        email: 'ana.nueva@test.com'
      }

      mockReq.params = { id }
      mockReq.body = updateData

      const mockNutricionista = {
        _id: id,
        ...updateData,
        save: vi.fn().mockResolvedValue(true)
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Nutricionista, 'findById').mockResolvedValue(mockNutricionista)
      vi.spyOn(Nutricionista, 'findOne').mockResolvedValue(null)

      await actualizarPerfil(mockReq, mockRes)

      expect(mockNutricionista.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockNutricionista)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }
      mockReq.body = { nombre: 'Dr. Ana' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await actualizarPerfil(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, debe ser un id válido'
      })
    })

    it('debería fallar con campos vacíos', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }
      mockReq.body = { nombre: '' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)

      await actualizarPerfil(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, debes llenar todos los campos'
      })
    })
  })

  describe('actualizarPassword', () => {
    it('debería actualizar password exitosamente', async () => {
      const nutricionistaData = {
        _id: 'nutri123',
        matchPassword: vi.fn().mockResolvedValue(true),
        encrypPassword: vi.fn().mockResolvedValue('new-hashed-password'),
        save: vi.fn().mockResolvedValue(true)
      }

      mockReq.nutricionistaBDD = { _id: 'nutri123' }
      mockReq.body = {
        passwordactual: 'old-password',
        passwordnuevo: 'new-password'
      }

      vi.spyOn(Nutricionista, 'findById').mockResolvedValue(nutricionistaData)

      await actualizarPassword(mockReq, mockRes)

      expect(nutricionistaData.matchPassword).toHaveBeenCalledWith('old-password')
      expect(nutricionistaData.encrypPassword).toHaveBeenCalledWith('new-password')
      expect(nutricionistaData.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Password actualizado correctamente'
      })
    })

    it('debería fallar con password actual incorrecto', async () => {
      const nutricionistaData = {
        _id: 'nutri123',
        matchPassword: vi.fn().mockResolvedValue(false)
      }

      mockReq.nutricionistaBDD = { _id: 'nutri123' }
      mockReq.body = {
        passwordactual: 'wrong-password',
        passwordnuevo: 'new-password'
      }

      vi.spyOn(Nutricionista, 'findById').mockResolvedValue(nutricionistaData)

      await actualizarPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, el password actual no es el correcto'
      })
    })
  })

  describe('listarTodosLosPacientes', () => {
    it('debería listar todos los pacientes activos', async () => {
      const pacientes = [
        { _id: 'pac1', nombre: 'Juan', status: true },
        { _id: 'pac2', nombre: 'María', status: true }
      ]

      vi.spyOn(Paciente, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(pacientes)
        })
      })

      await listarTodosLosPacientes(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        pacientes
      })
    })

    it('debería fallar si no es nutricionista', async () => {
      mockReq.user.rol = 'paciente'

      await listarTodosLosPacientes(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'No autorizado. Solo nutricionistas pueden acceder a esta función'
      })
    })
  })

  describe('obtenerPacientePorId', () => {
    it('debería obtener paciente por ID exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const paciente = {
        _id: id,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com'
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(paciente)
        })
      })

      await obtenerPacientePorId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        paciente
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await obtenerPacientePorId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'ID de paciente no válido'
      })
    })

    it('debería fallar si no es nutricionista', async () => {
      mockReq.user.rol = 'paciente'
      mockReq.params = { id: '507f1f77bcf86cd799439011' }

      await obtenerPacientePorId(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'No autorizado. Solo nutricionistas pueden acceder a esta función'
      })
    })
  })

  describe('bloquearPaciente', () => {
    it('debería bloquear paciente exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const paciente = {
        _id: id,
        nombre: 'Juan',
        status: true
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findOne').mockResolvedValue(paciente)
      vi.spyOn(Paciente, 'findByIdAndUpdate').mockResolvedValue({
        ...paciente,
        status: false
      })

      await bloquearPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        msg: 'Paciente bloqueado correctamente',
        paciente: {
          ...paciente,
          status: false
        }
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await bloquearPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'ID de paciente no válido'
      })
    })

    it('debería fallar si no es nutricionista', async () => {
      mockReq.user.rol = 'paciente'
      mockReq.params = { id: '507f1f77bcf86cd799439011' }

      await bloquearPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Acceso denegado. Requiere rol de nutricionista'
      })
    })

    it('debería fallar si paciente no existe', async () => {
      const id = '507f1f77bcf86cd799439011'
      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findOne').mockResolvedValue(null)

      await bloquearPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Paciente no encontrado'
      })
    })
  })
}) 