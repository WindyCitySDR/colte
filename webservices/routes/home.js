var express = require('express');
var router = express.Router();
var customer = require('../models/customer');
var app = require('../app');
var exec = require('child_process').exec;
const CHECK_STATUS = 0;
const ENABLE = 1;
const DISABLE = 2;

router.get('/', function(req, res, next) {
  res.render('home', {
    translate: app.translate,
    title: app.translate("Home"),
  });
});

router.post('/checkStatus', function(req, res, next) {
  var service = req.body.service;
  console.log("Request Service: " + JSON.stringify(service));  
  exec(getCall(service, CHECK_STATUS), function(err, out, stderr) {
    if (service == "kolibri") {
      if (err != null) {
        console.log("Error: " + err);
        console.log("disabled");
        res.status(500).send("disabled");
      } else {
        console.log("enabled");
        res.status(200).send("enabled");
      }
    } else {
      res.status(200).send("disabled");
    }
  });
});

router.post('/updateStatus', function(req, res, next) {
  var service = req.body.service;
  var checked = req.body.checked;
  console.log("Request Service: " + JSON.stringify(service));
  console.log("Request Checked: " + JSON.stringify(checked));
  console.log("Toggling Service: " + getCall(service, (checked == "true")? ENABLE : DISABLE));
  exec(getCall(service, (checked == "true") ? ENABLE : DISABLE), function(err, out, stderr) {
    if (err) {
      console.log("Error on enable/disable call: " + err);
      res.status(500).send("Something went wrong checking the webservices!");
    } else {
      console.log("Response: " + out); 
      res.status(200).send();
    }
  });
});

router.post('/transfer', function(req,res) {
  var source = req.body.source;
  var dest = req.body.dest;
  var amount = req.body.amount;

  console.log("TRANSFER source=" + source + " dest=" + dest + " amount=" + amount);
  customer.transfer_balance(source, dest, amount).catch((error) => {
    console.log("Transfer Error: " + error);
  })
  .then(function() {
    res.redirect('/home');
  });
});

router.post('/topup', function(req,res) {
  var imsi = req.body.imsi;
  var amount = req.body.amount;

  if (amount < 0) {
    console.log("NEGATIVE!!!");
  }

  console.log("TOPUP imsi=" + imsi + ", amount =" + amount);
  customer.top_up(imsi, amount).catch((error) => {
    console.log("Transfer Error: " + error);
  })
  .then(function() {
    res.redirect('/home');
  });
});

router.post('/details', function(req, res, next) {
  var imsi = req.body.imsi;

  console.log("DETAILS" + imsi);
  res.redirect('/details/' + imsi);
});

function getCall(service, status) {
  if (service == "kolibri") {
    if (status == CHECK_STATUS) {
      return "sudo kolibri status";
    } else if (status == ENABLE) {
      return "sudo kolibri start";
    } else {
      return "sudo kolibri stop";
    }
  } else {
    if (status == CHECK_STATUS) {
      return "echo sudo systemctl is-enabled " + service;
    } else if (status == ENABLE) {
      return "sudo systemctl enable " + service
    } else {
      return "sudo systemctl disable " + service
    }
  }
}

module.exports = router;
