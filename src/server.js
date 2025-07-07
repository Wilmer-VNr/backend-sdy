// Requerir los módulos
import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors';
import routerPacientes from './routers/Paciente_routes.js'
import routerNutricionista from './routers/Nutricionista_routes.js'
import authRoutes from './routers/Auth_routes.js';
import routerComidas from './routers/comida_routes.js';
import routerParametrosSalud from './routers/parametrosSalud_routes.js';
import routerRecomendacion from './routers/recomendaciones_routes.js';
import routerCitas from './routers/cita_routes.js';

import cloudinary from 'cloudinary'
import fileUpload from "express-fileupload"

// Inicializaciones
const app = express()
dotenv.config()

// Configuraciones 
app.set('port',process.env.port || 3000)
app.use(cors({
    origin: [
      'http://localhost:5173',            
      'https://frontendsdy.vercel.app'    
    ],
    credentials: true                     
  }));
  

// Middlewares 
app.use(express.json())

// Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : './uploads'
}))


// Ruta principal
app.get('/',(req,res)=>{
    res.send("Server on")
})

app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`)
  next()
})

// Rutas
app.use('/api',authRoutes)
app.use('/api',routerPacientes)
app.use('/api', routerNutricionista)
app.use('/api', routerParametrosSalud)
app.use('/api', routerComidas)
app.use('/api',routerRecomendacion)
app.use('/api', routerCitas)

// Manejo de una ruta que no sea encontrada
app.use((req,res)=>res.status(404).send("Endpoint no encontrado - 404"))

export default  app
