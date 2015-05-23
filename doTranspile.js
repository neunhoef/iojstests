"use strict";
let es6tr = require("es6-transpiler");
let result = es6tr.run({filename: "HttpFast.js"});
let fs = require("fs");
fs.writeFileSync("HttpFast19xx.js", result.src);
