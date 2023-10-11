//console.log('Hello From Node.js. . . .')
const express = require(`express`);
const serverless = require(`serverless-http`);
const app = express();
// const PORT = 8001; //You can change this

app.get(`/hello`, (req, res) => {
  res.send(`<h1 align="center">Hello TOTO USA!!</h1>
  <h1 align="center">Hello Kenichi and Wischal!!</h1>
  <h1 align="center">* * * TOTO makes the best toilets in the world * * *</h1>`);
});

// app.listen(PORT, () => {
//   console.log(`Listening on port ${PORT}.`);
// });

module.exports.handler = serverless(app);