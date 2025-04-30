// archivo no prerendizado de forma estática
export const prerender = false;

import type { APIRoute } from "astro"
import { Resend } from "resend"

const resend = new Resend(import.meta.env.RESEND_API_KEY)

// Correo al que se enviarán los mensajes
const RECIPIENT_EMAIL = "anabhi01@gmail.com"

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()

    // Validar datos requeridos
    const { name, email, message, phone, service } = body

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({
          error: "Nombre, email y mensaje son campos requeridos",
        }),
        { status: 400 },
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Por favor, ingrese un email válido",
        }),
        { status: 400 },
      )
    }

    const serviceName = getServiceName(service)

    // Enviar el correo usando Resend
    const { data, error } = await resend.emails.send({
      from: "Formulario Web <no-reply@emprendcontrol.cl>",
      to: [RECIPIENT_EMAIL],
      subject: `Nuevo mensaje de contacto de ${name}`,
      replyTo: email,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone || "No proporcionado"}</p>
        <p><strong>Servicio de interés:</strong> ${serviceName}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    })

    if (error) {
      console.error("Error al enviar el correo:", error)
      return new Response(
        JSON.stringify({
          error: "No se pudo enviar el mensaje. Por favor, inténtelo de nuevo.",
        }),
        { status: 500 },
      )
    }

    return new Response(
      JSON.stringify({
        message: "Mensaje enviado con éxito",
        id: data?.id,
      }),
      { status: 200 },
    )
  } catch (error) {
    console.error("Error en el servidor:", error)
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
      }),
      { status: 500 },
    )
  }
}

// Función auxiliar para obtener el nombre del servicio
function getServiceName(serviceValue: string): string {
  const services: Record<string, string> = {
    residential: "Fumigación Residencial",
    commercial: "Fumigación Comercial",
    preventive: "Control Preventivo",
    other: "Otro",
  }

  return services[serviceValue] || "No especificado"
}
