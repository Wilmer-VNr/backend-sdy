# Tests - Backend SDY

Este directorio contiene todos los tests del proyecto backend, organizados en tests unitarios e integración.

## 📁 Estructura

```
tests/
├── README.md                    # Este archivo
├── setup.js                     # Configuración global de tests
└── unitarias/                   # Tests unitarios
    └── controllers/             # Tests de controladores
        ├── AuthController.test.js
        ├── Cita_controller.test.js
        ├── comida_controller.test.js
        ├── Nutricionista_controller.test.js
        ├── Paciente_controller.test.js
        ├── parametrosSalud_controller.test.js
        └── Recomendaciones_controller.test.js
   
```

## 🚀 Ejecución de Tests

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests específicos

#### Tests unitarios por controlador:
```bash
npm run test/controllers/cita
npm run test/controllers/paciente
npm run test/controllers/nutricionista
npm run test/controllers/comida
npm run test/controllers/parametrosSalud
npm run test/controllers/recomendaciones
npm run test/controllers/auth
```

### Ejecutar tests en modo watch
```bash
npm run test:watch
```

## 🛠️ Configuración

### Vitest
El proyecto utiliza [Vitest](https://vitest.dev/) como framework de testing. La configuración se encuentra en `vitest.config.js` en la raíz del proyecto.

### Setup Global
El archivo `tests/setup.js` contiene la configuración global para todos los tests:
- Configuración de variables de entorno
- Setup de mocks globales
- Configuración de base de datos de test

### 3. Estructura de Tests

```javascript
describe('NombreDelControlador', () => {
  let mockReq, mockRes

  beforeEach(() => {
    // Setup de mocks
    mockReq = {
      body: {},
      params: {},
      query: {}
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    }
  })

  describe('nombreDelMetodo', () => {
    it('debería hacer algo exitosamente', async () => {
      // Arrange
      mockReq.body = { /* datos */ }
      
      // Act
      await nombreDelMetodo(mockReq, mockRes)
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          msg: 'Mensaje esperado'
        })
      )
    })

    it('debería fallar con datos inválidos', async () => {
      // Arrange
      mockReq.body = { /* datos inválidos */ }
      
      // Act
      await nombreDelMetodo(mockReq, mockRes)
      
      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        msg: 'Mensaje de error'
      })
    })
  })
})
```

### 4. Nomenclatura

- **Archivos de test**: `NombreDelArchivo.test.js`
- **Describe blocks**: `NombreDelControlador` o `NombreDelModelo`
- **Test cases**: Describir el comportamiento esperado en español
  - `debería crear un recurso exitosamente`
  - `debería fallar con datos inválidos`
  - `debería actualizar el recurso correctamente`

### 5. Validaciones

Los tests deben cubrir:
- ✅ Casos exitosos
- ❌ Casos de error (datos inválidos, IDs inexistentes, etc.)
- 🔒 Validaciones de seguridad (JWT, permisos)
- 📊 Casos edge (datos vacíos, límites, etc.)

## 📊 Cobertura de Tests

Para ver la cobertura de tests:
```bash
npm run test:coverage
```
Esto generará un reporte en `coverage/` con información detallada sobre qué líneas de código están cubiertas por tests.


## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Jest Matchers](https://jestjs.io/docs/expect) (compatible con Vitest)
- [Mongoose Testing Best Practices](https://mongoosejs.com/docs/jest.html) 