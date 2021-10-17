class BaseGameFront
{
    static socket = null;
    constructor()
    {
        this.setUpServer();
    }

    setUpServer()
    {
        this.createSocketIO();
    }

    createSocketIO()
    {
        BaseGameFront.socket = io();
    }

    emit(name, data)
    {
        BaseGameFront.socket.emit(name, data);
    }

    on(name, callback)
    {
        BaseGameFront.socket.on(name, callback);
    }
}