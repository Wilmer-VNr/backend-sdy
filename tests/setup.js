import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

let mongod

// Configurar MongoDB Memory Server
beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  
  // Conectar a la base de datos en memoria
  await mongoose.connect(uri)
})

// Limpiar la base de datos después de cada prueba
afterEach(async () => {
  const collections = mongoose.connection.collections
  
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany()
  }
})

// Cerrar conexión después de todas las pruebas
afterAll(async () => {
  await mongoose.connection.close()
  await mongod.stop()
})

// Configurar variables de entorno para pruebas
process.env.JWT_SECRET = 'test-secret-key'
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud'
process.env.CLOUDINARY_API_KEY = 'test-key'
process.env.CLOUDINARY_API_SECRET = 'test-secret'
process.env.MONGODB_URI_PRODUCTION = 'mongodb://localhost:27017/test' 