var express = require('express');
var app = express();
var request = require('request');
var WiFiControl = require('wifi-control');
var storage = require('node-persist');

var CONNECT_RETRIES = 3;
var CHECK_TIMEOUT = 5000;

var serverState = {};

storage.init({}).then(function(){
  storage.getItem("serverState").then(function(value){
    if(value !== undefined){
      console.log("Got state!:"+JSON.stringify(value));
      serverState = value;
    }
    else
    {
      serverState = {};
    }
    applyState();
  });  
});




WiFiControl.init({
  debug: true
});

app.use(express.static('dist'));

function applyState(){
  //We were connected to a camera
  if(serverState.lastAp)
  {
    console.log("Connecting to last Ap...");
    connectToCamera(serverState.lastAp.ssid, "", serverState.lastAp.password, CONNECT_RETRIES, function(){
      console.log("Connected to last Ap: ("+serverState.lastAp.ssid+")");

    }, function(){
      serverState.lastAp = null;
      storage.setItem("serverState", serverState);
      console.log("Unable to connect to last ap");
    });
  }
  //We had tasks running
  if(serverState.tasks.length > 0)
  {
    //TODO: init tasks
  }
}

function pushIfNotExists(aps, ap){
  for(var i = 0; i < aps.length; i++)
  {
    if(aps[i].ssid == ap.ssid) return;
  }

  aps.push(ap);
}

function connectToCamera(network, pin, password, retries, cb, cberr){
  var ap={
    ssid: network,
    password: (password !== "undefined") ? password : "goprohero" //Default password
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
            connectToCamera(network, pin, password, retries, cb, cberr);
          },1000);
        }
        else
        {

          if(cberr) cberr();

        }
        
        return;
      }
      else
      {
        //THERE IS CONNECTION!
        cb(status);
        if(pin !== "undefined")
        {
          console.log("Pairing...");
          request({
            localAddress:'',
            method: 'GET',
            uri: 'https://10.5.5.9/gpPair?c=start&pin='+pin+'&mode=0',
            rejectUnauthorized: false
          },
          function (error, response, body)
          {
            if (!error && response.statusCode == 200)
            {
              request({
                localAddress:'',
                method: 'GET',
                uri: 'https://10.5.5.9/gpPair?c=finish&pin='+pin+'&mode=0',
                rejectUnauthorized: false
              },
              function (error, response, body)
              {
                
                if (!error && response.statusCode == 200)
                {                
                  console.log("Connected to "+network);
                  serverState.aps = serverState.aps || [];
                  pushIfNotExists(serverState.aps, ap);
                  serverState.lastAp = ap;
                  console.log("New server state:" + JSON.stringify(serverState));
                  storage.setItem("serverState", serverState);
                }
                else
                {
                  console.log("Error on finish pairing: "+JSON.parse(response.body).message);
                }
              })
            }
            else
            {
              console.log("Error on finish pairing: "+JSON.parse(response.body).message);
            }
          });
        }
      }
    });
      
  
  });
}

function checkConnection(cb){
  var resolved = false;
  setTimeout(function(){
    if(cb && !resolved){
      cb(false);
      console.log("Check connection [failed] (timeout)");
    } 
  }, CHECK_TIMEOUT);

  request({
    localAddress:'',
    method: 'GET',
    uri: 'http://10.5.5.9/gp/gpControl/status'
  },
  function (error, response, body)
  {
    console.log("helou2");
    if (!error && response.statusCode == 200)
    {
      console.log("Check connection [ok]");
      if(cb) cb(true, parseStatusObject(body));
    }
    else
    {
      console.log("Check connection [failed]");
      if(cb) cb(false);
    }
    resolved = true;

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

app.get('/init', function(req, res){
  res.json(serverState);
});

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

app.put('/connect/:network/:pin/:password', function(req, res){
  console.log("Connecting to: "+req.params.network + ", "+req.params.pin+"...");
  
  connectToCamera(req.params.network, req.params.pin, req.params.password, CONNECT_RETRIES, function(status){
    res.json(status);
  }, function(){
    res.status(404).json({msg: "No se ha podido conectar con la red"});
  });

});

app.delete('/disconnect', function(req, res){
  //TODO
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