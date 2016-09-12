var express = require('express');
var app = express();
var request = require('request');
var WiFiControl = require('wifi-control');
var storage = require('node-persist');
var cron = require('node-cron');
var sys = require('sys')
var exec = require('child_process').exec;



var CONNECT_RETRIES = 3;
var CHECK_TIMEOUT = 5000;

var _tasksReference = {};
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
  if(serverState.tasks && serverState.tasks.length > 0)
  {
    serverState.tasks.forEach(function(task){
      console.log("Scheduling task "+task.name+"...");
      scheduleTask(task);
      
    });
  }
  else
  {
    serverState.tasks = [];
  }
}

function scheduleTask(task)
{
  _tasksReference[task.name] = cron.schedule(task.cron, function(){
    //Force photo mode
    request({
      localAddress:'',
      method: 'GET',
      uri: 'http://10.5.5.9/gp/gpControl/command/mode?p=1'
    },
    function (error, response, body)
    {
      //Mode changed
      if (!error && response.statusCode == 200)
      {
        //Take photo
        request({
          localAddress:'',
          method: 'GET',
          uri: 'http://10.5.5.9/gp/gpControl/command/shutter?p=1'
        },
        function (error, response, body)
        {
          //Photo taken
          if (!error && response.statusCode == 200)
          {
            console.log("[CRON] took a photo");
          }
          else
          {
            console.log("[CRON] couldn't take a photo");
          }

        });
      }
      else
      {
        console.log("[CRON] couldn't change to photo mode");
      }

    });
  
  });


}

function unscheduleTask(name){
  _tasksReference[name].destroy();
}

function pushIfNotExists(aps, ap){
  for(var i = 0; i < aps.length; i++)
  {
    if(aps[i].ssid == ap.ssid) return;
  }

  aps.push(ap);
}

function addTaskIfNotExists(tasks, task){
  for(var i = 0; i < tasks.length; i++)
  {
    if(tasks[i].name == task.name) return false;
  }

  tasks.push(task);

  return true;
}

function deleteTask(tasks, name){
  for(var i = 0; i < tasks.length; i++)
  {
    if(tasks[i].name == name)
    {
      tasks.splice(i, 1);
      return true;
    }
  }

  return false;
}

function connectToExisting(network, password, retries, cb, cberr){
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
        console.log("Connected to "+network);
        serverState.aps = serverState.aps || [];
        pushIfNotExists(serverState.aps, ap);
        serverState.lastAp = ap;
        console.log("New server state:" + JSON.stringify(serverState));
        storage.setItem("serverState", serverState);
      }
    });
      
  
  });
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
            uri: 'https://10.5.5.9/gpPair?c=start&pin='+pin+'&mode=1',
            rejectUnauthorized: false
          },
          function (error, response, body)
          {
            if (!error && response.statusCode == 200)
            {
              request({
                localAddress:'',
                method: 'GET',
                uri: 'https://10.5.5.9/gpPair?c=finish&pin='+pin+'&mode=1',
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
    if(!resolved)
    {
      resolved = true;
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

app.get('/init/:timestamp', function(req, res){
  res.json(serverState);
  console.log("Sync date..."+(req.params.timestamp));
  exec('date +%s -s @'+req.params.timestamp);
});

app.get('/getStatus', function(req, res){
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
      console.log("Status recibido");
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
  
  if(req.params.pin === undefined)
  {
    connectToExisting(req.params.network, req.params.password, CONNECT_RETRIES, function(status){
      res.json(status);
    }, function(){
      if(!res.headersSent)
        res.status(404).json({msg: "No se ha podido conectar con la red"});
    });
  }
  else
  {
    connectToCamera(req.params.network, req.params.pin, req.params.password, CONNECT_RETRIES, function(status){
      res.json(status);
    }, function(){
      if(!res.headersSent)
        res.status(404).json({msg: "No se ha podido conectar con la red"});
    });
    
  }


});

app.put('/task/:name/:action/:cron', function(req, res){
  var task = {
    name: req.params.name,
    action: req.params.action,
    cron: req.params.cron
  };
  addTaskIfNotExists(serverState.tasks, task);
  storage.setItem("serverState", serverState);
  console.log("New task created: "+JSON.stringify(task));
  scheduleTask(task);
  res.send({success:true});

});

app.delete('/task/:name', function(req, res){
  if(deleteTask(serverState.tasks, req.params.name))
  {
    storage.setItem("serverState", serverState);
    console.log("Task deleted: "+req.params.name);
    unscheduleTask(req.params.name);
  }
  res.send({success:true});

});

app.delete('/reboot', function(req, res){
  res.send();
  console.log("Rebooting...");
  exec("reboot");
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