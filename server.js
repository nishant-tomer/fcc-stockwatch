var express = require('express'),
    helmet = require('helmet'),
    https = require('https');

var app = express()
require("dotenv").config()
app.use(helmet())
app.set("views", require("path").join(__dirname + "/client"))
app.set("view engine","jade")
app.use(express.static(require("path").join(__dirname + "/client")))


var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
var stockSchema = new mongoose.Schema({
  name:  String,
  desc: String,
  selected:String
});
var Stock = mongoose.model('Stock', stockSchema)

app.get("/", function(req, res) {
    Stock.find({selected:"true"})
         .exec()
         .then(function(data){
           res.render("index.jade", {symbols:data})
         }, function(err){
           return err
         })

})
app.get("/stocks", function(req, res) {
    Stock.find({})
         .sort( { "name": 1} )
         .exec()
         .then(function(data){
           res.render("stockList.jade", {symbols:data})
         }, function(err){
           return err
         })

})

app.get("/stock/:name",function(req,res){
    if ( validate(req.params.name)) {
       getFromQuandl(res, req.params.name)
    }
    else {
        res.json({ error : "Invalid Code" })
      }
})


function setStock(name){
    return  Stock.update({name:name},{$set :{"selected":"true"}}).exec()
}

function resetStock(id){
    return  Stock.update({_id:id},{$set :{"selected":"false"}}).exec()
}

function getFromQuandl(response, name){

  var url = "https://www.quandl.com/api/v3/datasets/WIKI/"+name+
  ".json?start_date=2013-01-01&order=asc&api_key="+process.env.QUANDL_API_KEY
  var content = ''
  https.get(url, function(res){
          res.on('data', function(data){
                  content += data.toString()
              })
             .on('end', function(){
                    content = JSON.parse(content)
                      Stock.findOne({name:content.dataset.dataset_code}, function(err,stock){
                          if(err){ response.json({}) }
                          var seriesData = {}
                          seriesData.name = stock.name
                          seriesData._id = stock._id
                          seriesData.desc = stock.desc
                          seriesData.data = content.dataset.data
                          response.json( seriesData )
                        })
                    });
               })
              .on('error', function(e){
                  response.json({ error : "Invalid Code"})
              });
  }

function validate(string){
  var pattern = /^[A-Z]+$/
  if ( string.match(pattern) ) { return true }
  return false
}

var io = require("socket.io").listen( app.listen(process.env.PORT || 8080) )

io.sockets.on('connection', function(socket){
    socket.on("add",function(data){
      Stock.findOne({name:data.name}, function(err,stock){
          if (err){ console.log("error in add"); return null}
          if (stock.selected == "false"){
            setStock(data.name)
                    .then( function (success){
                      io.sockets.emit('add',{ "name" : data.name });
                    }, function(err){ console.log("error in add")})
          }
      })

    });
    socket.on("remove",function(data){
      resetStock(data.id)
              .then( function (success){
                   io.sockets.emit('remove',{ "id": data.id});
                 }, function(err){ console.log("error in remove")})
    });

});
