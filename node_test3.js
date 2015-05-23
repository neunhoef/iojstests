var HttpFast = require("./HttpFast19xx.js");

var N = 1000;

fs = require("fs");
b = fs.readFileSync("arangodb-testdata-max.json");
j = JSON.parse(b);
j = j.map(function(x) {
  delete x._id;
  delete x._key;
  delete x._rev;
  return new Buffer(JSON.stringify(x));
});

var h = new HttpFast("127.0.0.1", 8529, function () {

  var header = h.makeHeader({});

  var i,k;

  function incr () {
    if (i >= N) {
      return false;
    }
    k += 1;
    if (k >= j.length) {
      // console.log(i);
      k = 0;
      i += 1;
      if (i >= N) {
        return false;
      }
    }
    return true;
  }

  var counter;

  function callback (res) {
    //console.log("Hallo"+res.body.toString());
    counter += 1;
    if (incr()) {
      h.request("POST", "/_api/document?collection=c", header, j[k], callback);
      //h.request("POST", "/_api/document?collection=c", header, data, callback);
    }
    else {
      if (counter >= 100*N) {
        var t = new Date() - d;
        console.log("Total time for", N*100, "requests: ", t);
        console.log("Average time per request:", t/(N*100));
        h.close();
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////

  var d = new Date();
  var data = new Buffer("{}");

  counter = 0;
  i = 0;
  k = 99;
  for (l = 0; l < j.length; l++) {
    h.request("POST", "/_api/document?collection=c", header, j[l], callback);
  //  h.request("POST", "/_api/document?collection=c", header, data, callback);
  };
  //k = 9;
  //h.request("POST", "/_api/document?collection=c", header, j[0], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[1], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[2], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[3], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[4], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[5], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[6], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[7], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[8], callback);
  //h.request("POST", "/_api/document?collection=c", header, j[9], callback);
  //k = 0;
  //h.request("POST", "/_api/document?collection=c", header, j[0], callback);
  //h.request("POST", "/_api/document?collection=c", header, data, callback);
});

