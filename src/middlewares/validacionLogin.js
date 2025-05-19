import { check, validationResult } from 'express-validator';

export const validacionLogin = [

    // Email: estilo profesional (como Facebook/Google)
    // check("email")
    //     .exists({ checkFalsy: true })
    //         .withMessage('El email es obligatorio')
    //     .isEmail()
    //         .withMessage('Debe proporcionar un email válido')
    //     .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    //         .withMessage('El formato del email no es válido')
    //     .normalizeEmail(),

    check("email")
            .exists({ checkFalsy: true })
                .withMessage('El email es obligatorio')
            .isEmail()
                .withMessage('Debe proporcionar un email válido')
            .normalizeEmail(),

    // Password segura: mínimo 8 caracteres, con letra, número y símbolo
    check("password")
        .exists({ checkFalsy: true })
            .withMessage('La contraseña es obligatoria')
        .isLength({ min: 8 })
            .withMessage('Debe tener al menos 8 caracteres')
        .matches(/(?=.*[a-z])/)
            .withMessage('Debe contener al menos una minúscula')
        .matches(/(?=.*[A-Z])/)
            .withMessage('Debe contener al menos una mayúscula')
        .matches(/(?=.*\d)/)
            .withMessage('Debe contener al menos un número')
        .matches(/(?=.*[@$!%*?&])/)
            .withMessage('Debe contener al menos un carácter especial (@$!%*?&)'),

    // Manejo de errores
    (req, res, next) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        } else {
            return res.status(400).json({ errors: errors.array() });
        }
    }
];
