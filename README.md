# 🥗 Backend - Sistema para Nutricionistas

Este componente corresponde al backend del **Sistema para Nutricionistas**, una plataforma diseñada para que los profesionales de la nutrición puedan **monitorear la salud de sus pacientes** y **generar recomendaciones personalizadas** de alimentación y ejercicio. El sistema busca facilitar el seguimiento remoto y digitalizado del estado nutricional de las personas.

---

## 🚀 Tecnologías utilizadas

- **Node.js** – Entorno de ejecución para JavaScript en el servidor.
- **Express.js** – Framework para la creación de APIs RESTful.
- **MongoDB** – Base de datos NoSQL para almacenar la información del sistema.
- **JWT (JSON Web Tokens)** – Autenticación y control de acceso por roles.
- **Socket.io** – Comunicación en tiempo real mediante chat.

---

## 📂 Funcionalidades principales

- Registro y autenticación de usuarios (pacientes y nutricionistas).
- Gestión de datos personales: peso, altura, comidas, actividad física, etc.
- Sistema de roles para restringir accesos (nutricionista, paciente).
- Generación de recomendaciones personalizadas mediante integración con APIs externas.
- Chat en tiempo real entre pacientes y nutricionistas.

---
## ⚙️ Instalación y ejecución

Sigue estos pasos para instalar las dependencias y ejecutar el proyecto localmente:

1. **Clona el repositorio:**

```bash
  git clone https://github.com/Wilmer-VNr/backend-sdy.git
  cd backend-sdy
```

2. **Instala las dependencias:**

```bash
  npm install
```
3. **Crea un archivo .env en la raíz del proyecto con las siguientes variables:**

```bash
  # Configuración SMTP (Mailtrap o Gmail)
  HOST_MAILTRAP=smtp.gmail.com
  PORT_MAILTRAP=465
  USER_MAILTRAP=tu-correo@gmail.com
  PASS_MAILTRAP=tu-contraseña-de-app-gmail
  
  # URLs locales
  URL_BACKEND=http://localhost:3000/api/
  URL_FRONTEND=http://localhost:5173/

  # URLs en producción si es (Render + Vercel)
  URL_BACKEND=https://tu-backend.onrender.com/api/
  URL_FRONTEND=https://tu-frontend.vercel.app/
```

2. **Inicia el servidor:**

```bash
  npm run dev
```

