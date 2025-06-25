const { app } = require('@azure/functions');
const Handlebars = require('handlebars');
const { EmailClient } = require("@azure/communication-email");
const fs = require('fs');
const path = require('path');

// Cadena de conexión para Azure Communication Email
const connectionString = "endpoint=https://emails-adso-2825192s.unitedstates.communication.azure.com/;accesskey=DwpbLbRv4SZ1osp2mXeZK0GmOOt3wT9RKAqplDcN7pithl3GMQtKJQQJ99AHACULyCps5mg0AAAAAZCSBd1B";

// Crear cliente de correo utilizando la cadena de conexión
const client = new EmailClient(connectionString);

const templateAttributes = {
    "confirmationTemplate.html": ["nombre", "role"], //Deben ser los mismos en el html y en el json
    "passwordResetDC.html": ["username", "resetCode"], // Atributos para la plantilla de restablecimiento de contraseña
    "mindLinkConfirmationTemplate.html": ["nombre", "intereses"],
};

app.http('httpTrigger1', {
    methods: ['POST'],
    handler: async (request, context) => {
        const requestData = await request.json();
        const { subject, templateName, dataTemplate, to } = requestData;

        // Verificar si el nombre de la plantilla existe
        if (!templateAttributes[templateName]) {
            return { status: 400, body: "Invalid template name" };
        }

        // Filtrar los datos de la plantilla según los atributos requeridos
        const requiredAttributes = templateAttributes[templateName];
        const filteredData = {};

        // Solo incluir los atributos que correspondan a esta plantilla
        for (const attribute of requiredAttributes) {
            if (dataTemplate[attribute]) {
                filteredData[attribute] = dataTemplate[attribute];
            }
        }

        // Cargar y compilar la plantilla
        const templatePath = path.join(__dirname, templateName);
        const source = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(source);

        // Generar el HTML con los datos filtrados
        const html = template(filteredData);

        // Configurar el mensaje de correo
        const emailMessage = {
            senderAddress: "DoNotReply@79f1d219-803a-421b-b26f-fc539010b425.azurecomm.net",
            content: {
                subject: subject,
                html: html,
            },
            recipients: {
                to: [{ address: to }],
            },
        };

        // Enviar el correo electrónico usando el cliente de correo de Azure
        const poller = await client.beginSend(emailMessage);
        const result = await poller.pollUntilDone();

        return { body: "email sent successfully" };
    }
});
