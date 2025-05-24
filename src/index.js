import app from './server.js'
import connection from './database.js'
import http from 'http'
import { Server } from 'socket.io'

connection()

const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: ["https://tu-app.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
})

io.on('connection', (socket) => {
    console.log('Usuario conectado', socket.id)
    socket.on('enviar-mensaje-front-back', (payload) => {
        socket.broadcast.emit('enviar-mensaje-front-back', payload)
    })
})

const PORT = process.env.PORT || app.get('port')
server.listen(PORT, () => {
    console.log(`Server ok on http://localhost:${PORT}`)
})
