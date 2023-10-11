const express = require('express');
const serverless = require('serverless-http');
const PORT = 8002; //You can change this

const app = express();

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/hello', (req, res) => {
  res.send(`<h1 align="center">Hello TOTO USA!!</h1>
  <h2 align="center">TGBS is not S/4HANA!!</h2>
  <h3 align="center">* * * Global Template is not really global * * *</h3>`);
});

if(process.env.ENVIRONMENT === 'lambda'){
      module.exports.handler = serverless(app)
}else {
      app.listen(PORT, () => {
        console.log(`Listening on port ${PORT}.`)
      })
}


