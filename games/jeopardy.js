const BaseGame = require('./BaseGame');
const gameData = {
    game1: require('./jeopardy/game-1.json'),
    game2: require('./jeopardy/game-2.json'),
}

class Jeopardy extends BaseGame
{
    connections = {
        controller: {},
        players: [],
    }

    game = {
        state: 'waiting-room',
        name: 'game1',
        data: {},
        progress: {
        }
    }

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

        socket.on('player-attempt-joined', (data) => this.playerAttemptingJoin(socket, data));

        socket.on('controller-joined', (data) => this.controllerJoined(socket, data));

        socket.on('presenter-joined', (data) => this.presenterJoined(socket, data));

        socket.on('start-game', (data) => this.startGame(data));
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
            nickname: data.nickname,
            points: 0
        };

        this.connections.players.push(player);

        console.log(`${player.nickname} has connected!`);

        this.emitPlayerJoinData(socket, player.nickname);

        this.emitControllerData(this.socket);
        this.emitPresenterData(this.socket);
    }

    playerAttemptingJoin(socket, data)
    {
        for (let i = 0; i < this.connections.players.length; i++) {
            let player = this.connections.players[i];

            if (player.session !== data.session) {
                continue;
            }

            this.emitPlayerJoinData(socket, player.nickname);

            this.connections.players[i].id = socket.id;
            return;
        }

        socket.emit('join-attempt-failed')
    }

    emitPlayerJoinData(socket, nickname)
    {
        socket.emit('join-attempt-successful', {
            nickname: nickname,
            gameState: this.game.state
        })
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
    }

    emitControllerData(socket)
    {
        socket.emit('controller-data', this.getControllerData());
    }

    getControllerData()
    {
        return {
            players: this.connections.players,
            status: this.game.state,
            availableGames: Object.keys(gameData),
            gameData: this.game.data,
            gameProgress: this.game.progress
        }
    }

    presenterJoined(socket, data)
    {
        this.emitPresenterData(socket);
    }

    emitPresenterData(socket)
    {
        socket.emit('presenter-data', this.getPresenterData());
    }

    getPresenterData()
    {
        return {
            players: this.connections.players,
            status: this.game.state,
            gameData: this.game.data,
            gameProgress: this.game.progress
        }
    }

    startGame(data)
    {
        this.game.name = data.game;
        this.game.state = 'first-round'
        this.game.data = gameData[this.game.name];

        this.socket.emit('game-starting');
        this.emitControllerData(this.socket);
        this.emitPresenterData(this.socket)
    }
}

module.exports = Jeopardy;