Easily insert video-streaming capabilities into your Node applications

** This library lets you implement simple client to client live video-streaming in only five steps

1. Instantiate your node application and an http server (make sure to npm install http)

~~~js
var app = require('express')();
var http = require('http').Server(app);
~~~

2. Require the nodevideostreaming library

~~~js
  var lib = require("webcamstreaming-js");
~~~

3. Create a new instance of the library by passing your app and the server as arguments

~~~js
  var lib = new lib(app,http);
~~~

4. Serve your html files through your app using the sendFile function on the lib, not the native sendFile function

~~~js
app.get('/',function(req,res){
	lib.sendFile(__dirname + "/test-html.html",res);
})
~~~

5. Your html file now has two helper functions defined: insertStreamer and insertClient. Both take two arguments: the first argument is a string representing the id of a div in your html, the second is a string representing the name you want to give to this users stream. Having named streams lets you allow users to sign into other user's streams (e.g. "rooms functionality")

~~~js
//API:
//insertStream(divName,streamName)
//insertClient(divName,streamName)	

~~~
insertStreamer opens the user's webcam and begins streaming video. It also attaches a video to the div whose id you passed in, so that the user can see their own cameras output

Example: to start streaming from a webcam on a stream named "myStream", your html could look like this

~~~html
<html>
	<head>
	</head>
	<body>
		<div id ="Test"></div>
		<script>
			insertStreamer("Test","myStream");
		</script>
	</body>
</html>

~~~html
This will only work if you've served your html file using the librarys sendFile function

Then, to receive the streamed video, you run insertClient from the html. insertClient will receive any video that is streaming through your server under the specified streamname. It will insert a video of the feed into the div you specified in the first argument

Example: To receive streaming video, you could do this: 

~~~html
<html>
	<head>
	</head>
	<body>
		<div id ="Test"></div>
		<script>
			insertClient("Test","myStream");
		</script>
	</body>
</html>
~~~


You can use insertStream and insertClient in combination with user input to set up an app that allows users to stream to different rooms.

Note: This is a naive webstreaming solution using getusermedia (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia). For large projects use webrtc (https://webrtc.org/)

