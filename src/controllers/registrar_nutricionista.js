import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Nutricionista from '../models/Nutricionista.js';  // Asegúrate de tener esta ruta correcta

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI_LOCAL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.log(err));

// Función para registrar un nutricionista predefinido
const registrarNutricionista = async () => {
    // Nutricionista hardcodeado
    const nutricionistaData = {
        nombre: "Juan",
        apellido: "Pérez",
        edad: "35",
        direccion: "Av. Libertador 1234",
        celular: "123456789",
        email: "juan.perez@example.com",
        password: "123456"
    };

    try {
        // Verificar si el nutricionista ya existe
        const nutricionistaExistente = await Nutricionista.findOne({ email: nutricionistaData.email });
        if (nutricionistaExistente) {
            console.log("Este email ya está registrado.");
            return;
        }

        // Crear una instancia del nutricionista
        const nutricionista = new Nutricionista(nutricionistaData);

        // Cifrar la contraseña antes de guardarla
        nutricionista.password = await nutricionista.encrypPassword(nutricionistaData.password);

        // Generar el token para el nutricionista
        nutricionista.token = nutricionista.crearToken();

        // Guardar el nutricionista en la base de datos
        await nutricionista.save();
        console.log("Nutricionista registrado exitosamente:", nutricionista);
    } catch (error) {
        console.error("Hubo un error al registrar el nutricionista:", error);
    }

    // Cerrar la conexión con la base de datos
    mongoose.connection.close();
};

// Llamar a la función para registrar el nutricionista
registrarNutricionista();
