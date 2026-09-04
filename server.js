const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    let filePath = req.url === "/"
        ? path.join(__dirname, "index.html")
        : path.join(__dirname, req.url);

    filePath = path.normalize(filePath);

    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        return res.end("Forbidden");
    }

    const ext = path.extname(filePath);

    const contentTypes = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json"
    };

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            return res.end("Not found");
        }

        res.writeHead(200, {
            "Content-Type": contentTypes[ext] || "text/plain"
        });

        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });

const players = new Map();

const spawnPoints = [
    { x: -8, y: 1.7, z: 0 },
    { x: 8, y: 1.7, z: 0 }
];

function broadcast(data, except = null) {
    const message = JSON.stringify(data);

    for (const player of players.values()) {
        if (player.ws !== except && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(message);
        }
    }
}

wss.on("connection", (ws) => {
    if (players.size >= 10) {
        ws.send(JSON.stringify({
            type: "error",
            message: "Serwer jest pełny."
        }));

        ws.close();
        return;
    }

    const id = Math.random().toString(36).substring(2, 10);

    const spawn = spawnPoints[players.size % spawnPoints.length];

    const player = {
        id,
        ws,
        x: spawn.x,
        y: spawn.y,
        z: spawn.z,
        rotY: 0,
        rotX: 0,
        hp: 100,
        team: players.size % 2 === 0 ? "T" : "CT",
        name: `Player${players.size + 1}`
    };

    players.set(id, player);

    ws.send(JSON.stringify({
        type: "welcome",
        id,
        player: {
            id: player.id,
            x: player.x,
            y: player.y,
            z: player.z,
            rotY: player.rotY,
            rotX: player.rotX,
            hp: player.hp,
            team: player.team,
            name: player.name
        }
    }));

    const existingPlayers = [];

    for (const p of players.values()) {
        if (p.id !== id) {
            existingPlayers.push({
                id: p.id,
                x: p.x,
                y: p.y,
                z: p.z,
                rotY: p.rotY,
                rotX: p.rotX,
                hp: p.hp,
                team: p.team,
                name: p.name
            });
        }
    }

    ws.send(JSON.stringify({
        type: "players",
        players: existingPlayers
    }));

    broadcast({
        type: "playerJoined",
        player: {
            id: player.id,
            x: player.x,
            y: player.y,
            z: player.z,
            rotY: player.rotY,
            rotX: player.rotX,
            hp: player.hp,
            team: player.team,
            name: player.name
        }
    }, ws);

    ws.on("message", (raw) => {
        let data;

        try {
            data = JSON.parse(raw);
        } catch {
            return;
        }

        const p = players.get(id);

        if (!p) return;

        if (data.type === "join") {
            if (typeof data.name === "string") {
                p.name = data.name.substring(0, 16) || p.name;
            }

            broadcast({
                type: "playerUpdate",
                player: {
                    id: p.id,
                    name: p.name,
                    team: p.team
                }
            });
        }

        if (data.type === "move") {
            p.x = Number(data.x) || 0;
            p.y = Number(data.y) || 0;
            p.z = Number(data.z) || 0;
            p.rotY = Number(data.rotY) || 0;
            p.rotX = Number(data.rotX) || 0;

            broadcast({
                type: "move",
                id: p.id,
                x: p.x,
                y: p.y,
                z: p.z,
                rotY: p.rotY,
                rotX: p.rotX
            }, ws);
        }

        if (data.type === "shoot") {
            broadcast({
                type: "shoot",
                id: p.id,
                direction: data.direction
            }, ws);
        }

        if (data.type === "hit") {
            const target = players.get(data.target);

            if (!target || target.id === p.id) return;

            target.hp -= 25;

            broadcast({
                type: "damage",
                target: target.id,
                hp: Math.max(0, target.hp),
                attacker: p.id
            });

            if (target.hp <= 0) {
                broadcast({
                    type: "kill",
                    victim: target.id,
                    killer: p.id
                });

                setTimeout(() => {
                    if (!players.has(target.id)) return;

                    const spawn =
                        spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

                    target.x = spawn.x;
                    target.y = spawn.y;
                    target.z = spawn.z;
                    target.hp = 100;

                    target.ws.send(JSON.stringify({
                        type: "respawn",
                        x: target.x,
                        y: target.y,
                        z: target.z,
                        hp: target.hp
                    }));
                }, 3000);
            }
        }
    });

    ws.on("close", () => {
        players.delete(id);

        broadcast({
            type: "playerLeft",
            id
        });
    });
});

server.listen(PORT, () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});
