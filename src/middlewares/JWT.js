// import jwt from "jsonwebtoken";
// import Paciente from "../models/Paciente.js";
// import Nutricionista from "../models/Nutricionista.js";
// import dotenv from "dotenv";
// dotenv.config();

// // Función para crear tokens (mejorada)
// const crearTokenJWT = (user) => {
//     // Determina el rol automáticamente basado en el modelo
//     const rol = user instanceof Nutricionista ? "nutricionista" : "paciente";
    
//     return jwt.sign(
//         { 
//             id: user._id, 
//             rol: rol,
//             email: user.email // Agregamos email para mayor información
//         }, 
//         process.env.JWT_SECRET, 
//         { 
//             expiresIn: "8h", // Tiempo de expiración más seguro
//             algorithm: "HS256" 
//         }
//     );
// };

// // Middleware de verificación mejorado
// const verificarTokenJWT = async (req, res, next) => {
//     // 1. Verificar cabecera de autorización
//     if (!req.headers.authorization) {
//         return res.status(401).json({ 
//             success: false,
//             msg: "Token no proporcionado. Use: Bearer <token>" 
//         });
//     }

//     // 2. Extraer el token correctamente
//     const [bearer, token] = req.headers.authorization.split(" ");
    
//     if (bearer !== "Bearer" || !token) {
//         return res.status(401).json({ 
//             success: false,
//             msg: "Formato de token inválido. Use: Bearer <token>" 
//         });
//     }

//     try {
//         // 3. Verificar y decodificar el token
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
//         // 4. Verificar estructura básica del payload
//         if (!decoded.id || !decoded.rol) {
//             return res.status(401).json({ 
//                 success: false,
//                 msg: "Estructura de token inválida" 
//             });
//         }

//         // 5. Buscar usuario según su rol
//         let user;
//         if (decoded.rol === "nutricionista") {
//             user = await Nutricionista.findById(decoded.id)
//                         .select("-password -__v")
//                         .lean();
            
//             if (!user) {
//                 return res.status(404).json({ 
//                     success: false,
//                     msg: "Nutricionista no encontrado" 
//                 });
//             }
            
//             req.nutricionistaBDD = user;
//         } 
//         else if (decoded.rol === "paciente") {
//             user = await Paciente.findById(decoded.id)
//                         .select("-password -__v")
//                         .lean();
            
//             if (!user) {
//                 return res.status(404).json({ 
//                     success: false,
//                     msg: "Paciente no encontrado" 
//                 });
//             }
            
//             req.pacienteBDD = user;
//         } 
//         else {
//             return res.status(403).json({ 
//                 success: false,
//                 msg: "Rol no autorizado" 
//             });
//         }

//         // 6. Adjuntar información adicional al request
//         req.user = {
//             id: decoded.id,
//             rol: decoded.rol,
//             email: decoded.email
//         };

//         next();
//     } catch (error) {
//         console.error("Error en verificación de token:", error);
        
//         // Manejo específico de errores
//         let msg = "Error de autenticación";
//         if (error.name === "TokenExpiredError") {
//             msg = "Token expirado";
//         } else if (error.name === "JsonWebTokenError") {
//             msg = "Token inválido";
//         }

//         return res.status(401).json({ 
//             success: false,
//             msg: msg,
//             error: process.env.NODE_ENV === "development" ? error.message : undefined
//         });
//     }
// };

// // Función específica para login de nutricionistas
// const generarTokenNutricionista = async (email, password) => {
//     try {
//         // 1. Buscar nutricionista por email
//         const nutricionista = await Nutricionista.findOne({ email });
        
//         if (!nutricionista) {
//             throw new Error("Credenciales incorrectas");
//         }

//         // 2. Verificar contraseña (asumiendo que tienes un método matchPassword)
//         const isMatch = await nutricionista.matchPassword(password);
//         if (!isMatch) {
//             throw new Error("Credenciales incorrectas");
//         }

//         // 3. Verificar si está activo
//         if (!nutricionista.activo) {
//             throw new Error("Cuenta desactivada");
//         }

//         // 4. Generar y devolver token
//         return crearTokenJWT(nutricionista);
        
//     } catch (error) {
//         console.error("Error al generar token para nutricionista:", error);
//         throw error;
//     }
// };

// export { 
//     crearTokenJWT,
//     verificarTokenJWT,
//     generarTokenNutricionista 
// };

import jwt from "jsonwebtoken"
import Nutricionista from "../models/Nutricionista.js"
import Paciente from "../models/Paciente.js"

const crearTokenJWT = (id, rol) => {

    return jwt.sign({ id, rol }, process.env.JWT_SECRET, { expiresIn: "100d" })
}

const verificarTokenJWT = async (req, res, next) => {

    if (!req.headers.authorization) return res.status(401).json({ msg: "Acceso denegado: token no proporcionado o inválido" })

    const { authorization } = req.headers

    try {
        const token = authorization.split(" ")[1];
        const { id, rol } = jwt.verify(token,process.env.JWT_SECRET)
        if (rol === "nutricionista") {
            const user = await Nutricionista.findById(id).lean().select("-password");
            if (!user) return res.status(404).json({ msg: "Nutricionista no encontrado" });
            req.nutricionistaBDD = user;
            req.user = { id, rol }; 
            next();
        } else if (rol === "paciente") {
            const user = await Paciente.findById(id).lean().select("-password");
            if (!user) return res.status(404).json({ msg: "Paciente no encontrado" });
            req.pacienteBDD = user;
            req.user = { id, rol };
            next();
        }
        
        
    } catch (error) {
        return res.status(401).json({ msg: "Token inválido o expirado" });
    }
}


export { 
    crearTokenJWT,
    verificarTokenJWT 
}
