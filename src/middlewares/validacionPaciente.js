import { check, validationResult } from 'express-validator';

export const validacionPaciente = [
    check("nombre")
        .exists({ checkFalsy: true })
            .withMessage('El nombre es obligatorio')
        .isLength({ min: 2, max: 50 })
            .withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/)
            .withMessage('El nombre solo puede contener letras y espacios'),

    check("apellido")
        .exists({ checkFalsy: true })
            .withMessage('El apellido es obligatorio')
        .isLength({ min: 2, max: 50 })
            .withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s]+$/)
            .withMessage('El apellido solo puede contener letras y espacios'),
    check("edad")
        .exists({ checkFalsy: true })
            .withMessage('La edad es obligatoria')
        .isInt({ min: 1, max: 100 })
            .withMessage('La edad debe estar entre 1 y 100 años'),

    check("direccion")
        .optional()
        .isLength({ max: 50 })
            .withMessage('La dirección no puede exceder los 50 caracteres'),

    
    check("celular")
    .optional()
    .matches(/^\d{10}$/)
        .withMessage('El número de celular debe tener exactamente 10 dígitos'),

    // Email: obligatorio y válido
    check("email")
        .exists({ checkFalsy: true })
            .withMessage('El email es obligatorio')
        .isEmail()
            .withMessage('Debe proporcionar un email válido')
        .normalizeEmail(),

    check("password")
        .exists({ checkFalsy: true })
            .withMessage('La contraseña es obligatoria')
        .isLength({ min: 8 })
            .withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/(?=.*[a-z])/)
            .withMessage('Debe contener al menos una minúscula')
        .matches(/(?=.*[A-Z])/)
            .withMessage('Debe contener al menos una mayúscula')
        .matches(/(?=.*\d)/)
            .withMessage('Debe contener al menos un número')
        .matches(/(?=.*[@$!%*?&])/)
            .withMessage('Debe contener al menos un carácter especial (@$!%*?&)'),

    check("nutricionista")
        .optional()
        .isMongoId()
            .withMessage('El ID del nutricionista no es válido'),

 
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        } else {
            return res.status(400).json({ errors: errors.array() });
        }
    }
];
