"use strict";

var fs = require("fs")


class Library{
	constructor(app,http,io){
		var rooms = {};
		this.io = require('socket.io')(http);
		var that = this;
		app.get("/compressor",function(q,s){
			s.sendFile(__dirname + "/lz-string.js")
		})
		this.io.on('connection', function(socket) {
		  console.log('a user connected');

		  socket.on("register",function(data){
		  	if(rooms[data.nickname]){
		  		rooms[data.nickname].push(socket.id);
		 	 } else {
		 	 	rooms[data.nickname] = [socket.id]
		 	 }
		  })

		   socket.on('picdata',function(data){
		   	if(!rooms[data.name]){
		   		rooms[data.name] = [];
		   	}
		   	var to = rooms[data.name];
		   	to.forEach(function(scket){
		   		that.io.to(scket).emit('broadcast',data);
		   	})
		    //console.log(data)
		      //that.io.sockets.emit('broadcast',data);
		    })
		})
	}

	sendFile(path,res){
		// res.send("YO");
		var toinsert = fs.readFileSync(__dirname + "/toInstall.html","utf8");
		var html = fs.readFileSync(path,"utf8");
		var index = html.indexOf("<head>") + 7;
		//console.log(path);
		html = html.slice(0,index) + toinsert + html.slice(index)

		res.end(html);
	}
}




module.exports = Library;