import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  generarRecomendacionesComidas, 
  generarRecomendacionesParametros, 
  obtenerRecomendaciones,
  generarRecetasPersonalizadas
} from '../../../src/controllers/Recomendaciones_controller.js'
import Recomendaciones from '../../../src/models/Recomendaciones.js'
import Comida from '../../../src/models/Comida.js'
import ParametrosSalud from '../../../src/models/ParametrosSalud.js'

// Mock de OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Recomendación generada por IA'
            }
          }]
        })
      }
    }
  }))
}))

// Mock de dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn()
  },
  config: vi.fn()
}))

describe('Recomendaciones_controller', () => {
  let mockReq, mockRes

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
    vi.clearAllMocks()
  })

  describe('generarRecomendacionesComidas', () => {
    it('debería generar recomendaciones de comidas exitosamente', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      mockReq.params = { pacienteId }

      const comidas = [
        {
          _id: 'comida1',
          tipoComida: 'desayuno',
          descripcion: 'Avena con frutas',
          createdAt: new Date('2024-01-15T08:00:00Z')
        },
        {
          _id: 'comida2',
          tipoComida: 'almuerzo',
          descripcion: 'Arroz con pollo',
          createdAt: new Date('2024-01-15T12:00:00Z')
        }
      ]

      const nuevaRecomendacion = {
        _id: 'recomendacion123',
        paciente: pacienteId,
        tipo: 'comidas',
        contenido: JSON.stringify({
          desayuno: 'Recomendación para desayuno',
          almuerzo: 'Recomendación para almuerzo'
        })
      }

      vi.spyOn(Recomendaciones, 'countDocuments').mockResolvedValue(0)
      vi.spyOn(Comida, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(comidas)
      })
      vi.spyOn(Recomendaciones, 'create').mockResolvedValue(nuevaRecomendacion)

      await generarRecomendacionesComidas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Recomendación generada exitosamente.'
      })
    })

    it('debería fallar si ya se generaron 3 recomendaciones hoy', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      mockReq.params = { pacienteId }

      vi.spyOn(Recomendaciones, 'countDocuments').mockResolvedValue(3)

      await generarRecomendacionesComidas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Ya has generado el máximo de 3 recomendaciones de comidas para hoy.'
      })
    })

    it('debería fallar si no hay comidas registradas', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      mockReq.params = { pacienteId }

      vi.spyOn(Recomendaciones, 'countDocuments').mockResolvedValue(0)
      vi.spyOn(Comida, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([])
      })

      await generarRecomendacionesComidas(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'No se encontraron comidas registradas para este paciente.'
      })
    })
  })

  describe('generarRecomendacionesParametros', () => {
    it('debería generar recomendaciones de parámetros exitosamente', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      mockReq.params = { pacienteId }

      const parametrosSalud = {
        _id: 'parametro123',
        peso: 70.5,
        estatura: 170,
        nivelActividadFisica: 'moderado',
        enfermedad: 'Ninguna',
        discapacidad: 'Ninguna'
      }

      const nuevaRecomendacion = {
        _id: 'recomendacion123',
        paciente: pacienteId,
        tipo: 'parametros',
        contenido: 'Recomendación generada por IA'
      }

      vi.spyOn(Recomendaciones, 'findOne').mockResolvedValue(null)
      vi.spyOn(ParametrosSalud, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue(parametrosSalud)
      })
      vi.spyOn(Recomendaciones, 'create').mockResolvedValue(nuevaRecomendacion)

      await generarRecomendacionesParametros(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Recomendación generada exitosamente.'
      })
    })

    it('debería fallar si ya existe una recomendación de parámetros para hoy', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      mockReq.params = { pacienteId }

      vi.spyOn(Recomendaciones, 'findOne').mockResolvedValue({
        _id: 'recomendacion123'
      })

      await generarRecomendacionesParametros(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'No puedes generar más recomendaciones de parámetros por hoy.'
      })
    })

    it('debería fallar si no hay parámetros de salud', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      mockReq.params = { pacienteId }

      vi.spyOn(Recomendaciones, 'findOne').mockResolvedValue(null)
      vi.spyOn(ParametrosSalud, 'findOne').mockReturnValue({
        sort: vi.fn().mockResolvedValue(null)
      })

      await generarRecomendacionesParametros(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'No se encontraron parámetros de salud para este paciente.'
      })
    })
  })

  describe('obtenerRecomendaciones', () => {
    it('debería obtener todas las recomendaciones del paciente', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      const recomendaciones = [
        {
          _id: 'recomendacion1',
          tipo: 'comidas',
          contenido: 'Recomendación de comidas',
          createdAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          _id: 'recomendacion2',
          tipo: 'parametros',
          contenido: 'Recomendación de parámetros',
          createdAt: new Date('2024-01-14T10:00:00Z')
        }
      ]

      mockReq.params = { pacienteId }

      vi.spyOn(Recomendaciones, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(recomendaciones)
        })
      })

      await obtenerRecomendaciones(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        recomendaciones
      })
    })

    it('debería obtener recomendaciones filtradas por tipo', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      const recomendaciones = [
        {
          _id: 'recomendacion1',
          tipo: 'comidas',
          contenido: 'Recomendación de comidas',
          createdAt: new Date('2024-01-15T10:00:00Z')
        }
      ]

      mockReq.params = { pacienteId }
      mockReq.query = { tipo: 'comidas' }

      vi.spyOn(Recomendaciones, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(recomendaciones)
        })
      })

      await obtenerRecomendaciones(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith({
        recomendaciones
      })
    })

    it('debería fallar si no hay recomendaciones', async () => {
      const pacienteId = '507f1f77bcf86cd799439011'
      mockReq.params = { pacienteId }

      vi.spyOn(Recomendaciones, 'find').mockReturnValue({
        sort: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue([])
        })
      })

      await obtenerRecomendaciones(mockReq, mockRes)

      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'No se encontraron recomendaciones para este paciente.'
      })
    })
  })
}) 