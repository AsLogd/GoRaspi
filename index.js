var express = require('express');
var app = express();
var request = require('request');
var WiFiControl = require('wifi-control');

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
  var ap={
    ssid: req.params.network,
    password: "goprohero" //Default password
  };

  WiFiControl.connectToAp(ap, function(err, response){
    if(err) console.log(err);
    console.log(response.msg);
    if(response.success)
    {
      request({
        localAddress:'',
        method: 'GET',
        uri: 'https://10.5.5.9/gpPair?c=start&pin='+req.params.pin+'&mode=0'
      },
      function (error, response, body)
      {
        if (!error && response.statusCode == 200)
        {
          res.json({success:true});
          console.log("Connected to "+req.params.network);
        }
      })
    }
  });

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