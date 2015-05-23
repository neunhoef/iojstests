var N=100;
var Database = require('arangojs');
//var o = { maxSockets: 1, keepAlive: true, keepAliveMsecs: 1000 };
var o = { maxSockets: 1, keepAlive: true, maxFreeSockets: 10, keepAliveMsecs: 1000 };
var Agent = require('http').Agent;

var db = new Database({
  url: 'http://127.0.0.1:8529',
  agent: new Agent(o),
  fullDocument: false,
  promisify: false
});

db.collection("c",function(err, c) {

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

  var counter;

  function callback (err, res) {
    counter += 1;
    if (err) {
      throw err;
    }
    if (incr()) {
      c.save(j[k], callback);
    }
    else {
      if (counter >= N*100) {
        var t = new Date() - d;
        console.log("Total time for", N*100, "requests: ", t, "ms");
        console.log("Average time per request:", t/(N*100), "ms");
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////

  var d = new Date();

  counter = 0;
  i = 0;
  k = 99;
  for (l = 0; l < j.length; l++) {
    c.save(j[l], callback);
  };

});
