import { check, validationResult } from 'express-validator';

export const validacionParametroSalud = [

    // Peso en kilogramos (ej: 45 kg - 300 kg)
    check("peso")
        .exists({ checkNull: true, checkFalsy: true })
            .withMessage('El campo "peso" es obligatorio')
        .isFloat({ min: 30, max: 300 })
            .withMessage('El "peso" debe estar entre 30 y 300 kg'),

    // Estatura en metros (ej: 1.20 m - 2.50 m)
    check("estatura")
        .exists({ checkNull: true, checkFalsy: true })
            .withMessage('El campo "estatura" es obligatorio')
        .isFloat({ min: 1.2, max: 2.5 })
            .withMessage('La "estatura" debe estar entre 1.20 m y 2.50 m'),

    // Nivel de actividad física (valores clínicamente relevantes)
    check("nivelActividadFisica")
        .exists({ checkNull: true, checkFalsy: true })
            .withMessage('El campo "nivelActividadFisica" es obligatorio')
        .isIn(['Bajo', 'Moderado', 'Alto'])
            .withMessage('El "nivelActividadFisica" debe ser uno de: Sedentario, Ligero, Moderado, Intenso, Muy intenso'),

    // Enfermedades comunes (se valida como texto opcional, se podría validar con listas predefinidas en el futuro)
    check("enfermedad")
        .optional()
        .isString()
            .withMessage('El campo "enfermedad" debe ser texto')
        .isLength({ max: 100 })
            .withMessage('El campo "enfermedad" no debe exceder los 100 caracteres')
        .customSanitizer(value => value?.trim()),

    // Discapacidad (opcional, se valida como texto)
    check("discapacidad")
        .optional()
        .isString()
            .withMessage('El campo "discapacidad" debe ser texto')
        .isLength({ max: 100 })
            .withMessage('El campo "discapacidad" no debe exceder los 100 caracteres')
        .customSanitizer(value => value?.trim()),

    // Paciente: ID de MongoDB
    check("paciente")
        .exists({ checkNull: true, checkFalsy: true })
            .withMessage('El campo "paciente" es obligatorio')
        .isMongoId()
            .withMessage('El ID del paciente no es válido'),

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
