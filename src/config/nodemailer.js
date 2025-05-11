
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
        from: `Saludify@gmail.com`, 
        to: userMail,
        subject: "Bienvenido a Saludify 🍎🏋️",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color:rgb(80, 165, 84);">¡Bienvenido a Saludify!</h2>
                <p>Estamos emocionados de que formes parte de nuestra comunidad de salud y bienestar.</p>
                <p>Para completar tu registro y comenzar a monitorear tu nutrición y actividad física, por favor confirma tu cuenta:</p>
                
                <a href="${process.env.URL_BACKEND}confirmar/${token}" 
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

export default sendMailToRegister