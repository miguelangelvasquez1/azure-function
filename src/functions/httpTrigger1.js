const { app } = require('@azure/functions');
const Handlebars = require('handlebars');
const { EmailClient } = require("@azure/communication-email");
const fs = require('fs');
const path = require('path');
const connectionString = "endpoint=https://emails-adso-192.unitedstates.communication.azure.com/;accesskey=GAb2fQ4gL40IxaCd71vqzemUKJ3B4qQzYcgjGeFkT5SZdwA4oSShJQQJ99AHACULyCps5mg0AAAAAZCSDFZt";
const client = new EmailClient(connectionString);
app.http('httpTrigger1', {
methods: ['POST'],
handler: async (request, context) => {
const requestData = await request.json();
const subject = requestData.subject;
const templateName = requestData.templateName;
const dataTemplate = requestData.dataTemplate;
const to = requestData.to;
const templatePath = path.join(__dirname, templateName);
const source = fs.readFileSync(templatePath, 'utf-8');
const template = Handlebars.compile(source);
const html = template({ 
    nombreUsuario: dataTemplate.nombreUsuario, //le mando las variables del JSON(requestData) al HTML
    nombreArticulo: dataTemplate.nombreArticulo,
    categoriaArticulo: dataTemplate.categoriaArticulo,
    precioArticulo: dataTemplate.precioArticulo,
    estadoArticulo: dataTemplate.estadoArticulo,
    imagenArticulo: dataTemplate.imagenArticulo,
    enlaceDetalles: dataTemplate.enlaceDetalles
});
const emailMessage = {
senderAddress: "DoNotReply@20a7a68d-6cd3-4e4c-8045-b8a646fd8f7a.azurecomm.net",
content: {
subject: subject,
html: html,
},
recipients: {
to: [{ address: to }],
},
};
const poller = await client.beginSend(emailMessage);
const result = await poller.pollUntilDone();
return { body: `email sent successfully` };
}
});
