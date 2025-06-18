import { check, validationResult } from 'express-validator';

export const validacionEmail = [

   check("email")
    .exists({ checkFalsy: true })
        .withMessage('El email es obligatorio')
    .isEmail()
        .withMessage('Debe proporcionar un email válido')
    .custom((value) => {
        // Definir dominios válidos
        const validDomains = ['gmail.com', 'outlook.com', 'hotmail.com'];

        const emailDomain = value.split('@')[1];

        // Verificar si el dominio está en la lista de dominios válidos
        if (!validDomains.includes(emailDomain)) {
            throw new Error('El correo electrónico debe ser de Gmail, Outlook o Hotmail');
        }

        return true;
    })
    .normalizeEmail(),
    
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

export const validacionPassword = [

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

    (req, res, next) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        } else {
            return res.status(400).json({ errors: errors.array() });
        }
    }
];

export const validarNuevoPassword = [
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


    check("confirmpassword")
        .exists({ checkFalsy: true })
            .withMessage("La confirmación de contraseña es obligatoria")
        .custom((value, { req }) => value === req.body.password)
            .withMessage("Las contraseñas no coinciden"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    } else {
      return res.status(400).json({ errors: errors.array() });
    }
  }
];


export const validarActualizarPassword = [

  check("passwordactual")
    .exists({ checkFalsy: true })
    .withMessage("El password actual es obligatorio"),

  check("passwordnuevo")
    .exists({ checkFalsy: true })
    .withMessage("El nuevo password es obligatorio")
    .isLength({ min: 8 })
    .withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(/(?=.*[a-z])/)
    .withMessage("Debe contener al menos una minúscula")
    .matches(/(?=.*[A-Z])/)
    .withMessage("Debe contener al menos una mayúscula")
    .matches(/(?=.*\d)/)
    .withMessage("Debe contener al menos un número")
    .matches(/(?=.*[@$!%*?&])/)
    .withMessage("Debe contener al menos un carácter especial (@$!%*?&)"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    } else {
      return res.status(400).json({ errors: errors.array() });
    }
  }
];


