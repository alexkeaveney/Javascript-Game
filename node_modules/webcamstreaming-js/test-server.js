var app = require('express')();
var http = require('http').Server(app);
var lib = require(__dirname + "/main.js")
var lib = new lib(app,http);

app.get('/',function(req,res){
	lib.sendFile(__dirname + "/test-html.html",res);
})

// app.get('/', function(req, res){
// 	console.log("HERE");
// 	res.end("here");
//   // lib.sendFile(__dirname + '/test-html.html');

// });


http.listen(3000, function(){
  console.log('listening on *:3000');
});