// =====================================================
// STRIKEZONE FPS 2.0
// =====================================================

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x151a1d);

scene.fog = new THREE.Fog(
    0x151a1d,
    25,
    100
);


// =====================================================
// CAMERA
// =====================================================

const camera = new THREE.PerspectiveCamera(
    78,
    window.innerWidth / window.innerHeight,
    0.05,
    200
);

camera.rotation.order = "YXZ";


// =====================================================
// RENDERER
// =====================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.8)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.05;

document.body.appendChild(
    renderer.domElement
);


// =====================================================
// LIGHTING
// =====================================================

const hemi = new THREE.HemisphereLight(
    0xb9d4e5,
    0x16120d,
    1.6
);

scene.add(hemi);


const sun = new THREE.DirectionalLight(
    0xffe3b0,
    2.4
);

sun.position.set(
    -25,
    40,
    -20
);

sun.castShadow = true;

sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;

sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;

scene.add(sun);


// =====================================================
// MATERIALS
// =====================================================

const materials = {

    concrete:
        new THREE.MeshStandardMaterial({
            color: 0x65696b,
            roughness: 0.92
        }),

    darkConcrete:
        new THREE.MeshStandardMaterial({
            color: 0x3c4144,
            roughness: 0.95
        }),

    metal:
        new THREE.MeshStandardMaterial({
            color: 0x42494c,
            roughness: 0.62,
            metalness: 0.55
        }),

    wood:
        new THREE.MeshStandardMaterial({
            color: 0x775035,
            roughness: 0.9
        }),

    woodDark:
        new THREE.MeshStandardMaterial({
            color: 0x4e3021,
            roughness: 0.95
        }),

    yellow:
        new THREE.MeshStandardMaterial({
            color: 0xd29a25,
            roughness: 0.65
        }),

    red:
        new THREE.MeshStandardMaterial({
            color: 0x8b302a,
            roughness: 0.8
        }),

    blue:
        new THREE.MeshStandardMaterial({
            color: 0x315d82,
            roughness: 0.8
        }),

    black:
        new THREE.MeshStandardMaterial({
            color: 0x111315,
            roughness: 0.5,
            metalness: 0.7
        })
};


// =====================================================
// MAP HELPERS
// =====================================================

const collisionBoxes = [];


function box(
    x,
    y,
    z,
    sx,
    sy,
    sz,
    material,
    collision = true
) {

    const geometry =
        new THREE.BoxGeometry(
            sx,
            sy,
            sz
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if (collision) {

        collisionBoxes.push({
            x,
            z,
            sx,
            sz
        });
    }

    return mesh;
}


// =====================================================
// GROUND
// =====================================================

box(
    0,
    -0.5,
    0,
    70,
    1,
    70,
    materials.darkConcrete,
    false
);


// =====================================================
// OUTER WALLS
// =====================================================

box(
    0,
    4,
    -30,
    60,
    8,
    2,
    materials.concrete
);

box(
    0,
    4,
    30,
    60,
    8,
    2,
    materials.concrete
);

box(
    -30,
    4,
    0,
    2,
    8,
    60,
    materials.concrete
);

box(
    30,
    4,
    0,
    2,
    8,
    60,
    materials.concrete
);


// =====================================================
// CENTRAL BUILDING
// =====================================================

box(
    0,
    3,
    0,
    18,
    6,
    2,
    materials.concrete
);

box(
    -9,
    3,
    7,
    2,
    6,
    14,
    materials.concrete
);

box(
    9,
    3,
    -7,
    2,
    6,
    14,
    materials.concrete
);


// =====================================================
// COVER / CRATES
// =====================================================

function crate(x, y, z, scale = 1) {

    const group = new THREE.Group();

    const main =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.3 * scale,
                2.0 * scale,
                2.3 * scale
            ),
            materials.wood
        );

    main.castShadow = true;
    main.receiveShadow = true;

    group.add(main);


    // wooden strips

    const stripMat =
        materials.woodDark;

    const vertical1 =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.16 * scale,
                2.1 * scale,
                2.4 * scale
            ),
            stripMat
        );

    vertical1.position.x =
        -0.75 * scale;

    group.add(vertical1);


    const vertical2 =
        vertical1.clone();

    vertical2.position.x =
        0.75 * scale;

    group.add(vertical2);


    group.position.set(
        x,
        y,
        z
    );

    scene.add(group);


    collisionBoxes.push({
        x,
        z,
        sx: 2.5 * scale,
        sz: 2.5 * scale
    });

    return group;
}


crate(-18, 1, -15);
crate(-15, 1, -15);
crate(-12, 1, -15);

crate(18, 1, 15);
crate(15, 1, 15);

crate(-20, 1, 12);
crate(20, 1, -12);


// =====================================================
// BARRELS
// =====================================================

function barrel(
    x,
    y,
    z,
    color = 0x37464d
) {

    const material =
        new THREE.MeshStandardMaterial({
            color,
            roughness: 0.7,
            metalness: 0.4
        });

    const mesh =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.7,
                0.7,
                1.6,
                16
            ),
            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    collisionBoxes.push({
        x,
        z,
        sx: 1.5,
        sz: 1.5
    });
}

barrel(-20, 0.8, -5, 0x3b4e56);
barrel(-18, 0.8, -5, 0x8c3a30);

barrel(20, 0.8, 5, 0x3b4e56);
barrel(18, 0.8, 5, 0x8c3a30);


// =====================================================
// METAL CONTAINERS
// =====================================================

function container(
    x,
    z,
    color
) {

    box(
        x,
        1.5,
        z,
        6,
        3,
        3,
        color
    );

    // doors

    box(
        x,
        1.5,
        z + 1.56,
        4.8,
        2.5,
        0.08,
        materials.metal,
        false
    );
}

container(
    -20,
    22,
    materials.blue
);

container(
    20,
    -22,
    materials.red
);


// =====================================================
// LAMPS
// =====================================================

function lamp(
    x,
    y,
    z
) {

    const light =
        new THREE.PointLight(
            0xffc76b,
            8,
            12
        );

    light.position.set(
        x,
        y,
        z
    );

    scene.add(light);


    const lampMesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.5,
                0.15,
                0.5
            ),
            new THREE.MeshBasicMaterial({
                color: 0xffe2a5
            })
        );

    lampMesh.position.set(
        x,
        y,
        z
    );

    scene.add(lampMesh);
}


lamp(-15, 6.5, -15);
lamp(0, 6.5, -15);
lamp(15, 6.5, -15);

lamp(-15, 6.5, 15);
lamp(0, 6.5, 15);
lamp(15, 6.5, 15);


// =====================================================
// PLAYER
// =====================================================

let player = {

    id: null,

    x: -23,
    y: 1.7,
    z: 0,

    rotY: 0,
    rotX: 0,

    hp: 100,

    velocityY: 0,

    grounded: true
};


const otherPlayers =
    new Map();


// =====================================================
// WEAPON MODEL
// =====================================================

const weapon =
    new THREE.Group();

weapon.position.set(
    0.32,
    -0.30,
    -0.58
);

weapon.rotation.set(
    -0.04,
    -0.04,
    0
);

camera.add(weapon);

scene.add(camera);


function createWeapon() {

    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.24,
                0.28,
                0.85
            ),
            materials.black
        );

    body.position.z = -0.35;

    weapon.add(body);


    const barrel =
        new THREE.Mesh(
            new THREE.CylinderGeometry(
                0.045,
                0.045,
                0.75,
                12
            ),
            materials.black
        );

    barrel.rotation.x =
        Math.PI / 2;

    barrel.position.z =
        -0.95;

    weapon.add(barrel);


    const grip =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.15,
                0.42,
                0.18
            ),
            materials.black
        );

    grip.rotation.x =
        -0.18;

    grip.position.set(
        0,
        -0.3,
        -0.15
    );

    weapon.add(grip);


    const mag =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.12,
                0.35,
                0.16
            ),
            materials.black
        );

    mag.position.set(
        0,
        -0.2,
        -0.42
    );

    weapon.add(mag);


    // hands

    const handMat =
        new THREE.MeshStandardMaterial({
            color: 0xc98e6c
        });

    const hand1 =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.16,
                0.18,
                0.32
            ),
            handMat
        );

    hand1.position.set(
        -0.1,
        -0.13,
        -0.65
    );

    weapon.add(hand1);


    const hand2 =
        hand1.clone();

    hand2.position.x =
        0.1;

    weapon.add(hand2);
}

createWeapon();


// =====================================================
// SHOOTING
// =====================================================

let ammo = 30;
let reserveAmmo = 90;

let canShoot = true;
let shooting = false;

const fireRate = 105;

let recoil = 0;


function shoot() {

    if (!gameStarted)
        return;

    if (!canShoot)
        return;

    if (ammo <= 0) {

        reload();

        return;
    }

    ammo--;

    updateAmmo();

    canShoot = false;

    recoil += 0.025;

    weapon.position.z =
        -0.58 + recoil * 2;

    playShotSound();

    muzzleFlash();

    send({
        type: "shoot",
        direction: {
            x: 0,
            y: 0,
            z: -1
        }
    });


    performHitScan();


    setTimeout(
        () => {
            canShoot = true;
        },
        fireRate
    );
}


function performHitScan() {

    const raycaster =
        new THREE.Raycaster();

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );


    const targets = [];

    for (
        const p of otherPlayers.values()
    ) {

        if (p.mesh)
            targets.push(p.mesh);
    }


    const hits =
        raycaster.intersectObjects(
            targets,
            true
        );


    if (!hits.length)
        return;


    let object =
        hits[0].object;


    while (
        object &&
        !object.userData.playerId
    ) {
        object =
            object.parent;
    }


    if (!object)
        return;


    const target =
        object.userData.playerId;


    if (!target)
        return;


    showHitMarker();


    send({
        type: "hit",
        target
    });
}


// =====================================================
// MUZZLE FLASH
// =====================================================

function muzzleFlash() {

    const flash =
        new THREE.PointLight(
            0xffaa33,
            12,
            4
        );

    flash.position.set(
        0,
        0,
        -1.25
    );

    weapon.add(flash);


    const geometry =
        new THREE.SphereGeometry(
            0.08,
            8,
            8
        );

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffc14d
        });

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.set(
        0,
        0,
        -1.3
    );

    weapon.add(mesh);


    setTimeout(
        () => {

            weapon.remove(
                flash
            );

            weapon.remove(
                mesh
            );

        },
        45
    );
}


// =====================================================
// SOUND
// =====================================================

let audioContext;


function playShotSound() {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();
        }


        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();


        oscillator.type =
            "sawtooth";

        oscillator.frequency.value =
            90;


        gain.gain.setValueAtTime(
            0.18,
            audioContext.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.12
        );


        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.12
        );

    } catch {}
}


// =====================================================
// RELOAD
// =====================================================

function reload() {

    if (ammo >= 30)
        return;

    if (reserveAmmo <= 0)
        return;


    const needed =
        30 - ammo;

    const amount =
        Math.min(
            needed,
            reserveAmmo
        );


    ammo += amount;

    reserveAmmo -= amount;

    updateAmmo();
}


function updateAmmo() {

    document.getElementById(
        "ammoValue"
    ).textContent = ammo;
}


// =====================================================
// NETWORK
// =====================================================

let socket;


function connect() {

    const protocol =
        location.protocol === "https:"
            ? "wss:"
            : "ws:";

    const host =
        location.host ||
        "localhost:3000";


    socket =
        new WebSocket(
            `${protocol}//${host}`
        );


    socket.onopen = () => {

        const status =
            document.getElementById(
                "serverStatus"
            );

        status.textContent =
            "● SERWER ONLINE";

        status.style.color =
            "#62d66a";
    };


    socket.onclose = () => {

        const status =
            document.getElementById(
                "serverStatus"
            );

        status.textContent =
            "● SERWER OFFLINE";

        status.style.color =
            "#e05252";
    };


    socket.onerror = () => {

        document.getElementById(
            "serverStatus"
        ).textContent =
            "● BŁĄD POŁĄCZENIA";
    };


    socket.onmessage =
        event => {

            try {

                handleNetwork(
                    JSON.parse(
                        event.data
                    )
                );

            } catch {}
        };
}


function send(data) {

    if (
        socket &&
        socket.readyState ===
        WebSocket.OPEN
    ) {

        socket.send(
            JSON.stringify(data)
        );
    }
}


// =====================================================
// NETWORK EVENTS
// =====================================================

function handleNetwork(data) {

    if (
        data.type ===
        "welcome"
    ) {

        player = {
            ...player,
            ...data.player
        };

        updateCamera();
    }


    if (
        data.type ===
        "players"
    ) {

        data.players.forEach(
            createOtherPlayer
        );

        updateMinimap();
    }


    if (
        data.type ===
        "playerJoined"
    ) {

        createOtherPlayer(
            data.player
        );

        updateMinimap();
    }


    if (
        data.type ===
        "playerLeft"
    ) {

        removeOtherPlayer(
            data.id
        );

        updateMinimap();
    }


    if (
        data.type ===
        "move"
    ) {

        const p =
            otherPlayers.get(
                data.id
            );

        if (!p)
            return;


        p.targetPosition.set(
            data.x,
            data.y,
            data.z
        );

        p.targetRotation =
            data.rotY;
    }


    if (
        data.type ===
        "damage"
    ) {

        if (
            data.target ===
            player.id
        ) {

            player.hp =
                data.hp;

            updateHealth();

            damageEffect();
        }


        if (
            data.attacker ===
            player.id
        ) {

            showHitMarker();
        }
    }


    if (
        data.type ===
        "kill"
    ) {

        if (
            data.killer ===
            player.id
        ) {

            showCenterMessage(
                "ELIMINACJA",
                "#e5a62a"
            );
        }


        if (
            data.victim ===
            player.id
        ) {

            showCenterMessage(
                "ZGINĄŁEŚ",
                "#e05252"
            );
        }


        addKillFeed(
            data.killer,
            data.victim
        );
    }


    if (
        data.type ===
        "respawn"
    ) {

        player.x =
            data.x;

        player.y =
            data.y;

        player.z =
            data.z;

        player.hp =
            data.hp;

        player.velocityY =
            0;

        updateHealth();

        updateCamera();

        showCenterMessage(
            "READY",
            "#69d86b"
        );
    }


    if (
        data.type ===
        "shoot"
    ) {

        // później możemy tu dodać
        // dźwięk innych graczy
    }
}


// =====================================================
// REMOTE PLAYER
// =====================================================

function createOtherPlayer(data) {

    if (
        otherPlayers.has(
            data.id
        )
    )
        return;


    const group =
        new THREE.Group();

    group.userData.playerId =
        data.id;


    const color =
        data.team === "T"
            ? 0xb87531
            : 0x3e78ad;


    const body =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.75,
                1.25,
                0.45
            ),
            new THREE.MeshStandardMaterial({
                color,
                roughness: 0.8
            })
        );

    body.position.y =
        -0.25;

    body.castShadow = true;

    body.userData.playerId =
        data.id;

    group.add(body);


    const head =
        new THREE.Mesh(
            new THREE.SphereGeometry(
                0.29,
                12,
                8
            ),
            new THREE.MeshStandardMaterial({
                color: 0xc88d6c
            })
        );

    head.position.y =
        0.62;

    head.castShadow = true;

    head.userData.playerId =
        data.id;

    group.add(head);


    // shoulders

    const shoulder =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.05,
                0.25,
                0.5
            ),
            new THREE.MeshStandardMaterial({
                color
            })
        );

    shoulder.position.y =
        0.15;

    shoulder.userData.playerId =
        data.id;

    group.add(shoulder);


    group.position.set(
        data.x,
        data.y,
        data.z
    );


    scene.add(group);


    otherPlayers.set(
        data.id,
        {
            mesh: group,

            targetPosition:
                new THREE.Vector3(
                    data.x,
                    data.y,
                    data.z
                ),

            targetRotation:
                data.rotY || 0,

            name:
                data.name ||
                "Player",

            hp:
                data.hp || 100
        }
    );


    updateMinimap();
}


function removeOtherPlayer(id) {

    const p =
        otherPlayers.get(id);

    if (!p)
        return;


    scene.remove(
        p.mesh
    );

    otherPlayers.delete(id);

    updateMinimap();
}


// =====================================================
// MOVEMENT
// =====================================================

const keys = {};

const walkSpeed = 0.11;
const sprintSpeed = 0.19;

let lastMoveSend = 0;


document.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;


        if (
            event.code ===
            "KeyR"
        ) {

            reload();
        }


        if (
            event.code ===
            "Space" &&
            player.grounded
        ) {

            player.velocityY =
                0.22;

            player.grounded =
                false;
        }
    }
);


document.addEventListener(
    "keyup",
    event => {

        keys[event.code] =
            false;
    }
);


// =====================================================
// COLLISION
// =====================================================

function collides(
    x,
    z
) {

    const radius =
        0.35;


    for (
        const b of collisionBoxes
    ) {

        if (
            x + radius >
            b.x - b.sx / 2 &&

            x - radius <
            b.x + b.sx / 2 &&

            z + radius >
            b.z - b.sz / 2 &&

            z - radius <
            b.z + b.sz / 2
        ) {

            return true;
        }
    }


    return false;
}


// =====================================================
// MOVEMENT UPDATE
// =====================================================

function updateMovement() {

    if (!gameStarted)
        return;


    const direction =
        new THREE.Vector3();


    if (keys["KeyW"])
        direction.z -= 1;

    if (keys["KeyS"])
        direction.z += 1;

    if (keys["KeyA"])
        direction.x -= 1;

    if (keys["KeyD"])
        direction.x += 1;


    if (
        direction.lengthSq()
        > 0
    ) {

        direction.normalize();


        const speed =
            keys["ShiftLeft"] ||
            keys["ShiftRight"]
                ? sprintSpeed
                : walkSpeed;


        const sin =
            Math.sin(
                player.rotY
            );

        const cos =
            Math.cos(
                player.rotY
            );


        const moveX =
            direction.x * cos -
            direction.z * sin;

        const moveZ =
            direction.x * sin +
            direction.z * cos;


        const newX =
            player.x +
            moveX * speed;

        const newZ =
            player.z +
            moveZ * speed;


        if (
            !collides(
                newX,
                player.z
            )
        ) {

            player.x =
                newX;
        }


        if (
            !collides(
                player.x,
                newZ
            )
        ) {

            player.z =
                newZ;
        }
    }


    // gravity

    player.velocityY -=
        0.012;


    player.y +=
        player.velocityY;


    if (
        player.y <= 1.7
    ) {

        player.y = 1.7;

        player.velocityY =
            0;

        player.grounded =
            true;
    }


    // bounds

    player.x =
        THREE.MathUtils.clamp(
            player.x,
            -27,
            27
        );

    player.z =
        THREE.MathUtils.clamp(
            player.z,
            -27,
            27
        );


    const now =
        performance.now();


    if (
        now - lastMoveSend >
        40
    ) {

        send({
            type: "move",

            x: player.x,
            y: player.y,
            z: player.z,

            rotY: player.rotY,
            rotX: player.rotX
        });


        lastMoveSend =
            now;
    }
}


// =====================================================
// CAMERA
// =====================================================

function updateCamera() {

    camera.position.set(
        player.x,
        player.y,
        player.z
    );


    camera.rotation.y =
        player.rotY;

    camera.rotation.x =
        player.rotX;
}


// =====================================================
// MOUSE LOOK
// =====================================================

let gameStarted =
    false;


document.addEventListener(
    "mousemove",
    event => {

        if (!gameStarted)
            return;


        if (
            document.pointerLockElement !==
            document.body
        )
            return;


        const sensitivity =
            0.0022;


        player.rotY -=
            event.movementX *
            sensitivity;


        player.rotX -=
            event.movementY *
            sensitivity;


        player.rotX =
            THREE.MathUtils.clamp(
                player.rotX,
                -1.45,
                1.45
            );
    }
);


// =====================================================
// MOUSE
// =====================================================

document.addEventListener(
    "mousedown",
    event => {

        if (
            event.button !== 0
        )
            return;


        if (!gameStarted)
            return;


        shooting = true;

        shoot();
    }
);


document.addEventListener(
    "mouseup",
    event => {

        if (
            event.button === 0
        ) {

            shooting = false;
        }
    }
);


// =====================================================
// CONTINUOUS FIRE
// =====================================================

function updateShooting() {

    if (
        shooting &&
        gameStarted
    ) {

        shoot();
    }
}


// =====================================================
// HEALTH
// =====================================================

function updateHealth() {

    const value =
        Math.max(
            0,
            player.hp
        );


    document.getElementById(
        "healthValue"
    ).textContent =
        value;


    const fill =
        document.getElementById(
            "healthFill"
        );


    fill.style.width =
        `${value}%`;


    if (value > 60) {

        fill.style.background =
            "#69d86b";

    } else if (value > 30) {

        fill.style.background =
            "#e5a62a";

    } else {

        fill.style.background =
            "#e05252";
    }
}


// =====================================================
// DAMAGE EFFECT
// =====================================================

function damageEffect() {

    const flash =
        document.getElementById(
            "damageFlash"
        );


    flash.style.opacity =
        "1";


    setTimeout(
        () => {

            flash.style.opacity =
                "0";

        },
        130
    );
}


// =====================================================
// HITMARKER
// =====================================================

function showHitMarker() {

    const marker =
        document.getElementById(
            "hitMarker"
        );


    marker.style.opacity =
        "1";


    setTimeout(
        () => {

            marker.style.opacity =
                "0";

        },
        90
    );
}


// =====================================================
// CENTER MESSAGE
// =====================================================

function showCenterMessage(
    text,
    color
) {

    const el =
        document.getElementById(
            "centerMessage"
        );


    el.textContent =
        text;

    el.style.color =
        color;

    el.style.opacity =
        "1";


    setTimeout(
        () => {

            el.style.opacity =
                "0";

        },
        1200
    );
}


// =====================================================
// KILL FEED
// =====================================================

function addKillFeed(
    killer,
    victim
) {

    const feed =
        document.getElementById(
            "killFeed"
        );


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "kill";


    row.textContent =
        `${killer || "PLAYER"}  →  ${victim || "PLAYER"}`;


    feed.prepend(row);


    setTimeout(
        () => {

            row.remove();

        },
        3500
    );
}


// =====================================================
// MINIMAP
// =====================================================

function updateMinimap() {

    const map =
        document.getElementById(
            "mapEnemies"
        );


    map.innerHTML =
        "";


    const scale =
        150 / 60;


    const playerDot =
        document.getElementById(
            "mapPlayer"
        );


    playerDot.style.left =
        `${75 + player.x * scale}px`;

    playerDot.style.top =
        `${75 + player.z * scale}px`;


    for (
        const p of otherPlayers.values()
    ) {

        const dot =
            document.createElement(
                "div"
            );


        dot.className =
            "mapEnemy";


        dot.style.left =
            `${75 + p.mesh.position.x * scale}px`;


        dot.style.top =
            `${75 + p.mesh.position.z * scale}px`;


        map.appendChild(dot);
    }
}


// =====================================================
// OTHER PLAYER UPDATE
// =====================================================

function updateOtherPlayers() {

    for (
        const p of otherPlayers.values()
    ) {

        p.mesh.position.lerp(
            p.targetPosition,
            0.22
        );


        p.mesh.rotation.y =
            p.targetRotation;
    }


    updateMinimap();
}


// =====================================================
// RECOIL RECOVERY
// =====================================================

function updateWeapon() {

    recoil *= 0.82;


    weapon.position.z =
        THREE.MathUtils.lerp(
            weapon.position.z,
            -0.58,
            0.18
        );


    weapon.position.y =
        -0.30 +
        Math.sin(
            performance.now() * 0.006
        ) * 0.004;


    weapon.rotation.x =
        -0.04 -
        recoil * 0.8;
}


// =====================================================
// MENU
// =====================================================

document.getElementById(
    "playButton"
).addEventListener(
    "click",
    startGame
);


document.getElementById(
    "nameInput"
).addEventListener(
    "keydown",
    event => {

        if (
            event.code ===
            "Enter"
        ) {

            startGame();
        }
    }
);


function startGame() {

    const name =
        document.getElementById(
            "nameInput"
        ).value.trim()
        || "Player";


    send({
        type: "join",
        name
    });


    gameStarted =
        true;


    document.getElementById(
        "menu"
    ).style.display =
        "none";


    document.getElementById(
        "crosshairHint"
    ).style.display =
        "none";


    document.body.requestPointerLock();


    if (
        audioContext &&
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


// =====================================================
// ESC / POINTER LOCK
// =====================================================

document.addEventListener(
    "pointerlockchange",
    () => {

        if (
            !document.pointerLockElement
            &&
            gameStarted
        ) {

            document.getElementById(
                "crosshairHint"
            ).style.display =
                "block";
        }
    }
);


// =====================================================
// RESIZE
// =====================================================

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


// =====================================================
// GAME LOOP
// =====================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    updateMovement();

    updateCamera();

    updateOtherPlayers();

    updateWeapon();

    updateShooting();


    renderer.render(
        scene,
        camera
    );
}


// =====================================================
// START
// =====================================================

updateHealth();

updateAmmo();

connect();

animate();
