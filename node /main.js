const http = require('http');
const { Client } = require('pg');
const tools = require("./tools");
const config = require("./config");

// Add this line at the absolute top of your script file (Local testing only!)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// 1. Database Configuration
// const client = new Client({
//   connectionString: 'postgresql://username:password@localhost:5432/mydb'
// });
// client.connect().catch(err => console.error('DB Connection Error:', err));

// transactions, clients, orders, refunds, logs
/*

transaction{
account_id, trans_id, payment_order_id, trans_end_time, 
total_amount, trans_currency, merchant_order_id, 
trade_status, notify_time
}

order{
account_id, merchant_order_id, prepay_id, title, amount, currency, status, ordered_by,cr§eated_at}

query{
merchant_order_id, payment_order_id, 
order_status, queried_by,created_at}

refund{
 merchant_order_id, refund_order_id, transaction_id, refund_amount, 
 refund_currency, refund_status, refund_time, refund_reason,
}

*/

// 2. Helper to set CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

// 3. Helper to parse JSON request body
const parseJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
};

// 4. Helper to send JSON responses
const sendResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// 5. Main Server Logic
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Enforce POST method for all actual api routes
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    // Route 1: Checkout
    if (req.url === '/checkout') {
        // const refund = await refundOrder("ORDER_12345", "REFUND_REQ_001", 500);
// console.log("Refund Result:", refund);
  


   const body = await parseJsonBody(req);
const result = await checkOut(body.title, body.amount);
//console.log("Checkout Result:", result);

    
    //   const result = await client.query(
    //     'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    //     [body.name, body.email]
    //   );
      return sendResponse(res, 201, result);
    }

    // Route 2: Query Order Status
    if (req.url === '/queryOrder') {
       const body = await parseJsonBody(req);
       const query = await queryOrder(body.orderId);
       //console.log("Query Result:", query);
    //   const result = await client.query(
    //     'INSERT INTO products (title, price) VALUES ($1, $2) RETURNING *',
    //     [body.title, body.price]
    //   );
      return sendResponse(res, 201, query);
    }

    

    // Route 3: Refund
    if (req.url === '/refund') {
      const body = await parseJsonBody(req);
     const refund = await refundOrder(body.orderId, body.transactionId, body.amount );
 //console.log("Refund Result:", refund);
  
    //   const result = await client.query(
    //     'INSERT INTO logs (action, user_id) VALUES ($1, $2) RETURNING *',
    //     [body.action, body.user_id]
    //   );
      return sendResponse(res, 201, refund);
    }

    // 404 Route Not Found
    sendResponse(res, 404, { error: 'Route Not Found' });

  } catch (error) {
    console.error(error);
    const status = error.message === 'Invalid JSON' ? 400 : 500;
    sendResponse(res, status, { error: error.message || 'Internal Server Error' });
  }
});

// 6. Start Server
server.listen(3000, () => {
  console.log('Native HTTP server running on port 3000');
});

async function refundOrder(orderId, transactionId, amount) {
  try {
    // 1. Fetch the authentication token
    const tokenRes = await fetch(`${config.baseUrl}/payment/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId
      },
      body: JSON.stringify({
        appSecret: config.appSecret
      })
    });

    if (!tokenRes.ok) throw new Error(`Token fetch failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    //console.log(tokenData);

    // 2. Prepare the refund request payload
    let req = {
      timestamp: tools.createTimeStamp(),
      nonce_str: tools.createNonceStr(),
      method: "payment.refund",
      version: "1.0",
    };
    
    let biz = {
      appid: config.merchantAppId,
      merch_code: config.merchantCode,
      merch_order_id: orderId,
      refund_request_no: transactionId,
      refund_reason: 'incorrect payment',
      trans_currency: "ETB",
      actual_amount: amount
    };
    
    req.biz_content = biz;
    req.sign = tools.signRequestObject(req);
    req.sign_type = "SHA256WithRSA";

    // 3. Request the refund execution
    const refundRes = await fetch(`${config.baseUrl}/payment/v1/merchant/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
        "Authorization": tokenData.token,
      },
      body: JSON.stringify(req)
    });

    if (!refundRes.ok) throw new Error(`Refund request failed: ${refundRes.status}`);
    const refundData = await refundRes.json();

    //console.log("=========================================================");
    //console.log(refundData);
    //console.log("=========================================================");

    // 4. Return the refund result
    return { success: true, data: refundData };

  } catch (error) {
    console.error("Refund Error:", error);
    return { success: false, error: error.message };
  }
}




async function queryOrder(orderId) {
  try {
    // 1. Fetch the authentication token
    const tokenRes = await fetch(`${config.baseUrl}/payment/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId
      },
      body: JSON.stringify({
        appSecret: config.appSecret
      })
    });

    if (!tokenRes.ok) throw new Error(`Token fetch failed: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    //console.log(tokenData);

    // 2. Prepare the order query payload
    let req = {
      timestamp: tools.createTimeStamp(),
      nonce_str: tools.createNonceStr(),
      method: "payment.queryorder",
      version: "1.0",
    };
    
    let biz = {
      appid: config.merchantAppId,
      merch_code: config.merchantCode,
      merch_order_id: orderId,
    };
    
    req.biz_content = biz;
    req.sign = tools.signRequestObject(req);
    req.sign_type = "SHA256WithRSA";

    // 3. Request the order status
    const queryRes = await fetch(`${config.baseUrl}/payment/v1/merchant/queryOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
        "Authorization": tokenData.token,
      },
      body: JSON.stringify(req)
    });

    if (!queryRes.ok) throw new Error(`Order query failed: ${queryRes.status}`);
    const queryData = await queryRes.json();

   // console.log("=========================================================");
   // console.log(queryData);
   // console.log("=========================================================");

    // 4. Return the order status data
    return { success: true, data: queryData };

  } catch (error) {
    console.error("Order Query Error:", error);
    return { success: false, error: error.message };
  }
}



async function checkOut(title, amount) {
  try {
    // 1. Fetch the authentication token
    const tokenRes = await fetch(`${config.baseUrl}/payment/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-Key': config.fabricAppId
      },
      body: JSON.stringify({ appSecret: config.appSecret })
    });
    
    if (!tokenRes.ok) throw new Error(`Failed to get token: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    console.log(tokenData);

    // 2. Prepare the payment request payload
    let req = {
      timestamp: tools.createTimeStamp(),
      nonce_str: tools.createNonceStr(),
      method: "payment.preorder",
      version: "1.0",
    };
    
    let biz = {
    notify_url: "https://node-api-muxu.onrender.com/api/v1/notify",
    trade_type: "InApp",
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    merch_order_id: createMerchantOrderId(),
    title: title,
    total_amount: amount,
    trans_currency: "ETB",
    timeout_express: "120m",
    payee_identifier: config.merchantCode,
    payee_identifier_type: "04",
    payee_type: "5000",
    redirect_url: "https://216.24.57.253/api/v1/notify",
  };
    
    req.biz_content = biz;
    req.sign = tools.signRequestObject(req);
    req.sign_type = 'SHA256WithRSA';

    // 3. Make the preorder request
    const orderRes = await fetch(`${config.baseUrl}/payment/v1/merchant/preOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-APP-Key': config.fabricAppId,
        'Authorization': tokenData.token, 
      },
      body: JSON.stringify(req)
    });
    
    if (!orderRes.ok) throw new Error(`Preorder failed: ${orderRes.status}`);
    const orderData = await orderRes.json();

    //console.log("=========================================================");
    //console.log(orderData);
    //console.log("=========================================================");

    // 4. Return the checkout data
    const checkoutUrl = createCheckoutUrl(orderData.biz_content.prepay_id);
    return {
      success: true,
      checkoutUrl: checkoutUrl,
      prepayId: orderData.biz_content.prepay_id,
      orderId: req.biz_content.merch_order_id
    };

  } catch (error) {
    console.error("Checkout Error:", error);
    return { success: false, error: error.message };
  }
}



function createMerchantOrderId() {
  return new Date().getTime() + "";
}


function createRawRequest(prepayId) {
  let map = {
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    nonce_str: tools.createNonceStr(), // tools code you can download form demo
    prepay_id: prepayId,
    timestamp: tools.createTimeStamp(), // tools code you can download form demo
  };
  let sign = tools.signRequestObject(map); // tools code you can download form demo
  // order by ascii in array
  let rawRequest = [
    "appid=" + map.appid,
    "merch_code=" + map.merch_code,
    "nonce_str=" + map.nonce_str,
    "prepay_id=" + map.prepay_id,
    "timestamp=" + map.timestamp,
    "sign=" + sign,
    "sign_type=SHA256WithRSA",
  ].join("&");
  return rawRequest;
}



function createCheckoutUrl(prepayId){
  let rawRequest = createRawRequest(prepayId);
  return config.baseUrl + rawRequest + config.otherParams
}
