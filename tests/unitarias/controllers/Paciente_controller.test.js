import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  registro, 
  confirmarMail, 
  perfil, 
  actualizarPerfil, 
  actualizarPassword,
  listarPacientes,
  detallePaciente,
  eliminarPaciente,
  detalleParametrosPaciente,
  detalleComidasPaciente,
  listarNutricionistas,
  actualizarAvatar
} from '../../../src/controllers/Paciente_controller.js'
import Paciente from '../../../src/models/Paciente.js'
import Nutricionista from '../../../src/models/Nutricionista.js'
import ParametrosSalud from '../../../src/models/ParametrosSalud.js'
import Comida from '../../../src/models/Comida.js'
import mongoose from 'mongoose'

// Mock de cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: 'https://cloudinary.com/test-image.jpg',
        public_id: 'test-public-id'
      }),
      destroy: vi.fn().mockResolvedValue(true)
    }
  }
}))

// Mock de fs-extra
vi.mock('fs-extra', () => ({
  default: {
    unlink: vi.fn().mockResolvedValue(true)
  },
  unlink: vi.fn().mockResolvedValue(true)
}))

// Mock de nodemailer
vi.mock('../../../src/config/nodemailer.js', () => ({
  sendMailToRegister: vi.fn().mockResolvedValue(true),
  sendMailToRecoveryPassword: vi.fn().mockResolvedValue(true)
}))

// Mock de JWT
vi.mock('../../../src/middlewares/JWT.js', () => ({
  crearTokenJWT: vi.fn().mockReturnValue('mock-jwt-token')
}))

describe('Paciente_controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      pacienteBDD: {},
      nutricionistaBDD: {},
      files: {}
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    vi.clearAllMocks()
  })

  describe('registro', () => {
    it('debería registrar un nuevo paciente exitosamente', async () => {
      const pacienteData = {
        email: 'test@test.com',
        password: 'password123',
        nombre: 'Juan',
        apellido: 'Pérez',
        edad: 25,
        direccion: 'Calle Test 123',
        celular: '123456789'
      }

      mockReq.body = pacienteData
      mockReq.files = {
        imagen: {
          tempFilePath: '/tmp/test-image.jpg'
        }
      }

      const mockPaciente = {
        ...pacienteData,
        encrypPassword: vi.fn().mockResolvedValue('hashed-password'),
        crearToken: vi.fn().mockReturnValue('mock-token'),
        save: vi.fn().mockResolvedValue(true)
      }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(null)
      
      // Mock del constructor de Paciente
      const mockPacienteConstructor = vi.fn().mockImplementation(() => mockPaciente)
      vi.spyOn(Paciente, 'constructor').mockImplementation(mockPacienteConstructor)

      await registro(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Revisa tu correo electrónico para confirmar tu cuenta'
      })
    })

    it('debería fallar con campos vacíos', async () => {
      mockReq.body = {
        email: '',
        password: 'password123'
      }

      await registro(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, debes llenar todos los campos'
      })
    })

    it('debería fallar con email ya registrado', async () => {
      mockReq.body = {
        email: 'existente@test.com',
        password: 'password123'
      }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue({ email: 'existente@test.com' })

      await registro(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, el email ya se encuentra registrado'
      })
    })
  })

  describe('confirmarMail', () => {
    it('debería confirmar email exitosamente', async () => {
      const token = 'valid-token'
      mockReq.params = { token }

      const mockPaciente = {
        token,
        confirmEmail: false,
        save: vi.fn().mockResolvedValue(true)
      }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(mockPaciente)

      await confirmarMail(mockReq, mockRes)

      expect(mockPaciente.token).toBeNull()
      expect(mockPaciente.confirmEmail).toBe(true)
      expect(mockPaciente.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Token confirmado, ya puedes iniciar sesión'
      })
    })

    it('debería fallar sin token', async () => {
      mockReq.params = {}

      await confirmarMail(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no se puede validar la cuenta'
      })
    })

    it('debería fallar con cuenta ya confirmada', async () => {
      mockReq.params = { token: 'valid-token' }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(null)

      await confirmarMail(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'La cuenta ya ha sido confirmada'
      })
    })
  })

  describe('perfil', () => {
    it('debería retornar perfil del paciente sin datos sensibles', async () => {
      const pacienteData = {
        _id: 'paciente123',
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com',
        token: 'sensitive-token',
        confirmEmail: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        __v: 0
      }

      mockReq.pacienteBDD = { ...pacienteData }

      await perfil(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        _id: 'paciente123',
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com'
      })
    })
  })

  describe('actualizarPerfil', () => {
    it('debería actualizar perfil exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const updateData = {
        nombre: 'Juan Actualizado',
        apellido: 'Pérez',
        edad: 26,
        direccion: 'Nueva Dirección',
        celular: '987654321',
        email: 'juan.nuevo@test.com'
      }

      mockReq.params = { id }
      mockReq.body = updateData

      const mockPaciente = {
        _id: id,
        ...updateData,
        save: vi.fn().mockResolvedValue(true)
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockResolvedValue(mockPaciente)
      vi.spyOn(Paciente, 'findOne').mockResolvedValue(null)

      await actualizarPerfil(mockReq, mockRes)

      expect(mockPaciente.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockPaciente)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }
      mockReq.body = { nombre: 'Juan' }

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
      const pacienteData = {
        _id: 'paciente123',
        matchPassword: vi.fn().mockResolvedValue(true),
        encrypPassword: vi.fn().mockResolvedValue('new-hashed-password'),
        save: vi.fn().mockResolvedValue(true)
      }

      mockReq.pacienteBDD = { _id: 'paciente123' }
      mockReq.body = {
        passwordactual: 'old-password',
        passwordnuevo: 'new-password'
      }

      vi.spyOn(Paciente, 'findById').mockResolvedValue(pacienteData)

      await actualizarPassword(mockReq, mockRes)

      expect(pacienteData.matchPassword).toHaveBeenCalledWith('old-password')
      expect(pacienteData.encrypPassword).toHaveBeenCalledWith('new-password')
      expect(pacienteData.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Password actualizado correctamente'
      })
    })

    it('debería fallar con password actual incorrecto', async () => {
      const pacienteData = {
        _id: 'paciente123',
        matchPassword: vi.fn().mockResolvedValue(false)
      }

      mockReq.pacienteBDD = { _id: 'paciente123' }
      mockReq.body = {
        passwordactual: 'wrong-password',
        passwordnuevo: 'new-password'
      }

      vi.spyOn(Paciente, 'findById').mockResolvedValue(pacienteData)

      await actualizarPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, el password actual no es el correcto'
      })
    })
  })

  describe('listarPacientes', () => {
    it('debería listar pacientes del nutricionista', async () => {
      const nutricionistaId = 'nut123'
      const pacientes = [
        { _id: 'pac1', nombre: 'Juan', nutricionista: nutricionistaId },
        { _id: 'pac2', nombre: 'María', nutricionista: nutricionistaId }
      ]

      mockReq.nutricionistaBDD = { _id: nutricionistaId }

      vi.spyOn(Paciente, 'find').mockReturnValue({
        where: vi.fn().mockReturnValue({
          equals: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(pacientes)
            })
          })
        })
      })

      await listarPacientes(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(pacientes)
    })
  })

  describe('detallePaciente', () => {
    it('debería obtener detalle del paciente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const paciente = {
        _id: id,
        nombre: 'Juan',
        apellido: 'Pérez'
      }

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockReturnValue({
        select: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(paciente)
        })
      })

      await detallePaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(paciente)
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await detallePaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe el nutricionista invalid-id'
      })
    })
  })

  describe('eliminarPaciente', () => {
    it('debería eliminar paciente exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      mockReq.params = { id }
      mockReq.body = { motivo: 'Motivo de eliminación' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)

      await eliminarPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Se elimino paciente exitosamente'
      })
    })

    it('debería fallar con campos vacíos', async () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' }
      mockReq.body = { motivo: '' }

      await eliminarPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, debes llenar todos los campos'
      })
    })
  })

  describe('detalleParametrosPaciente', () => {
    it('debería obtener parámetros de salud del paciente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const paciente = { _id: id, nombre: 'Juan' }
      const parametros = [
        { _id: 'param1', peso: 70, altura: 170 },
        { _id: 'param2', peso: 71, altura: 170 }
      ]

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(paciente)
      })
      vi.spyOn(ParametrosSalud, 'find').mockReturnValue({
        where: vi.fn().mockReturnValue({
          equals: vi.fn().mockResolvedValue(parametros)
        })
      })

      await detalleParametrosPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        paciente,
        parametros
      })
    })
  })

  describe('detalleComidasPaciente', () => {
    it('debería obtener comidas del paciente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const paciente = { _id: id, nombre: 'Juan' }
      const comidas = [
        { _id: 'comida1', nombre: 'Desayuno', calorias: 300 },
        { _id: 'comida2', nombre: 'Almuerzo', calorias: 500 }
      ]

      mockReq.params = { id }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue(paciente)
      })
      vi.spyOn(Comida, 'find').mockReturnValue({
        where: vi.fn().mockReturnValue({
          equals: vi.fn().mockResolvedValue(comidas)
        })
      })

      await detalleComidasPaciente(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        paciente,
        comidas
      })
    })
  })

  describe('listarNutricionistas', () => {
    it('debería listar nutricionistas activos', async () => {
      const nutricionistas = [
        { _id: 'nut1', nombre: 'Dr. Ana', apellido: 'García' },
        { _id: 'nut2', nombre: 'Dr. Carlos', apellido: 'López' }
      ]

      vi.spyOn(Nutricionista, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(nutricionistas)
        })
      })

      await listarNutricionistas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(nutricionistas)
    })
  })

  describe('actualizarAvatar', () => {
    it('debería actualizar avatar exitosamente', async () => {
      const id = '507f1f77bcf86cd799439011'
      const paciente = {
        _id: id,
        avatar: 'old-avatar.jpg',
        avatarID: 'old-public-id'
      }

      mockReq.params = { id }
      mockReq.files = {
        imagen: {
          tempFilePath: '/tmp/new-image.jpg'
        }
      }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)
      vi.spyOn(Paciente, 'findById').mockResolvedValue(paciente)
      vi.spyOn(Paciente, 'findByIdAndUpdate').mockResolvedValue({
        ...paciente,
        avatar: 'https://cloudinary.com/test-image.jpg'
      })

      await actualizarAvatar(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Avatar actualizado correctamente',
        avatar: 'https://cloudinary.com/test-image.jpg'
      })
    })

    it('debería fallar sin imagen', async () => {
      const id = '507f1f77bcf86cd799439011'
      mockReq.params = { id }
      mockReq.files = {}

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(true)

      await actualizarAvatar(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'No se ha proporcionado ninguna imagen'
      })
    })

    it('debería fallar con ID inválido', async () => {
      mockReq.params = { id: 'invalid-id' }

      vi.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValue(false)

      await actualizarAvatar(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Lo sentimos, no existe el paciente invalid-id'
      })
    })
  })
}) 