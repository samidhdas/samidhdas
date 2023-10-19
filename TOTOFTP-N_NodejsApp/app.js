var express = require('express');
var app = express();

app.get('/get', function (req, res) {
  res.send('Hello World!');
});

app.listen(8002, function () {
  console.log('Example app listening on port 8002!');
});