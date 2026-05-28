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
  const data = JSON.stringify({
    appSecret: config.appSecret
  });
  
  // 2. Configure request options
  const options = {
    hostname: 'developerportal.ethiotelebirr.et',
    port: 38443,
    path: '/payment/v1/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'X-APP-Key': config.fabricAppId,
    }
  };
  
  // 3. Initialize the request
  const req_ = https.request(options, (res_) => {
    let responseData = '';
  
    // Consume response data in chunks
    res_.on('data', (chunk) => {
      responseData += chunk;
    });
  
    // Handle fully received response
    res_.on('end', () => {
      console.log('Status Code:', res_.statusCode);
      try {
        const jsonResponse = JSON.parse(responseData);
        res.send(jsonResponse);
        console.log('Success:', jsonResponse);
      } catch (e) {
        console.log('Raw Response:', responseData);
      }
    });
  });
  
  // 4. Handle connection or system errors
  req.on('error', (error) => {
    console.error('Request Error:', error);
  });
  
  // 5. Write data payload and close the connection
  req_.write(data);
  req_.end();
  
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
