const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

const serviceAccount = require(process.env.SERVICE_ACCOUNT);

const app = express();

app.use(cors());

const PORT = process.env.PORT;

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: process.env.DATABASE_URL });

const db = admin.firestore();

app.use(bodyParser.json());

// Endpoint para enviar una notificación a un usuario específico
app.post("/notificar", async (req, res) => {
  const { token, title, body } = req.body;

  const mensaje = { notification: { title: title, body: body }, token: token };

  try 
  {
    const response = await admin.messaging().send(mensaje);
    res.status(200).send(`Mensaje enviado correctamente: ${response}`);
  } 
  catch (error) { res.status(500).send(`Error al enviar el mensaje: ${error}`); }
});

// Endpoint para enviar notificación a todos los empleados de un rol
app.post("/notificar-rol", async (req, res) => {
  const { title, body, role } = req.body;

  try 
  {
    const tokensEmpleados = [];
  
    const querySnapshot = await db.collection("Usuarios").where("perfil", "==", role).get();
    const querySnapshot2 = await db.collection("Usuarios").where("tipo", "==", role).get();
    
    if(querySnapshot2.size > 0)
    {
      for(const doc of querySnapshot2) { querySnapshot.push(doc); }
    }

    for(const doc of querySnapshot)
    {
      const data = doc.data();
      if (data.token) { tokensEmpleados.push(data.token); }
    }

    if (tokensEmpleados.length === 0) { return res.status(404).send("No hay usuarios a los que enviar un mensaje"); }

    const mensaje = { notification: { title: title, body: body }, tokens: employeeTokens };

    const response = await admin.messaging().sendEachForMulticast(mensaje);
    res.status(200).send(`Mensajes enviados: ${response.successCount}`);
  } 
  catch (error) { res.status(500).send(`Error al enviar mensaje: ${error}`); }
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });