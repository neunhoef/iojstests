var net = require("net");

var N = 1000000;

var counter=0;  // number of responses we got

function writeRequest () {
  s.write("GET /_api/version HTTP/1.1\r\n"+
          "Connection: keep-alive\r\n"+
          "\r\n");
}

function connected () {
  console.log("Connected to localhost:8529");
}

var buf = "";

function onDataFunc (data) {
  //console.log("Got some data:\n",data.toString());
  buf = buf + data.toString();
  if (buf.substr(0, 15) === "HTTP/1.1 200 OK" &&
      buf.substr(-1) === "}") {
    counter += 1;
    buf = "";
    if (counter < N) {
      writeRequest();
    }
    else {
      s.end();
    }
  }
}

function onEndFunc () {
  var t = new Date() - d;
  console.log("Done, time=", t, " ms");
  console.log("Average time per request: ", t/N, " ms");
}

console.log("Doing ", N, "HTTP requests on a keep-alive connection...");

var d = new Date();
var s = net.connect({host:"localhost", port:8529}, connected);
s.on("data", onDataFunc);
s.on("end",  onEndFunc);
writeRequest();
