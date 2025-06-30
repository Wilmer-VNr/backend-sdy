import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  crearCita, 
  confirmarCitaConFecha, 
  listarCitasPaciente, 
  listarCitasNutricionista,
  detalleCita,
  eliminarCita,
  cancelarCita
} from '../../../src/controllers/Cita_controller.js'
import Cita from '../../../src/models/Cita.js'
import Paciente from '../../../src/models/Paciente.js'
import Nutricionista from '../../../src/models/Nutricionista.js'
import mongoose from 'mongoose'

// Mock de nodemailer
vi.mock('../../../src/config/nodemailer.js', () => ({
  sendMailToConfirmCita: vi.fn().mockResolvedValue(true)
}))

// Agrega esto al inicio del archivo, antes de los imports del controlador
vi.mock('../../../src/models/Cita', () => {
  return {
    __esModule: true,
    default: Object.assign(
      vi.fn(), // el constructor
      {
        findOne: vi.fn(),
        findById: vi.fn(),
        find: vi.fn(),
        create: vi.fn()
      }
    )
  }
})

describe('Cita_controller', () => {
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

  describe('crearCita', () => {
    it('debería crear una cita exitosamente sin fecha', async () => {
      const citaData = {
        paciente: '507f1f77bcf86cd799439011',
        nutricionista: '507f1f77bcf86cd799439012',
        modalidad: 'virtual',
        descripcion: 'Consulta nutricional'
      }

      mockReq.body = citaData

      const paciente = {
        _id: citaData.paciente,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com'
      }

      const nutricionista = {
        _id: citaData.nutricionista,
        nombre: 'Dr. Ana',
        apellido: 'García',
        email: 'ana@test.com'
      }

      const nuevaCita = {
        _id: 'cita123',
        ...citaData,
        estado: 'pendiente',
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true)
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockResolvedValue(paciente)
      vi.spyOn(Nutricionista, 'findById').mockResolvedValue(nutricionista)
      vi.spyOn(Cita, 'findOne').mockResolvedValue(null)
      
      // Mock de Cita como función constructora
      Cita.mockImplementation(() => nuevaCita)

      await crearCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Cita solicitada correctamente. El nutricionista confirmará lugar, fecha y hora.',
          cita: expect.objectContaining({
            modalidad: 'virtual',
            estado: 'pendiente',
            paciente: citaData.paciente,
            nutricionista: citaData.nutricionista,
            descripcion: citaData.descripcion
          })
        })
      )
    })

    it('debería fallar con campos obligatorios faltantes', async () => {
      mockReq.body = {
        paciente: '507f1f77bcf86cd799439011',
        nutricionista: '507f1f77bcf86cd799439012'
        // Faltan modalidad y descripcion
      }

      await crearCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, debes llenar todos los campos obligatorios'
      })
    })

    it('debería fallar con IDs inválidos', async () => {
      mockReq.body = {
        paciente: 'invalid-id',
        nutricionista: 'invalid-id',
        modalidad: 'virtual',
        descripcion: 'Consulta'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await crearCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, IDs no válidos'
      })
    })

    it('debería fallar si paciente o nutricionista no existe', async () => {
      mockReq.body = {
        paciente: '507f1f77bcf86cd799439011',
        nutricionista: '507f1f77bcf86cd799439012',
        modalidad: 'virtual',
        descripcion: 'Consulta'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockResolvedValue(null)
      vi.spyOn(Nutricionista, 'findById').mockResolvedValue(null)

      await crearCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, paciente o nutricionista no encontrado'
      })
    })

    it('debería fallar si ya existe una cita activa', async () => {
      mockReq.body = {
        paciente: '507f1f77bcf86cd799439011',
        nutricionista: '507f1f77bcf86cd799439012',
        modalidad: 'virtual',
        descripcion: 'Consulta'
      }

      const citaExistente = {
        _id: 'cita123',
        estado: 'pendiente'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockResolvedValue({ _id: 'paciente123' })
      vi.spyOn(Nutricionista, 'findById').mockResolvedValue({ _id: 'nutri123' })
      vi.spyOn(Cita, 'findOne').mockResolvedValue(citaExistente)

      await crearCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Ya tienes una cita activa. Cancela o completa la actual antes de agendar otra.'
      })
    })
  })

  describe('confirmarCitaConFecha', () => {
    it('debería confirmar cita virtual exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const confirmacionData = {
        fecha: '2024-01-15T10:00:00Z',
        linkReunion: 'https://meet.google.com/test'
      }

      mockReq.params = { id }
      mockReq.body = confirmacionData

      const cita = {
        _id: id,
        modalidad: 'virtual',
        paciente: {
          email: 'juan@test.com',
          nombre: 'Juan'
        },
        nutricionista: {
          nombre: 'Dr. Ana',
          apellido: 'García'
        },
        descripcion: 'Consulta nutricional',
        save: vi.fn().mockResolvedValue(true)
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(cita)
      })

      await confirmarCitaConFecha(mockReq, mockRes)

      expect(cita.fecha).toBe(confirmacionData.fecha)
      expect(cita.linkReunion).toBe(confirmacionData.linkReunion)
      expect(cita.estado).toBe('confirmada')
      expect(cita.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Cita confirmada correctamente',
        cita
      })
    })

    it('debería confirmar cita presencial exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const confirmacionData = {
        fecha: '2024-01-15T10:00:00Z',
        lugar: 'Consultorio 123'
      }

      mockReq.params = { id }
      mockReq.body = confirmacionData

      const cita = {
        _id: id,
        modalidad: 'presencial',
        paciente: {
          email: 'juan@test.com',
          nombre: 'Juan'
        },
        nutricionista: {
          nombre: 'Dr. Ana',
          apellido: 'García'
        },
        descripcion: 'Consulta nutricional',
        save: vi.fn().mockResolvedValue(true)
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(cita)
      })

      await confirmarCitaConFecha(mockReq, mockRes)

      expect(cita.fecha).toBe(confirmacionData.fecha)
      expect(cita.lugar).toBe(confirmacionData.lugar)
      expect(cita.estado).toBe('confirmada')
      expect(cita.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }
      mockReq.body = { fecha: '2024-01-15T10:00:00Z' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await confirmarCitaConFecha(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Id de cita no válido'
      })
    })

    it('debería fallar si cita no existe', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }
      mockReq.body = { fecha: '2024-01-15T10:00:00Z' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await confirmarCitaConFecha(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Cita no encontrada'
      })
    })

    it('debería fallar sin fecha', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }
      mockReq.body = {}

      const cita = {
        _id: 'cita123',
        modalidad: 'virtual'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(cita)
      })

      await confirmarCitaConFecha(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Debes ingresar la fecha y hora de la cita'
      })
    })

    it('debería fallar con cita virtual sin link', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }
      mockReq.body = { fecha: '2024-01-15T10:00:00Z' }

      const cita = {
        _id: 'cita123',
        modalidad: 'virtual'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(cita)
      })

      await confirmarCitaConFecha(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Para citas virtuales es necesario proporcionar el link de la reunión'
      })
    })

    it('debería fallar con cita presencial sin lugar', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }
      mockReq.body = { fecha: '2024-01-15T10:00:00Z' }

      const cita = {
        _id: 'cita123',
        modalidad: 'presencial'
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(cita)
      })

      await confirmarCitaConFecha(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Para citas presenciales debes indicar el lugar de la cita'
      })
    })
  })

  describe('listarCitasPaciente', () => {
    it('debería listar citas del paciente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const citas = [
        { _id: 'cita1', fecha: '2024-01-15T10:00:00Z' },
        { _id: 'cita2', fecha: '2024-01-20T10:00:00Z' }
      ]

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(citas)
        })
      })

      await listarCitasPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(citas)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await listarCitasPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, el ID invalid-id no es válido'
      })
    })
  })

  describe('listarCitasNutricionista', () => {
    it('debería listar citas del nutricionista', async () => {
      const id = '507f1f77bcf86cd799439011'
      const citas = [
        { _id: 'cita1', fecha: '2024-01-15T10:00:00Z' },
        { _id: 'cita2', fecha: '2024-01-20T10:00:00Z' }
      ]

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'find').mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockResolvedValue(citas)
        })
      })

      await listarCitasNutricionista(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(citas)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await listarCitasNutricionista(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, el ID invalid-id no es válido'
      })
    })
  })

  describe('detalleCita', () => {
    it('debería obtener detalle de la cita', async () => {
      const id = '507f1f77bcf86cd799439011'
      const cita = {
        _id: id,
        fecha: '2024-01-15T10:00:00Z',
        modalidad: 'virtual',
        estado: 'confirmada'
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(cita)
      })

      await detalleCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(cita)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await detalleCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'ID de cita no válido'
      })
    })

    it('debería fallar si cita no existe', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      })

      await detalleCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Cita no encontrada'
      })
    })
  })

  describe('eliminarCita', () => {
    it('debería eliminar cita exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const cita = {
        _id: id,
        deleteOne: vi.fn().mockResolvedValue(true)
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockResolvedValue(cita)

      await eliminarCita(mockReq, mockRes)

      expect(cita.deleteOne).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Cita eliminada correctamente'
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await eliminarCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'ID no válido'
      })
    })

    it('debería fallar si cita no existe', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockResolvedValue(null)

      await eliminarCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Cita no encontrada'
      })
    })
  })

  describe('cancelarCita', () => {
    it('debería cancelar cita exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const cita = {
        _id: id,
        estado: 'confirmada',
        save: vi.fn().mockResolvedValue(true)
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockResolvedValue(cita)

      await cancelarCita(mockReq, mockRes)

      expect(cita.estado).toBe('cancelada')
      expect(cita.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'La cita ha sido cancelada correctamente',
        cita
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await cancelarCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'ID de cita no válido'
      })
    })

    it('debería fallar si cita no existe', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockResolvedValue(null)

      await cancelarCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Cita no encontrada'
      })
    })

    it('debería fallar si cita ya está cancelada', async () => {
      const id = '507f1f77bcf86cd799439011'
      const cita = {
        _id: id,
        estado: 'cancelada'
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Cita, 'findById').mockResolvedValue(cita)

      await cancelarCita(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'La cita ya está cancelada'
      })
    })
  })
}) 