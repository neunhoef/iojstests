var http = require("http");

var N = 1000;

//var o = { maxSockets: 1, keepAlive: true, keepAliveMsecs: 1000 };
var o = { maxSockets: 1, keepAlive: true, maxFreeSockets: 256, keepAliveMsecs: 1000 };
var Agent = require('http').Agent;
var ag = new Agent(o);

///////////////////////////////////////////////////////////////////////

fs = require("fs");
b = fs.readFileSync("arangodb-testdata-max.json");
j = JSON.parse(b);
j = j.map(function(x) {
  delete x._id;
  delete x._key;
  delete x._rev;
  return JSON.stringify(x);
});

var i,k;

function incr () {
  if (i >= N) {
    return false;
  }
  k += 1;
  if (k >= j.length) {
    //console.log(i);
    k = 0;
    i += 1;
    if (i >= N) {
      return false;
    }
  }
  return true;
}

var schicken;

function callback (res) {
  //console.log("callback"+res.body);
  res.on("data", callback2);
  res.on("end", callback3);
}

function callback2 (res) {
  //console.log("callback2"+ res);
}

var counter;

function callback3 (res) {
  counter += 1;
  if (incr()) {
    schicken(k);
  }
  else {
    if (counter >= N*100) {
      var t = new Date() - d;
      console.log("Total time for",N*100,"requests: ", t);
      console.log("Average time per request:",t/(N*100));
    }
  }
}

function schicken (l) {
  var h = http.request({ method: "POST",
                         //agent: http.globalAgent,
                         agent: ag,
                         hostname: "localhost",
                         port: 8529,
                         path: "/_api/document?collection=c",
                         headers: {
                           "content-length": Buffer.byteLength(j[l], "utf-8")
                         }
                       }, callback);
  h.on("upgrade", function(x) { console.log("UPGRADE"); });
  h.end(j[l]);
}

///////////////////////////////////////////////////////////////////////

var d = new Date();

counter = 0;
i = 0;
k = 99;
for (l = 0; l < j.length; l++) {
  schicken(l);
};


