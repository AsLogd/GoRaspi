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

    checkConnection(function(connected, status){
      if(!connected)
      {
        //There is no connection
        console.log("Could not connect(19): "+response.msg);
        retries--;
        if(retries > 0)
        {
          console.log("Retrying...("+retries+")");
          setTimeout(function(){
            connectToCamera(req, res, retries);
          },1000);
        }
        
        return;
      }
      else
      {
        //THERE IS CONNECTION!
        res.json(status);

        console.log("Pairing...");
        request({
          localAddress:'',
          method: 'GET',
          uri: 'https://10.5.5.9/gpPair?c=start&pin='+req.params.pin+'&mode=0',
          rejectUnauthorized: false
        },
        function (error, response, body)
        {
          if (!error && response.statusCode == 200)
          {
            request({
              localAddress:'',
              method: 'GET',
              uri: 'https://10.5.5.9/gpPair?c=finish&pin='+req.params.pin+'&mode=0',
              rejectUnauthorized: false
            },
            function (error, response, body)
            {
              
              if (!error && response.statusCode == 200)
              {                
                console.log("Connected to "+req.params.network);
              }
              else
              {
                console.log("Error on finish pairing"+JSON.stringify(response));
              }
            })
          }
          else
          {
            console.log("Error on finish pairing"+JSON.stringify(response));
          }
        });
      }
    });
      
  
  });
}

function checkConnection(cb){
  request({
    localAddress:'',
    method: 'GET',
    uri: 'http://10.5.5.9/gp/gpControl/status'
  },
  function (error, response, body)
  {
    if (!error && response.statusCode == 200)
    {
      console.log("Check connection:"+JSON.stringify(body));
      if(cb) cb(true, body.status);
    }
    else
    {
      console.log("Check connection failed");
      if(cb) cb(false);
    }


  });
}

function parseStatusObject(body){
  body = JSON.parse(body);
  var obj = {};
  obj.battery = {
    available: (body.status["1"] == 1),
    level: body.status["2"]
  };
  
  if(body.status["43"] == 0)
    obj.mode = "Video";
  else if(body.status["43"] == 1)
    obj.mode = "Foto";
  else
    obj.mode = "MultiShot";

  obj.streaming = (body.status["32"] == 1);

  obj.storage = {
    remainingPhotos: body.status["34"],
    photosTaken: body.status["38"]
  };


  return obj;

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

app.get('/cameraStatus', function(req, res){
  request({
    localAddress:'',
    method: 'GET',
    uri: 'http://10.5.5.9/gp/gpControl/status'
  },
  function (error, response, body)
  {
    if (!error && response.statusCode == 200)
    {
      console.log("Status recibido: "+ JSON.stringify(body));
      res.json(parseStatusObject(body));
    }
    else
    {
      res.json({error:error});
    }
  })
});

app.put('/connect/:network/:pin', function(req, res){
  console.log("Connecting to: "+req.params.network + ", "+req.params.pin+"...");
  
  connectToCamera(req, res, CONNECT_RETRIES);

});

//Debug pourposes
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