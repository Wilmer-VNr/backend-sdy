import { describe, it, expect, beforeEach, vi } from 'vitest'
import { login, recuperarPassword, comprobarTokenPassword, crearNuevoPassword } from '../../../src/controllers/AuthController.js'
import Paciente from '../../../src/models/Paciente.js'
import Nutricionista from '../../../src/models/Nutricionista.js'

// Mock de nodemailer
vi.mock('../../../src/config/nodemailer.js', () => ({
  sendMailToRecoveryPassword: vi.fn().mockResolvedValue(true)
}))

// Mock de JWT
vi.mock('../../../src/middlewares/JWT.js', () => ({
  crearTokenJWT: vi.fn().mockReturnValue('mock-jwt-token')
}))

describe('AuthController', () => {
  let mockReq, mockRes

  beforeEach(() => {
    mockReq = {
      body: {}
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('login', () => {
    it('debería hacer login exitoso de un paciente', async () => {
      const pacienteData = {
        _id: 'paciente123',
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@test.com',
        password: 'password123',
        confirmEmail: true,
        status: true,
        matchPassword: vi.fn().mockResolvedValue(true)
      }

      mockReq.body = {
        email: 'juan@test.com',
        password: 'password123'
      }

      vi.spyOn(Paciente, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(pacienteData)
      })
      vi.spyOn(Nutricionista, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        user: {
          _id: 'paciente123',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          rol: 'paciente',
          edad: undefined,
          direccion: undefined,
          celular: undefined
        }
      })
    })

    it('debería hacer login exitoso de un nutricionista', async () => {
      const nutricionistaData = {
        _id: 'nut123',
        nombre: 'Dr. Ana',
        apellido: 'García',
        email: 'ana@test.com',
        password: 'password123',
        status: true,
        matchPassword: vi.fn().mockResolvedValue(true)
      }

      mockReq.body = {
        email: 'ana@test.com',
        password: 'password123'
      }

      vi.spyOn(Paciente, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })
      vi.spyOn(Nutricionista, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(nutricionistaData)
      })

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        token: 'mock-jwt-token',
        user: {
          _id: 'nut123',
          nombre: 'Dr. Ana',
          apellido: 'García',
          email: 'ana@test.com',
          rol: 'nutricionista'
        }
      })
    })

    it('debería fallar con campos vacíos', async () => {
      mockReq.body = {}

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Todos los campos son obligatorios'
      })
    })

    it('debería fallar con usuario no encontrado', async () => {
      mockReq.body = {
        email: 'noexiste@test.com',
        password: 'password123'
      }

      vi.spyOn(Paciente, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })
      vi.spyOn(Nutricionista, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Usuario no encontrado'
      })
    })

    it('debería fallar con email no confirmado (paciente)', async () => {
      const pacienteData = {
        _id: 'paciente123',
        nombre: 'Juan',
        email: 'juan@test.com',
        confirmEmail: false,
        status: true,
        matchPassword: vi.fn().mockResolvedValue(true)
      }

      mockReq.body = {
        email: 'juan@test.com',
        password: 'password123'
      }

      vi.spyOn(Paciente, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(pacienteData)
      })
      vi.spyOn(Nutricionista, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Por favor confirma tu email antes de iniciar sesión'
      })
    })

    it('debería fallar con cuenta desactivada', async () => {
      const pacienteData = {
        _id: 'paciente123',
        nombre: 'Juan',
        email: 'juan@test.com',
        confirmEmail: true,
        status: false,
        matchPassword: vi.fn().mockResolvedValue(true)
      }

      mockReq.body = {
        email: 'juan@test.com',
        password: 'password123'
      }

      vi.spyOn(Paciente, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(pacienteData)
      })
      vi.spyOn(Nutricionista, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Tu cuenta ha sido desactivada.'
      })
    })

    it('debería fallar con password incorrecto', async () => {
      const pacienteData = {
        _id: 'paciente123',
        nombre: 'Juan',
        email: 'juan@test.com',
        confirmEmail: true,
        status: true,
        matchPassword: vi.fn().mockResolvedValue(false)
      }

      mockReq.body = {
        email: 'juan@test.com',
        password: 'wrongpassword'
      }

      vi.spyOn(Paciente, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(pacienteData)
      })
      vi.spyOn(Nutricionista, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      })

      await login(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Credenciales incorrectas'
      })
    })
  })

  describe('recuperarPassword', () => {
    it('debería enviar email de recuperación para paciente', async () => {
      const pacienteData = {
        _id: 'paciente123',
        email: 'juan@test.com',
        crearToken: vi.fn().mockReturnValue('mock-token'),
        token: null,
        save: vi.fn().mockResolvedValue(true)
      }

      mockReq.body = { email: 'juan@test.com' }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(pacienteData)
      vi.spyOn(Nutricionista, 'findOne').mockResolvedValue(null)

      await recuperarPassword(mockReq, mockRes)

      expect(pacienteData.crearToken).toHaveBeenCalled()
      expect(pacienteData.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        msg: 'Revisa tu correo electrónico para reestablecer tu cuenta (paciente)'
      })
    })

    it('debería fallar con email no proporcionado', async () => {
      mockReq.body = {}

      await recuperarPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'El campo email es obligatorio'
      })
    })

    it('debería fallar con usuario no encontrado', async () => {
      mockReq.body = { email: 'noexiste@test.com' }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(null)
      vi.spyOn(Nutricionista, 'findOne').mockResolvedValue(null)

      await recuperarPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'El usuario no está registrado'
      })
    })
  })

  describe('comprobarTokenPassword', () => {
    it('debería confirmar token válido de paciente', async () => {
      const token = 'valid-token'
      const pacienteData = {
        _id: 'paciente123',
        token: 'valid-token'
      }

      mockReq.params = { token }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(pacienteData)
      vi.spyOn(Nutricionista, 'findOne').mockResolvedValue(null)

      await comprobarTokenPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        msg: 'Token confirmado, ya puedes crear tu nuevo password (paciente)'
      })
    })

    it('debería fallar con token no proporcionado', async () => {
      mockReq.params = {}

      await comprobarTokenPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'El token es obligatorio'
      })
    })

    it('debería fallar con token inválido', async () => {
      mockReq.params = { token: 'invalid-token' }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(null)
      vi.spyOn(Nutricionista, 'findOne').mockResolvedValue(null)

      await comprobarTokenPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Token inválido o usuario no encontrado'
      })
    })
  })

  describe('crearNuevoPassword', () => {
    it('debería crear nuevo password exitosamente', async () => {
      const token = 'valid-token'
      const pacienteData = {
        _id: 'paciente123',
        token: 'valid-token',
        password: 'old-password',
        encrypPassword: vi.fn().mockResolvedValue('new-hashed-password'),
        save: vi.fn().mockResolvedValue(true)
      }

      mockReq.params = { token }
      mockReq.body = {
        password: 'new-password',
        confirmpassword: 'new-password'
      }

      vi.spyOn(Paciente, 'findOne').mockResolvedValue(pacienteData)
      vi.spyOn(Nutricionista, 'findOne').mockResolvedValue(null)

      await crearNuevoPassword(mockReq, mockRes)

      expect(pacienteData.encrypPassword).toHaveBeenCalledWith('new-password')
      expect(pacienteData.save).toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        msg: 'Contraseña actualizada correctamente (paciente)'
      })
    })

    it('debería fallar con campos vacíos', async () => {
      mockReq.params = { token: 'valid-token' }
      mockReq.body = {}

      await crearNuevoPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Todos los campos son obligatorios'
      })
    })

    it('debería fallar con passwords que no coinciden', async () => {
      mockReq.params = { token: 'valid-token' }
      mockReq.body = {
        password: 'new-password',
        confirmpassword: 'different-password'
      }

      await crearNuevoPassword(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        msg: 'Las contraseñas no coinciden'
      })
    })
  })
}) 