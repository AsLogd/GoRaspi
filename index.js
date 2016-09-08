var express = require('express');
var app = express();
var request = require('request');
var WiFiControl = require('wifi-control');

var CONNECT_RETRIES = 3;

function connectToCamera(req, res, retries){
  var ap={
    ssid: req.params.network,
    password: "goprohero" //Default password
  };
  WiFiControl.connectToAP(ap, function(err, response){
    if(err)
    {
      console.log("Retrying...");
      retries--;
      setTimeout(function(){
        connectToCamera(req, res, retries);
      },1000);
      
      return;
    }
    console.log("Pairing...");
    request({
      localAddress:'',
      method: 'GET',
      uri: 'https://10.5.5.9/gpPair?c=start&pin='+req.params.pin+'&mode=0',
      rejectUnauthorized: false
    },
    function (error, response, body)
    {
      if(error) console.log("Error on start pairing:"+error);
      if (!error && response.statusCode == 200)
      {
        res.json({success:true});
        request({
          localAddress:'',
          method: 'GET',
          uri: 'https://10.5.5.9/gpPair?c=finish&pin='+req.params.pin+'&mode=0',
          rejectUnauthorized: false
        },
        function (error, response, body)
        {
          if(error) console.log("Error on finish pairing:"+error);
          if (!error && response.statusCode == 200)
          {
            res.json({success:true});
            
            console.log("Connected to "+req.params.network);
          }
        })
      }
    });
  
  });
}

WiFiControl.init({
  debug: true
});

app.use(express.static('dist'));

app.get('/networks', function(req, res){
  WiFiControl.scanForWiFi( function(err, response) {
    if (err) console.log(err);
    res.json(response.networks);
  });
});

app.put('/connect/:network/:pin', function(req, res){
  console.log("Connecting to: "+req.params.network + ", "+req.params.pin+"...");
  
  connectToCamera(req, res, CONNECT_RETRIES);

});

app.get('/photo', function(req, res){
  request({
    localAddress:'',
    method: 'GET',
    uri: 'http://10.5.5.9/gp/gpControl/command/shutter?p=1'
  },
  function (error, response, body)
  {
    if (!error && response.statusCode == 200)
    {
      console.log(body) // Show the HTML for the Google homepage.
      res.send('Photo taken!');
    }
  })
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});