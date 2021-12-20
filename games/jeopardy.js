const BaseGame = require('./BaseGame');

class Jeopardy extends BaseGame
{
    connections = {
        controller: {},
        presenter: {},
        players: [],
    }

    gameState = 'waiting-room'

    constructor(socket) {
        super(socket);
        this.setUpListeners()
    }

    setUpListeners()
    {
        this.socket.on('connect', socket => this.createListeners(socket));
    }

    createListeners(socket)
    {
        socket.on('player-joined', (data) => this.playerJoined(socket, data));

        socket.on('controller-joined', (data) => this.controllerJoined(socket, data));

        socket.on('presenter-joined', (data) => this.presenterJoined(socket, data));

        socket.on('disconnect', () => this.userDisconnected(socket));
    }

    playerJoined(socket, data)
    {
        if (this.connections.players.length >= 3) {
            socket.emit('connect-error', 'Too many players connected!');
            return;
        }

        const player = {
            id: socket.id,
            session: data.session,
            nickname: data.nickname
        };

        this.connections.players.push(player);

        console.log(`${player.nickname} has connected!`);

        this.emitControllerData(this.socket);
    }

    controllerJoined(socket, data)
    {
        if (
            Object.keys(this.connections.controller).length &&
            this.connections.controller.session !== data.session
        ) {
            socket.emit('connect-error', 'There is already a controller!');
            return;
        }

        this.emitControllerData(socket);

        this.connections.controller = {
            id: socket.id,
            session: data.session
        }

        console.log('A controller has connected!');
    }

    emitControllerData(socket)
    {
        socket.emit('controller-data', this.getControllerData());
    }

    getControllerData()
    {
        return {
            players: this.connections.players,
            status: this.gameState
        }
    }

    presenterJoined(socket, data)
    {
        this.emitPresenterData(socket);

        console.log('A presenter has connected');
    }

    emitPresenterData(socket)
    {
        socket.emit('presenter-data', this.getPresenterData());
    }

    getPresenterData()
    {
        return {
            players: this.connections.players,
            status: this.gameState
        }
    }

    userDisconnected(socket)
    {
    }

    removeUser(id)
    {
        this.removeController(id);
        this.removePresenter(id);
        this.removePlayers(id);
    }

    removeController(id)
    {
        if (
            !this.connections.controller.hasOwnProperty('id') ||
            this.connections.controller.id !== id
        ) {
            return;
        }

        this.connections.controller = {};
    }

    removePresenter(id)
    {
        if (
            !this.connections.presenter.hasOwnProperty('id') ||
            this.connections.presenter.id !== id
        ) {
            return;
        }

        this.connections.presenter = {};
    }

    removePlayers(id)
    {
        for (let i = 0; i < this.connections.players.length; i++) {
            this.removePlayer(i, id);
        }
    }

    removePlayer(i, id)
    {
        let player = this.connections.players[i];

        if (
            !player.hasOwnProperty('id') ||
            player.id !== id
        ) {
            return;
        }

        this.connections.players.splice(i, 1);

        console.log(`${player.nickname} has disconnected!`);
    }
}

module.exports = Jeopardy;