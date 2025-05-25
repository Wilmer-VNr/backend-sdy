import app from './server.js';
import connection from './database.js';
import http from 'http';
import { Server } from 'socket.io';


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
    allowedHeaders: ["Content-Type"],  
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Usuario conectado', socket.id);
  
  // Escucha mensajes del frontend y los emite a otros usuarios
  socket.on('enviar-mensaje-front-back', (payload) => {
    socket.broadcast.emit('enviar-mensaje-front-back', payload);
  });
});

// Definir el puerto y levantar el servidor
const PORT = process.env.PORT || app.get('port');
server.listen(PORT, () => {
  console.log(`Server ok on http://localhost:${PORT}`);
});
