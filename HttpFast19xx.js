'use strict';
var net = require("net");

// Only used for node.js without Buffer.prototype.indexOf:
function bufferIndexOf (b, s, pos) {
  if (! (s instanceof Buffer)) {
    s = new Buffer(s);
  }
  var L = b.length;
  var l = s.length;
  var m = 0;
  while (pos + m < L) {
    if (b[pos+m] === s[m]) {
      m += 1;
      if (m === l) {
        return pos;
      }
    }
    else {
      pos += 1;
      m = 0;
    }
  }
  return -1;
}

module.exports = 
((function(){"use strict";var PRS$0 = (function(o,t){o["__proto__"]={"a":t};return o["a"]===t})({},{});var DP$0 = Object.defineProperty;var GOPD$0 = Object.getOwnPropertyDescriptor;var MIXIN$0 = function(t,s){for(var p in s){if(s.hasOwnProperty(p)){DP$0(t,p,GOPD$0(s,p));}}return t};var proto$0={};

  function HttpFast (host, port, callback) {
    this.host = host;
    this.port = port;
    this.connected = false;
    this.s = net.connect({host: host, port: port}, function() {
      console.log("Connection established");
      this.connected = true;
      if (callback && typeof callback === "function") {
        callback();
      }
    });
    this.s.on("data", this.onDataCallback.bind(this));
    this.s.on("end",  this.onEndCallback.bind(this));
    this.s.setKeepAlive(true, 60000);
    this.reset()
    this.callbacks = [];
    this.cbPos = 0;
  }DP$0(HttpFast,"prototype",{"configurable":false,"enumerable":false,"writable":false});

  proto$0.toString = function () {
    if (this.connected) {
      return "<I am a FastHttp, connected to "+this.host+
             " on port "+this.port+">";
    }
    else {
      return "<I am an unconnected FastHttp>";
    }
  };

  proto$0.reset = function () {
    this.bufs = [];
    this.size = 0;
    this.headerComplete = false;
    this.header = new Buffer("");
    this.contentLength = null;
  };

  proto$0.makeHeader = function (header, noKeepAlive) {
    var l = [];
    if (! noKeepAlive) {
      l.push(new Buffer("Connection: keep-alive\r\n"));
    }
    for (var f in Object.keys(header)) {
      l.push(new Buffer(f+": "+header[f].toString()+"\r\n"));
    }
    return Buffer.concat(l);
  };

  proto$0.request = function (method, path, header, body, callback) {
    this.callbacks.push(callback);
    var toWrite = [];
    toWrite.push(new Buffer(method + " " + path + " HTTP/1.1\r\n"));
    toWrite.push(header);
    var len;
    if (body instanceof Buffer) {
      len = body.length;
    }
    else {
      len = Buffer.byteLength(body);
    }
    toWrite.push(new Buffer("Content-Length: "+len+"\r\n\r\n"));
    if (len > 2048000) {
      this.s.write(Buffer.concat(toWrite));
      this.s.write(body);
    }
    else {
      if (body instanceof Buffer) {
        toWrite.push(body);
      }
      else {
        toWrite.push(new Buffer(body));
      }
      var x = Buffer.concat(toWrite);
      this.s.write(Buffer.concat(toWrite));
    }
  };

  proto$0.onDataCallback = function (data) {
    //console.log("Got some data:\n"+data.toString());

    // First note the new data, either for the header or in bufs:
    if (! this.headerComplete) {
      if (this.header.length === 0) {
        this.header = data;
      }
      else {
        this.header = Buffer.concat(this.header, data);
      }
    }
    else {
      this.bufs.push(data);
      this.size += data.length;
    }

    while (true) {
      //console.log("Loop:", this.contentLength, this.headerComplete);
      if (! this.headerComplete) {
        var pos = 0;
        var pos2 = void 0;
        if (this.contentLength === null) {
          //console.log("Header is:\n"+this.header.toString());
          if (this.header.indexOf === undefined) {
            pos = bufferIndexOf(this.header, "Content-Length: ", 0);
          }
          else {
            pos = this.header.indexOf("Content-Length: ");
          }
          if (pos >= 0) {
            if (this.header.indexOf === undefined) {
              pos2 = bufferIndexOf(this.header, "\r\n", pos+15);
            }
            else {
              pos2 = this.header.indexOf("\r\n", pos+15);
            }
            this.contentLength = Number(this.header.slice(pos+15, pos2));
            //console.log("Content-Length found: ", this.contentLength);
            pos = pos2;  // Look for end of header from here
          }
          else {
            return;
          }
        }

        if (this.header.indexOf === undefined) {
          pos2 = bufferIndexOf(this.header, "\r\n\r\n", pos);
        }
        else {
          pos2 = this.header.indexOf("\r\n\r\n", pos);
        }
        //console.log("Position of end of header:", pos2);
        if (pos2 >= 0) {
          this.bufs = [this.header.slice(pos2+4)];
          this.size = this.bufs[0].length;
          this.header = this.header.slice(0, pos2+4);
          this.headerComplete = true;
          //console.log("Header is complete");
        }
        else {
          return;
        }
      }

      if (this.size >= this.contentLength) {
        //console.log("Response complete");
        var res = void 0, callback = void 0, raus = void 0;
        if (this.size === this.contentLength) {
          //console.log("Got complete request");
          res = { header: this.header,
                  body: Buffer.concat(this.bufs),
                  contentLength: this.contentLength }
          this.reset();
          raus = true;
        }
        else {
          //console.log("Urgs: Got more than one response at a time!",
          //            this.size - this.contentLength);
          var con = Buffer.concat(this.bufs);
          var len = this.contentLength;
          res = { header: this.header,
                  body: con.slice(0, this.contentLength),
                  contentLength: len };
          this.reset();
          this.header = con.slice(len);
          raus = false;
        }
        callback = this.callbacks[this.cbPos];
        this.cbPos += 1;
        if (this.cbPos >= this.callbacks.length) {
          this.cbPos = 0;
          this.callbacks = [];
        }
        callback(res);
        if (raus) {
          return;
        }
      }
    }
  };

  proto$0.onEndCallback = function () {
    console.log("connection closed");
    this.connected = false;
  };

  proto$0.close = function () {
    this.s.end();
  };
MIXIN$0(HttpFast.prototype,proto$0);proto$0=void 0;return HttpFast;})());

