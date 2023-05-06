// the express package will run our server
const express = require("express");
const app = express();
app.use(express.static("public")); // this line tells the express app to 'serve' the public folder to clients

// HTTP will expose our server to the web
const http = require("http").createServer(app);

// start our server listening on port 8080 for now (this is standard for HTTP connections)
const server = app.listen(8080);
console.log("Server is running on http://localhost:8080");

/////SOCKET.IO///////
const io = require("socket.io")().listen(server);

let inputs = io.of('/input');
let output1 = io.of('/output1');
let output2 = io.of('/output2');
let output3 = io.of('/output3');

inputs.on('connection', function (socket) {
    console.log('input side connected:' + socket.id);
    socket.on('atom', function (data) {
        let now = Date.now();
        console.log('new atoms', socket.id, now);

        output1.emit('atom', data);
        output2.emit('atom', data);
        output3.emit('atom', data);
    });
});

output1.on('connection', function (socket) {
    console.log('output1 is connected:' + socket.id);

    socket.on('disconnect', function () {
        console.log('an output client has disconnected' + socket.id);
    });

});

output2.on('connection', function (socket) {
    console.log('output2 is connected:' + socket.id);

    socket.on('disconnect', function () {
        console.log('an output client has disconnected' + socket.id);
    });
});

output3.on('connection', function (socket) {
    console.log('output3 is connected:' + socket.id);

    socket.on('disconnect', function () {
        console.log('an output client has disconnected' + socket.id);
    });
});


