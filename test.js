var N = 100000;
var HttpFast = require("./HttpFast.js");
var count = 0;
console.log("Doing", N, "requests.");
var h = new HttpFast("localhost", 8529, function() {
  var send;
  var header = h.makeHeader({});
  var d;
  function c(x) { 
    count += 1;
    if (count < N) {
      send();
    }
    else {
      var t = new Date() - d;
      console.log("Time: ", t, "ms");
      console.log("Average per request: ", t/N, " ms");
      h.close();
    }
  }
  send = function () {
    h.request("GET", "/_api/version", header, "", c);
  }
  
  d = new Date();
  send();
});
