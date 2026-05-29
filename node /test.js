function asyncCheckOut(title, amount) {
fetch(`${config.baseUrl}/payment/v1/token`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId
    },
    body: JSON.stringify({
        appSecret: config.appSecret
    })
})
.then(res => res.json())
.then(json =>{
  console.log(json);

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
  req.sign_type = "SHA256WithRSA";
  //console.log(req);


fetch(`${config.baseUrl}/payment/v1/merchant/preOrder`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
        "Authorization": json.token,
    },
    body: JSON.stringify(req)
})
.then(res => res.json())
.then(jsn =>{

    console.log("=========================================================");
    console.log(jsn);
 console.log(createCheckoutUrl(jsn.biz_content.prepay_id))
    console.log("=========================================================");
    

}).catch(ex => console.error("error", ex));




} )
.catch(ex => console.error("error", ex));
}



function queryOrder(orderId) {
fetch(`${config.baseUrl}/payment/v1/token`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId
    },
    body: JSON.stringify({
        appSecret: config.appSecret
    })
})
.then(res => res.json())
.then(json =>{
  console.log(json);

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


fetch(`${config.baseUrl}/payment/v1/merchant/queryOrder`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
        "Authorization": json.token,
    },
    body: JSON.stringify(req)
})
.then(res => res.json())
.then(jsn =>{

    console.log("=========================================================");
    console.log(jsn);
    console.log("=========================================================");
    

}).catch(ex => console.error("error", ex));

} )
.catch(ex => console.error("error", ex));
}

function refundOrder(orderId, transactionId, amount) { fetch(`${config.baseUrl}/payment/v1/token`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId
    },
    body: JSON.stringify({
        appSecret: config.appSecret
    })
})
.then(res => res.json())
.then(json =>{
  console.log(json);

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
  

fetch(`${config.baseUrl}/payment/v1/merchant/refund`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "X-APP-Key": config.fabricAppId,
        "Authorization": json.token,
    },
    body: JSON.stringify(req)
})
.then(res => res.json())
.then(jsn =>{

    console.log("=========================================================");
    console.log(jsn);
 console.log(createCheckoutUrl(jsn.biz_content.prepay_id))
    console.log("=========================================================");
    

}).catch(ex => console.error("error", ex));




//console.log("response", json)
} )
.catch(ex => console.error("error", ex));
}
