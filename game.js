const socket = io("http://localhost:3000");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const gameUI = document.getElementById("gameUI");
const menuError = document.getElementById("menuError");

const nicknameInput = document.getElementById("nickname");
const roomInput = document.getElementById("roomCode");

let myId = null;
let room = null;
let players = {};

let keys = {};
let mouse = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    down: false
};

let lastTime = performance.now();
let shootCooldown = 0;

function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}

window.addEventListener("resize", resize);
resize();

/* MENU */

document.getElementById("createBtn").onclick = () => {
    const name = nicknameInput.value.trim() || "Player";

    socket.emit("createRoom", {
        name
    });
};

document.getElementById("joinBtn").onclick = () => {
    const name = nicknameInput.value.trim() || "Player";
    const code = roomInput.value.trim().toUpperCase();

    if (!code) {
        menuError.textContent = "Wpisz kod pokoju.";
        return;
    }

    socket.emit("joinRoom", {
        name,
        code
    });
};

/* SOCKET */

socket.on("connect", () => {
    myId = socket.id;
});

socket.on("roomCreated", data => {
    startGame(data);
});

socket.on("joinedRoom", data => {
    startGame(data);
});

socket.on("errorMessage", msg => {
    menuError.textContent = msg;
});

socket.on("state", state => {
    players = state.players;
    room = state.room;
    updateUI();
});

socket.on("shot", data => {
    createBulletEffect(data);
});

socket.on("hit", data => {
    createHitEffect(data);
});

socket.on("roundStart", data => {
    showRoundMessage(data.text);
});

socket.on("playerDied", data => {
    if (data.id === myId) {
        document.getElementById("deadScreen").classList.remove("hidden");
    }
});

socket.on("respawn", data => {
    if (data.id === myId) {
        document.getElementById("deadScreen").classList.add("hidden");
    }
});

function startGame(data) {
    room = data.room;
    players = data.players;

    menu.classList.add("hidden");
    gameUI.classList.remove("hidden");

    requestAnimationFrame(gameLoop);
}

/* INPUT */

window.addEventListener("keydown", e => {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === "r") {
        socket.emit("reload");
    }

    if (e.key === "Tab") {
        e.preventDefault();
        document.getElementById("scoreboard").classList.remove("hidden");
    }
});

window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mousedown", e => {
    if (e.button === 0) mouse.down = true;
});

window.addEventListener("mouseup", e => {
    if (e.button === 0) mouse.down = false;
});

window.addEventListener("keyup", e => {
    if (e.key === "Tab") {
        document.getElementById("scoreboard").classList.add("hidden");
    }
});

/* GAME */

function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;

    if (!gameUI.classList.contains("hidden")) {
        update(dt);
        draw();
    }

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    const me = players[myId];

    if (!me || me.dead) return;

    let dx = 0;
    let dy = 0;

    if (keys["w"]) dy--;
    if (keys["s"]) dy++;
    if (keys["a"]) dx--;
    if (keys["d"]) dx++;

    if (dx !== 0 || dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);

        dx /= length;
        dy /= length;

        socket.emit("move", {
            dx,
            dy
        });
    }

    shootCooldown -= dt;

    if (mouse.down && shootCooldown <= 0) {
        shoot();
        shootCooldown = 0.13;
    }
}

function shoot() {
    const me = players[myId];

    if (!me || me.dead || me.ammo <= 0) return;

    const worldMouse = screenToWorld(mouse.x, mouse.y);

    const angle = Math.atan2(
        worldMouse.y - me.y,
        worldMouse.x - me.x
    );

    socket.emit("shoot", {
        angle
    });
}

/* DRAW */

function draw() {
    const me = players[myId];

    if (!me) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cameraX = me.x - canvas.width / 2;
    const cameraY = me.y - canvas.height / 2;

    drawBackground(cameraX, cameraY);
    drawMap(cameraX, cameraY);

    for (const id in players) {
        drawPlayer(players[id], cameraX, cameraY);
    }

    drawBulletEffects(cameraX, cameraY);
}

function drawBackground(cameraX, cameraY) {
    ctx.fillStyle = "#15191d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grid = 80;

    ctx.strokeStyle = "#1c2228";
    ctx.lineWidth = 1;

    const startX = -((cameraX % grid) + grid) % grid;
    const startY = -((cameraY % grid) + grid) % grid;

    for (let x = startX; x < canvas.width; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = startY; y < canvas.height; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawMap(cameraX, cameraY) {
    const walls = [
        { x: 400, y: 250, w: 650, h: 35 },
        { x: 400, y: 650, w: 650, h: 35 },

        { x: 400, y: 285, w: 35, h: 365 },
        { x: 1015, y: 285, w: 35, h: 365 },

        { x: 700, y: 380, w: 300, h: 35 },
        { x: 700, y: 550, w: 300, h: 35 }
    ];

    for (const wall of walls) {
        ctx.fillStyle = "#3a4148";
        ctx.strokeStyle = "#59616a";

        ctx.fillRect(
            wall.x - cameraX,
            wall.y - cameraY,
            wall.w,
            wall.h
        );

        ctx.strokeRect(
            wall.x - cameraX,
            wall.y - cameraY,
            wall.w,
            wall.h
        );
    }

    ctx.fillStyle = "rgba(88,166,255,.08)";
    ctx.fillRect(
        450 - cameraX,
        320 - cameraY,
        180,
        260
    );

    ctx.fillStyle = "rgba(233,165,43,.08)";
    ctx.fillRect(
        820 - cameraX,
        320 - cameraY,
        180,
        260
    );
}

function drawPlayer(player, cameraX, cameraY) {
    if (player.dead) return;

    const x = player.x - cameraX;
    const y = player.y - cameraY;

    const isMe = player.id === myId;

    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);

    ctx.fillStyle =
        player.team === "CT"
            ? "#4798ff"
            : "#e9a52b";

    ctx.fill();

    ctx.strokeStyle = isMe ? "#ffffff" : "#111";
    ctx.lineWidth = isMe ? 3 : 2;
    ctx.stroke();

    /* kierunek broni */

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(player.angle || 0);

    ctx.fillStyle = "#151515";
    ctx.fillRect(8, -3, 25, 6);

    ctx.restore();

    /* nick */

    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";

    ctx.fillText(
        player.name,
        x,
        y - 27
    );

    /* HP */

    ctx.fillStyle = "#111";
    ctx.fillRect(x - 20, y + 24, 40, 4);

    ctx.fillStyle = "#62d56f";
    ctx.fillRect(
        x - 20,
        y + 24,
        40 * Math.max(player.hp, 0) / 100,
        4
    );
}

function drawBulletEffects(cameraX, cameraY) {
    for (const b of bulletEffects) {
        ctx.beginPath();

        ctx.moveTo(
            b.x1 - cameraX,
            b.y1 - cameraY
        );

        ctx.lineTo(
            b.x2 - cameraX,
            b.y2 - cameraY
        );

        ctx.strokeStyle = "#ffe6a3";
        ctx.lineWidth = 2;

        ctx.stroke();
    }

    bulletEffects = bulletEffects.filter(
        b => Date.now() - b.time < 80
    );
}

let bulletEffects = [];

function createBulletEffect(data) {
    bulletEffects.push({
        x1: data.x1,
        y1: data.y1,
        x2: data.x2,
        y2: data.y2,
        time: Date.now()
    });
}

function createHitEffect(data) {
    /* miejsce na particle effects */
}

/* UI */

function updateUI() {
    const me = players[myId];

    if (!me) return;

    document.getElementById("hp").textContent =
        Math.max(0, Math.round(me.hp));

    document.getElementById("ammo").textContent =
        me.ammo;

    document.getElementById("ctScore").textContent =
        room.ctScore || 0;

    document.getElementById("tScore").textContent =
        room.tScore || 0;

    document.getElementById("roundText").textContent =
        `RUNDA ${room.round || 1}`;

    const seconds = Math.max(0, room.time || 0);

    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");

    document.getElementById("timer").textContent =
        `${min}:${sec}`;

    const list = document.getElementById("playersList");

    list.innerHTML = Object.values(players)
        .sort((a, b) => a.team.localeCompare(b.team))
        .map(p => `
            <div class="player-row">
                <span class="${p.team === "CT" ? "ct-player" : "t-player"}">
                    ${escapeHTML(p.name)} [${p.team}]
                </span>
                <span>${p.kills}/${p.deaths}</span>
            </div>
        `)
        .join("");
}

function showRoundMessage(text) {
    const screen = document.getElementById("roundScreen");
    const result = document.getElementById("roundResult");

    result.textContent = text;
    screen.classList.remove("hidden");

    setTimeout(() => {
        screen.classList.add("hidden");
    }, 1800);
}

function screenToWorld(x, y) {
    const me = players[myId];

    return {
        x: me.x + x - canvas.width / 2,
        y: me.y + y - canvas.height / 2
    };
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
