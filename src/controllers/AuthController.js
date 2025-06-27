import Paciente from "../models/Paciente.js";
import Nutricionista from "../models/Nutricionista.js";
import { sendMailToRecoveryPassword } from "../config/nodemailer.js";
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
                msg: "Usuario no encontrado" 
            });
        }

        // Verificar confirmación de email (solo para pacientes)
        if (rol === "paciente" && !user.confirmEmail) {
            return res.status(403).json({ 
                success: false,
                msg: "Por favor confirma tu email antes de iniciar sesión" 
            });
        }
         // Verificar si está bloqueado (status false)
        if (!user.status) {
                return res.status(403).json({ 
                    success: false,
                    msg: `Tu cuenta ha sido desactivada.`
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


export const recuperarPassword = async (req, res) => {
    const { email } = req.body;

    // Validar campos vacíos
    if (!email) {
        return res.status(400).json({
            success: false,
            msg: "El campo email es obligatorio"
        });
    }

    try {
        // Buscar usuario en ambas colecciones
        let user = await Paciente.findOne({ email });
        let rol = "paciente";

        if (!user) {
            user = await Nutricionista.findOne({ email });
            rol = "nutricionista";
        }

        // Verificar si el usuario existe
        if (!user) {
            return res.status(404).json({
                success: false,
                msg: "El usuario no está registrado"
            });
        }

        // Generar token y enviar correo
        const token = user.crearToken();
        user.token = token;
        await user.save();
        await sendMailToRecoveryPassword(email, token);

        res.status(200).json({
            success: true,
            msg: `Revisa tu correo electrónico para reestablecer tu cuenta (${rol})`
        });
    } catch (error) {
        console.error("Error en recuperarPassword:", error);
        res.status(500).json({
            success: false,
            msg: "Error en el servidor"
        });
    }
};

export const comprobarTokenPassword = async (req, res) => {
    const { token } = req.params;

    // Validar token vacío
    if (!token) {
        return res.status(400).json({
            success: false,
            msg: "El token es obligatorio"
        });
    }

    try {
        // Buscar usuario en ambas colecciones
        let user = await Paciente.findOne({ token });
        let rol = "paciente";

        if (!user) {
            user = await Nutricionista.findOne({ token });
            rol = "nutricionista";
        }

        // Verificar si el usuario existe y el token coincide
        if (!user || user.token !== token) {
            return res.status(404).json({
                success: false,
                msg: "Token inválido o usuario no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            msg: `Token confirmado, ya puedes crear tu nuevo password (${rol})`
        });
    } catch (error) {
        console.error("Error en comprobarTokenPassword:", error);
        res.status(500).json({
            success: false,
            msg: "Error en el servidor"
        });
    }
};

export const crearNuevoPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmpassword } = req.body;

    // Validar campos vacíos
    if (!password || !confirmpassword) {
        return res.status(400).json({
            success: false,
            msg: "Todos los campos son obligatorios"
        });
    }

    // Verificar que las contraseñas coincidan
    if (password !== confirmpassword) {
        return res.status(400).json({
            success: false,
            msg: "Las contraseñas no coinciden"
        });
    }

    try {
        // Buscar usuario en ambas colecciones
        let user = await Paciente.findOne({ token });
        let rol = "paciente";

        if (!user) {
            user = await Nutricionista.findOne({ token });
            rol = "nutricionista";
        }

        // Verificar si el usuario existe y el token coincide
        if (!user || user.token !== token) {
            return res.status(404).json({
                success: false,
                msg: "Token inválido o usuario no encontrado"
            });
        }

        // Actualizar contraseña y eliminar token
        user.password = await user.encrypPassword(password);
        user.token = null;
        await user.save();

        res.status(200).json({
            success: true,
            msg: `Contraseña actualizada correctamente (${rol})`
        });
    } catch (error) {
        console.error("Error en crearNuevoPassword:", error);
        res.status(500).json({
            success: false,
            msg: "Error en el servidor"
        });
    }
};
