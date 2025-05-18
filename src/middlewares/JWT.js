import jwt from "jsonwebtoken";
import Nutricionista from "../models/Nutricionista.js";
import Paciente from "../models/Paciente.js";
import dotenv from "dotenv";
dotenv.config();

// Función para crear tokens
const crearTokenJWT = (user) => {
    const rol = user instanceof Nutricionista ? "nutricionista" : "paciente";
    
    return jwt.sign(
        { 
            id: user._id, 
            rol: rol,
            email: user.email
        }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: "8h",
            algorithm: "HS256" 
        }
    );
};

// Middleware de verificación mejorado
const verificarTokenJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ 
            success: false,
            msg: "Formato de token inválido. Use: Bearer <token>" 
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.id || !decoded.rol) {
            return res.status(401).json({ 
                success: false,
                msg: "Estructura de token inválida" 
            });
        }

        let user;
        if (decoded.rol === "nutricionista") {
            user = await Nutricionista.findById(decoded.id)
                        .select("-password -__v -token")
                        .lean();
            
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    msg: "Nutricionista no encontrado" 
                });
            }
            
            req.nutricionistaBDD = user;
        } 
        else if (decoded.rol === "paciente") {
            user = await Paciente.findById(decoded.id)
                        .select("-password -__v -token")
                        .lean();
            
            if (!user) {
                return res.status(404).json({ 
                    success: false,
                    msg: "Paciente no encontrado" 
                });
            }
            
            req.pacienteBDD = user;
        } 
        else {
            return res.status(403).json({ 
                success: false,
                msg: "Rol no autorizado" 
            });
        }

        req.user = {
            id: decoded.id,
            rol: decoded.rol,
            email: decoded.email
        };

        next();
    } catch (error) {
        let msg = "Error de autenticación";
        if (error.name === "TokenExpiredError") {
            msg = "Token expirado";
        } else if (error.name === "JsonWebTokenError") {
            msg = "Token inválido";
        }

        return res.status(401).json({ 
            success: false,
            msg: msg,
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

export { 
    crearTokenJWT,
    verificarTokenJWT
};