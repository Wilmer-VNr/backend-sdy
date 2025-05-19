import { check, validationResult } from 'express-validator';

export const validacionComida = [

    // tipoComida: obligatorio y debe estar en la lista
    check("tipoComida")
        .exists({ checkNull: true, checkFalsy: true })
            .withMessage('El campo "tipoComida" es obligatorio')
        .isIn(['Desayuno', 'Almuerzo', 'Cena', 'Snack'])
            .withMessage('El campo "tipoComida" debe ser uno de: Desayuno, Almuerzo, Cena, Snack'),

    // descripcion: debe ser texto claro, ni muy corto ni muy largo
    check("descripcion")
        .exists({ checkNull: true, checkFalsy: true })
            .withMessage('El campo "descripcion" es obligatorio')
        .isString()
            .withMessage('El campo "descripcion" debe ser texto')
        .isLength({ min: 10, max: 200 })
            .withMessage('La "descripcion" debe tener entre 10 y 200 caracteres')
        .customSanitizer(value => value.trim()),

    // paciente: debe ser un ID válido de Mongo
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
