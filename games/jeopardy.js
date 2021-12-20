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

        // TODO: Alert controller + presenter of new players
    }

    controllerJoined(socket, data)
    {
        // TODO: Add check that it's not just controller reconnecting
        if (!Object.keys(this.connections.controller).length) {
            socket.emit('connect-error', 'There is already a controller!');
        }

        socket.emit('data', {
            players: this.connections.players
        });


        this.connections.controller = {
            id: socket.id,
            session: data.session
        }
    }

    presenterJoined(socket, data)
    {

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