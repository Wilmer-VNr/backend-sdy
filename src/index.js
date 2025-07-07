import app from './server.js';
import connection from './database.js';
import http from 'http';
import { Server } from 'socket.io';
import Mensaje from './models/Mensajes.js';

connection();

const server = http.createServer(app);

// Configuración de Socket.io con CORS
const io = new Server(server, {
  cors: {
    origin: [
      "https://frontendsdy.vercel.app",  
      "http://localhost:5173"           
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type","Authorization"],  
    credentials: true
  }
});

  io.on('connection', (socket) => {
      
    // Unirse a una sala privada 
    socket.on('unirse-sala', (userId) => {
      socket.join(userId);
      
      
    });
  
    // mensajes privados
    socket.on('mensaje-privado', async ({ emisorId, receptorId, contenido }) => {
      try {
        // Guardar el mensaje
        const nuevoMensaje = new Mensaje({
          emisor: emisorId,
          emisorModel: emisorId.startsWith('nut_') ? 'Nutricionista' : 'Paciente',
          receptor: receptorId,
          receptorModel: receptorId.startsWith('nut_') ? 'Nutricionista' : 'Paciente',
          contenido
        });
        
        await nuevoMensaje.save();
  
        // Emitir el mensaje solo al receptor
        socket.to(receptorId).emit('mensaje-privado', {
          emisor: emisorId,
          contenido,
          fecha: new Date()
        });
  
        // emitir al emisor para confirmación
        socket.emit('mensaje-privado-confirmacion', {
          receptor: receptorId,
          contenido,
          fecha: new Date()
        });
  
      } catch (error) {
        console.error('Error al guardar mensaje:', error);
        socket.emit('error-mensaje', {
          mensaje: 'Error al enviar el mensaje'
        });
      }
    });
  
    // historial de mensajes
    socket.on('cargar-historial', async ({ usuarioId, contactoId }) => {
      try {
        const mensajes = await Mensaje.find({
          $or: [
            { emisor: usuarioId, receptor: contactoId },
            { emisor: contactoId, receptor: usuarioId }
          ]
        }).sort('createdAt').limit(50);
  
        socket.emit('historial-cargado', mensajes);
      } catch (error) {
        console.error('Error al cargar historial:', error);
      }
    });
  });


const PORT = process.env.PORT || app.get('port');
server.listen(PORT, () => {
  console.log(`Server ok on http://localhost:${PORT}`);
});
