const express = require('express');
const app = express();
const httpsServer = require("http").createServer(app)
const Jeopardy = require('./games/jeopardy');

const { Server } = require('socket.io');
const io = new Server(httpsServer);

const port = 80;

app.use(express.static('./public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/controller', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/presenter', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

httpsServer.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

new Jeopardy(io);