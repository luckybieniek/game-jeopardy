window.onload = () => new JeopardyFront();

class JeopardyFront
{
    mode = 'player'
    modeMap = {
        player: JeopardyPlayer,
        controller: JeopardyController,
        presenter: JeopardyPresenter,
    };

    constructor() {
        this.start();
    }

    start()
    {
        this.mode = this.getMode();
        this.validateMode();
        new (this.getModeClass())();
    }

    getMode()
    {
        let mode = location.pathname.replaceAll('/', '').toLowerCase();
        return mode ? mode : 'player'
    }

    validateMode()
    {
        const allowedModes = Object.keys(this.modeMap);
        if (!allowedModes.includes(this.mode)) {
            throw 'Disallowed mode given';
        }
    }

    getModeClass()
    {
        return this.modeMap[this.mode];
    }
}

class BaseJeopardy extends BaseGameFront
{
    app = null;
    errors = [];

    constructor() {
        super();
        this.getApp();
        this.addBaseSocketListeners();
    }

    getApp()
    {
        this.app = new Element();
        this.app.loadFromId('app')
    }

    joinRoom(mode, data)
    {
        this.emit(`${mode}-joined`, data);
    }

    addBaseSocketListeners()
    {
        this.on('connect-error', (errMsg) => {
            alert(errMsg);
            this.errors.push(errMsg);
        });
    }
}

class JeopardyPlayer extends BaseJeopardy
{
    nickname = null;
    sessionCode = null;

    constructor()
    {
        super();
        this.showJoinScreen();
    }

    showJoinScreen()
    {
        const text = new Element('span')
            .text('JEOPARDY')
            .class('text-xl');

        const nickname = new Element('input')
            .prop('placeholder', 'Nickname')
            .prop('id', 'nickname')
            .prop('required', 'true')
            .prop('name', 'nickname');

        const submit = new Element('input')
            .prop('type', 'submit')
            .prop('value', 'Join');

        const form = new Element('form')
            .addChild(nickname)
            .addChild(submit)
            .on('submit', (e) => {
                e.preventDefault();
                this.nickname = document.getElementById('nickname').value;
                this.createCodeCookie();
                this.announceJoinRoom();
                this.after(() => this.showWaitingScreen());
            });

        this.app.addChild(text)
            .addChild(form);
    }

    showWaitingScreen()
    {
        this.app
            .wipe()
            .addChild(
                new Element('div')
                    .text('Joined! Please wait')
            )
    }

    createCodeCookie()
    {
        this.sessionCode = this.generateRandomCode();
        Cookie.set('j-session', this.sessionCode, Time.hours(2));
    }

    generateRandomCode()
    {
        return Random.alphanumeric(16);
    }

    announceJoinRoom()
    {
        this.joinRoom('player', {
            nickname: this.nickname,
            session: this.sessionCode
        });
    }

    after(callback)
    {
        setTimeout(() => {
            if (this.errors.length > 0) {
                this.errors = [];
                return;
            }
            callback();
        }, 250);
    }
}

class JeopardyController extends BaseJeopardy
{

}

class JeopardyPresenter extends BaseJeopardy
{
    viewMap = {
        'waiting-room': this.renderWaitingRoom
    };

    constructor() {
        super();
        this.renderView('waiting-room');
    }

    renderView(view)
    {
        this.validateView(view);
        this.viewMap[view]();
    }

    validateView(view)
    {
        if (!this.viewMap.hasOwnProperty(view)) {
            throw "Unknown view expected";
        }
    }

    renderWaitingRoom()
    {

    }
}

class Cookie
{
    static set(name, value, duration = 0)
    {
        const date = new Date();
        date.setTime(date.getTime() + duration);
        document.cookie = `${name}=${value};expires=${date.toString()};path=/`;
    }

    static get(name)
    {
        name += "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let cookies = decodedCookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return '';
    }
}

class Time
{
    static days(val)
    {
        return this.hours(val) * 24;
    }

    static hours(val)
    {
        return this.minutes(val) * 60;
    }

    static minutes(val)
    {
        return this.seconds(val) * 60;
    }

    static seconds(val)
    {
        return val * 1000;
    }
}

class Random
{
    static chars = 'abcdefghijklmnopqrstuvwxyz';
    static charsUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    static numeric = '1234567890';

    static getRandom(chars)
    {
        return chars.charAt(Math.floor(Math.random() * chars.length));
    }

    static lowerString(length)
    {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.getRandom(this.chars);
        }
        return result;
    }

    static upperString(length)
    {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.getRandom(this.charsUpper);
        }
        return result;
    }

    static number(length)
    {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.getRandom(this.numeric);
        }
        return result;
    }

    static alphanumeric(length)
    {
        let charset = this.chars + this.charsUpper + this.numeric;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += this.getRandom(charset);
        }
        return result;
    }
}

class Element
{
    el = null;
    constructor(type)
    {
        if (!type) {
            return;
        }
        this.el = document.createElement(type);
    }

    loadFromId(id)
    {
        this.el = document.getElementById(id);
        return this;
    }

    text(text)
    {
        this.el.innerText = text;
        return this;
    }

    html(html)
    {
        this.el.innerHTML = html;
        return this;
    }

    attr(name, value)
    {
        this.el.setAttribute(name, value);
        return this;
    }

    prop(name, value)
    {
        this.el[name] = value;
        return this;
    }

    class(name)
    {
        this.el.classList.add(name);
        return this;
    }

    removeClass(name)
    {
        this.el.classList.remove(name);
        return this;
    }

    addChild(el)
    {
        if (el instanceof Element) {
            el = el.getRaw();
        }
        this.el.append(el);
        return this;
    }

    wipe()
    {
        this.html('');
        return this;
    }

    on(event, callback)
    {
        this.el.addEventListener(event, callback);
        return this;
    }

    addTo(parentEl)
    {
        parentEl.append(this.el);
    }

    getRaw()
    {
        return this.el;
    }
}