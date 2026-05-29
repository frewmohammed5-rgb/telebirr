const tools = require("./tools");
const config = require("./config");

// Add this line at the absolute top of your script file (Local testing only!)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


async function main(){

// const refund = await refundOrder("ORDER_12345", "REFUND_REQ_001", 500);
// console.log("Refund Result:", refund);
  

// const query = await queryOrder("YOUR_MERCHANT_ORDER_ID_HERE");
// console.log("Query Result:", query);

const result = await checkOut("Shoes", "500");
console.log("Checkout Result:", result);
//asyncCheckOut("Shoes", "500")
}

main().catch(error => console.error("Error in main execution:", error));


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
    console.log(tokenData);

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

    console.log("=========================================================");
    console.log(refundData);
    console.log("=========================================================");

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
    console.log(tokenData);

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

    console.log("=========================================================");
    console.log(queryData);
    console.log("=========================================================");

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
    //console.log(tokenData);

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



/*


exports.createOrder = async (req, res) => {
  let title = req.body.title;
  let amount = req.body.amount;
  let applyFabricTokenResult = await applyFabricToken();
  let fabricToken = applyFabricTokenResult.token;
  console.log("fabricToken =", fabricToken);
  let createOrderResult = await exports.requestCreateOrder(
    fabricToken,
    title,
    amount
  );
  console.log(createOrderResult);
  let prepayId = createOrderResult.biz_content.prepay_id;
  let rawRequest = createRawRequest(prepayId);
  console.log("RAW_REQ: ", rawRequest);
  res.send(rawRequest);
  return rawRequest;
};

exports.requestCreateOrder = async (fabricToken, title, amount) => {
  try {
    const reqObject = createRequestObject(title, amount);
    console.log(reqObject);

    const response = await axios.post(
      `${config.baseUrl}/payment/v1/merchant/preOrder`,
      reqObject,
      {
        headers: {
          "Content-Type": "application/json",
          "X-APP-Key": config.fabricAppId,
          Authorization: fabricToken,
        },
      }
    );

    // Assuming your response is a JSON object, no need to parse it
    return response.data;
  } catch (error) {
    console.error("Error while requesting create order:", error.message);
    throw error; // Propagate the error for handling at a higher level
  }
};

function createRequestObject(title, amount) {
  let req = {
    timestamp: tools.createTimeStamp(),
    nonce_str: tools.createNonceStr(),
    method: "payment.preorder",
    version: "1.0",
  };
  let biz = {
    // notify_url: "https://node-api-muxu.onrender.com/api/v1/notify",
    trade_type: "InApp",
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    merch_order_id: createMerchantOrderId(),
    title: "Game1",
    total_amount: "150",
    trans_currency: "ETB",
    timeout_express: "120m",
    payee_identifier: config.merchantCode,
    payee_identifier_type: "04",
    payee_type: "5000",
    // redirect_url: "https://216.24.57.253/api/v1/notify",
  };
  req.biz_content = biz;
  req.sign = tools.signRequestObject(req);
  req.sign_type = "SHA256WithRSA";
  console.log(req);
  return req;
}

function createMerchantOrderId() {
  return new Date().getTime() + "";
}

function createRawRequest(prepayId) {
  let map = {
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    nonce_str: tools.createNonceStr(),
    prepay_id: prepayId,
    timestamp: tools.createTimeStamp(),
  };
  let sign = tools.signRequestObject(map);
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
  console.log("rawRequest = ", rawRequest);
  return rawRequest;
}


*/