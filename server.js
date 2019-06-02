const express = require('express');
const app = express();

app.use(express.static(__dirname + '/public'));
const appServer = app.listen(8080);

const socketio = require('socket.io');

const io = socketio(appServer);

const helmet = require('helmet');

app.use(helmet());

console.log("Express and socket are been working");

module.exports = {
    io,
    app
}
