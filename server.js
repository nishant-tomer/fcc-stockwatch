
var express = require('express');

var app = express()

app.use(express.static( require("path").join(__dirname + "/client")))

app.get("/", function(req,res){
  
  res.sendFile( require("path").join(__dirname + "/client/index.html") )
  
})

app.listen(process.env.PORT || 3000);
