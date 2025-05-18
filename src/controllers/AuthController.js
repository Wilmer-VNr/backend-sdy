import Paciente from "../models/Paciente.js";
import Nutricionista from "../models/Nutricionista.js";
import { crearTokenJWT } from "../middlewares/JWT.js";

export const login = async (req, res) => {
    const { email, password } = req.body;

    // Validar campos vacíos
    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            msg: "Todos los campos son obligatorios" 
        });
    }

    try {
        // Buscar usuario en ambas colecciones
        let user = await Paciente.findOne({ email }).select("-__v -token -updatedAt -createdAt");
        let rol = "paciente";
        
        if (!user) {
            user = await Nutricionista.findOne({ email }).select("-__v -token -updatedAt -createdAt");
            rol = "nutricionista";
        }

        // Verificar si el usuario existe
        if (!user) {
            return res.status(404).json({ 
                success: false,
                msg: "Credenciales incorrectas" 
            });
        }

        // Verificar confirmación de email (solo para pacientes)
        if (rol === "paciente" && !user.confirmEmail) {
            return res.status(403).json({ 
                success: false,
                msg: "Por favor confirma tu email antes de iniciar sesión" 
            });
        }

        // Verificar contraseña
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false,
                msg: "Credenciales incorrectas" 
            });
        }

        // Generar token JWT
        const token = crearTokenJWT(user);

        // Preparar respuesta omitiendo datos sensibles
        const userData = {
            _id: user._id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol,
            ...(rol === "paciente" && { 
                edad: user.edad,
                direccion: user.direccion,
                celular: user.celular
            })
        };

        res.status(200).json({
            success: true,
            token,
            user: userData
        });

    } catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ 
            success: false,
            msg: "Error en el servidor" 
        });
    }
};