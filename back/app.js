const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
const config = require("./config/config");

const { signString } = require("./utils/tools");
const authToken = require("./service/authTokenService");
const createOrder = require("./service/createOrderService");
const createMandetOrder = require("./service/createMandetOrderService");

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Allow cross-origin
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization,X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Request-Method"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PATCH, PUT, DELETE"
  );
  res.header("Allow", "GET, POST, PATCH, OPTIONS, PUT, DELETE");
  next();
});

// Your existing routes
app.post("/apply/h5token", function (req, res) {
  //authToken.authToken(req, res);
  fetch("https://developerportal.ethiotelebirr.et:38443/apiaccess/payment/gateway/payment/v1/token", {
    method: "POST", // Capitalized POST is standard in Node
    headers: {
        "Content-Type": "application/json",
        "X-APP-Key": "c4182ef8-9249-458a-985e-06d191f4d505"
    },
    body: JSON.stringify({
        appSecret: "fad0f06383c6297f545876694b974599"
    })
})
.then(res => res.json())
.then(json => {
    console.log("response", json);
})
.catch(ex => {
    console.error("error", ex);
});

  
});

app.post("/create/order", async (req, res) => {
  try {
    const resultRaq = await createOrder.createOrder(req, res);
    return res.send(resultRaq).status(200);
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/create/mandetOrder", function (req, res) {
  createMandetOrder.createMandetOrder(req, res);
});

app.post("/api/v1/notify", (req, res) => {
  // Handle your notification logic here
  res.status(201).json({ body: req.body });
});

app.get("/test", (req, res) => {
  // Handle your notification logic here
  res.status(200).json({ body: {a:1,b:2} });
});

// Start server
const serverPort = process.env.PORT || 3000;
server.listen(serverPort, () => {
  console.log("Server started, port:" + serverPort);
});


// Catch synchronous errors
process.on('uncaughtException', (err) => {
  console.error('Caught exception: ', err);
  // Log to a file or external service here
});

// Catch asynchronous promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log to a file or external service here
});
