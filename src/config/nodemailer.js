import nodemailer from "nodemailer"
import dotenv from 'dotenv'
dotenv.config()


let transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.HOST_MAILTRAP,
    port: process.env.PORT_MAILTRAP,
    auth: {
        user: process.env.USER_MAILTRAP,
        pass: process.env.PASS_MAILTRAP,
    }
});

const sendMailToRegister = (userMail, token) => {

   
    let mailOptions = {
        from: `saludify@gmail.com`, 
        to: userMail,
        subject: "Bienvenido a Saludify 🍎🏋️",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color:rgb(80, 165, 84);">¡Bienvenido a Saludify!</h2>
                <p>Estamos emocionados de que formes parte de nuestra comunidad de salud y bienestar.</p>
                <p>Para completar tu registro y comenzar a monitorear tu nutrición y actividad física, por favor confirma tu cuenta:</p>
                
                <a href="${process.env.URL_FRONTEND}confirmar/${token}" 
                   style="display: inline-block; padding: 10px 20px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">
                   Confirmar mi cuenta
                </a>
                
                <p>Con Saludify podrás:</p>
                <ul>
                    <li>Registrar y analizar tus hábitos alimenticios</li>
                    <li>Monitorear tu actividad física</li>
                    <li>Recibir recomendaciones personalizadas</li>
                    <li>Seguir tu progreso hacia tus metas de salud</li>
                </ul>
                
                <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
                
                <footer style="color: #666; font-size: 14px;">
                    <p>El equipo de Saludify</p>
                    <p>¡Juntos hacia una vida más saludable!</p>
                </footer>
            </div>
        `
    
    }

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
        }
    })
}

const sendMailToRecoveryPassword = async(userMail,token)=>{
    let info = await transporter.sendMail({
    from: 'saludify@gmail.com',
    to: userMail,
    subject: "Restablece tu contraseña en Saludify 🍏",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2e7d32;">Saludify - Recuperación de contraseña</h1>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <p>Por favor haz clic en el siguiente enlace para continuar:</p>
                    
            <a href="${process.env.URL_FRONTEND}recuperar-password/${token}" 
            style="display: inline-block; padding: 10px 20px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">
            Restablecer contraseña
            </a>
                    
            <p>Si no solicitaste este cambio, por favor ignora este mensaje.</p>
                    
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    
            <footer style="color: #666; font-size: 14px;">
            <p>El equipo de Saludify</p>
            <p>¡Tu salud es nuestra prioridad!</p>
            </footer>
        </div>
    `
    });
    console.log("Mensaje enviado satisfactoriamente: ", info.messageId);
    
}

const sendMailToConfirmCita = async (to, data) => {
    const subject = data.fecha
        ? "Confirmación de cita agendada"
        : "Nueva solicitud de cita pendiente de confirmación";

    const html = data.fecha
        ? `<p>Estimado/a ${data.nombrePaciente}, su cita con el nutricionista ${data.nombreNutricionista} ha sido confirmada para el ${new Date(data.fecha).toLocaleString()}.</p>`
        : `<p>Estimado/a nutricionista, el paciente ${data.nombrePaciente} ha solicitado una cita. Por favor confirme la fecha y hora desde el sistema.</p>`;

    await transporter.sendMail({
        from: "Sistema Nutricionista <sistema@nutricion.com>",
        to,
        subject,
        html
    });
};


export {
    sendMailToRegister,
    sendMailToRecoveryPassword,
    sendMailToConfirmCita
}
