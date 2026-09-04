const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const rooms = {};

const MAP = {
    minX: 120,
    maxX: 1350,
    minY: 120,
    maxY: 800
};

function randomRoomCode() {
    let code;

    do {
        code = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
    } while (rooms[code]);

    return code;
}

function createPlayer(id, name, team) {
    return {
        id,
        name: name.substring(0, 16),
        team,

        x: team === "CT" ? 520 : 920,
        y: 450,

        hp: 100,

        ammo: 12,
        reserveAmmo: 48,

        angle: 0,

        kills: 0,
        deaths: 0,

        dead: false,
        lastShot: 0
    };
}

function publicRoom(room) {
    return {
        round: room.round,
        time: Math.max(
            0,
            Math.ceil((room.roundEnd - Date.now()) / 1000)
        ),
        ctScore: room.ctScore,
        tScore: room.tScore
    };
}

function broadcastState(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    io.to(roomCode).emit("state", {
        room: publicRoom(room),
        players: room.players
    });
}

function resetPlayer(player) {
    player.hp = 100;
    player.dead = false;
    player.ammo = 12;
    player.reserveAmmo = 48;

    if (player.team === "CT") {
        player.x = 520;
        player.y = 450;
    } else {
        player.x = 920;
        player.y = 450;
    }
}

function startRound(roomCode) {
    const room = rooms[roomCode];

    if (!room) return;

    room.round++;
    room.roundEnd = Date.now() + 120000;

    for (const id in room.players) {
        resetPlayer(room.players[id]);
    }

    io.to(roomCode).emit("roundStart", {
        text: `RUNDA ${room.round}`
    });

    broadcastState(roomCode);
}

function endRound(roomCode, winner) {
    const room = rooms[roomCode];

    if (!room) return;

    if (winner === "CT") {
        room.ctScore++;
    } else {
        room.tScore++;
    }

    io.to(roomCode).emit("roundStart", {
        text: `${winner} WYGRYWA RUNDĘ`
    });

    setTimeout(() => {
        if (rooms[roomCode]) {
            startRound(roomCode);
        }
    }, 3000);
}

/* CONNECTION */

io.on("connection", socket => {

    socket.on("createRoom", data => {
        const code = randomRoomCode();

        rooms[code] = {
            round: 0,
            roundEnd: Date.now(),
            ctScore: 0,
            tScore: 0,

            players: {}
        };

        const room = rooms[code];

        room.players[socket.id] =
            createPlayer(socket.id, data.name || "Player", "CT");

        socket.join(code);
        socket.roomCode = code;

        socket.emit("roomCreated", {
            code,
            room: publicRoom(room),
            players: room.players
        });

        setTimeout(() => {
            if (rooms[code]) {
                startRound(code);
            }
        }, 500);
    });

    socket.on("joinRoom", data => {
        const code = String(data.code || "").toUpperCase();
        const room = rooms[code];

        if (!room) {
            socket.emit("errorMessage", "Nie znaleziono pokoju.");
            return;
        }

        const count = Object.keys(room.players).length;

        if (count >= 10) {
            socket.emit("errorMessage", "Pokój jest pełny.");
            return;
        }

        const ctCount = Object.values(room.players)
            .filter(p => p.team === "CT").length;

        const tCount = Object.values(room.players)
            .filter(p => p.team === "T").length;

        const team = ctCount <= tCount ? "CT" : "T";

        room.players[socket.id] =
            createPlayer(
                socket.id,
                data.name || "Player",
                team
            );

        socket.join(code);
        socket.roomCode = code;

        socket.emit("joinedRoom", {
            code,
            room: publicRoom(room),
            players: room.players
        });

        broadcastState(code);
    });

    socket.on("move", data => {
        const room = rooms[socket.roomCode];

        if (!room) return;

        const player = room.players[socket.id];

        if (!player || player.dead) return;

        const speed = 4;

        player.x += Number(data.dx || 0) * speed;
        player.y += Number(data.dy || 0) * speed;

        player.x = Math.max(
            MAP.minX,
            Math.min(MAP.maxX, player.x)
        );

        player.y = Math.max(
            MAP.minY,
            Math.min(MAP.maxY, player.y)
        );
    });

    socket.on("shoot", data => {
        const room = rooms[socket.roomCode];

        if (!room) return;

        const shooter = room.players[socket.id];

        if (!shooter || shooter.dead) return;

        const now = Date.now();

        if (now - shooter.lastShot < 110) {
            return;
        }

        if (shooter.ammo <= 0) {
            return;
        }

        shooter.lastShot = now;
        shooter.ammo--;

        shooter.angle = Number(data.angle || 0);

        const angle = shooter.angle;

        const range = 1000;

        const x1 = shooter.x;
        const y1 = shooter.y;

        const x2 = x1 + Math.cos(angle) * range;
        const y2 = y1 + Math.sin(angle) * range;

        io.to(socket.roomCode).emit("shot", {
            x1,
            y1,
            x2,
            y2
        });

        let target = null;
        let closestDistance = Infinity;

        for (const id in room.players) {
            const p = room.players[id];

            if (p.id === shooter.id) continue;
            if (p.dead) continue;

            /* friendly fire wyłączony */
            if (p.team === shooter.team) continue;

            const vx = p.x - shooter.x;
            const vy = p.y - shooter.y;

            const distance = Math.sqrt(vx * vx + vy * vy);

            if (distance > range) continue;

            const directionX = Math.cos(angle);
            const directionY = Math.sin(angle);

            const projection =
                vx * directionX +
                vy * directionY;

            if (projection < 0) continue;

            const closestX =
                shooter.x + directionX * projection;

            const closestY =
                shooter.y + directionY * projection;

            const dx = p.x - closestX;
            const dy = p.y - closestY;

            const hitDistance = Math.sqrt(dx * dx + dy * dy);

            if (
                hitDistance < 20 &&
                distance < closestDistance
            ) {
                target = p;
                closestDistance = distance;
            }
        }

        if (!target) return;

        target.hp -= 34;

        io.to(socket.roomCode).emit("hit", {
            id: target.id
        });

        if (target.hp <= 0) {
            target.hp = 0;
            target.dead = true;
            target.deaths++;
            shooter.kills++;

            io.to(socket.roomCode).emit("playerDied", {
                id: target.id
            });

            setTimeout(() => {
                if (!rooms[socket.roomCode]) return;

                const player = rooms[socket.roomCode]
                    .players[target.id];

                if (!player) return;

                resetPlayer(player);

                io.to(socket.roomCode).emit("respawn", {
                    id: player.id
                });

                broadcastState(socket.roomCode);
            }, 3000);
        }

        broadcastState(socket.roomCode);
    });

    socket.on("reload", () => {
        const room = rooms[socket.roomCode];

        if (!room) return;

        const player = room.players[socket.id];

        if (!player || player.dead) return;

        const missing = 12 - player.ammo;

        if (missing <= 0) return;
        if (player.reserveAmmo <= 0) return;

        const amount = Math.min(
            missing,
            player.reserveAmmo
        );

        player.ammo += amount;
        player.reserveAmmo -= amount;

        broadcastState(socket.roomCode);
    });

    socket.on("disconnect", () => {
        const code = socket.roomCode;

        if (!code || !rooms[code]) return;

        delete rooms[code].players[socket.id];

        if (
            Object.keys(rooms[code].players).length === 0
        ) {
            delete rooms[code];
            return;
        }

        broadcastState(code);
    });
});

/* GAME TIMER */

setInterval(() => {
    for (const code in rooms) {
        const room = rooms[code];

        if (
            room.round > 0 &&
            Date.now() >= room.roundEnd
        ) {
            endRound(code, "CT");
        }

        broadcastState(code);
    }
}, 1000);

app.get("/", (req, res) => {
    res.send("Mini CS server działa.");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server działa na porcie ${PORT}`);
});