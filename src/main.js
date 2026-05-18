import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Pitch black
scene.fog = new THREE.FogExp2(0x020202, 0.08); // Dense black fog

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false }); // Disabled antialias for performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Force 1x pixel ratio for weak GPUs
renderer.toneMapping = THREE.LinearToneMapping; // Cheaper tone mapping
renderer.toneMappingExposure = 0.5;
document.getElementById('game-container').appendChild(renderer.domElement);

// Audio Context
let audioCtx, listener;
let scratchSound;

// Controls
const controls = new PointerLockControls(camera, renderer.domElement);
const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

let gameDifficulty = 1; // 1=Mudah, 2=Normal, 3=Sulit

const startBtn = document.getElementById('start-btn');
startBtn.addEventListener('click', function () {
    const radios = document.getElementsByName('difficulty');
    if (radios) {
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                gameDifficulty = parseInt(radios[i].value);
                break;
            }
        }
    }
    
    if (!controls.isLocked) {
        controls.lock();
    }
});

controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
    initAudio();
});

controls.addEventListener('unlock', function () {
    blocker.style.display = 'flex';
    instructions.style.display = '';
});

scene.add(controls.object);

// Movement state
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let isSprinting = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const onKeyDown = function (event) {
    switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w': moveForward = true; break;
        case 'arrowleft':
        case 'a': moveLeft = true; break;
        case 'arrowdown':
        case 's': moveBackward = true; break;
        case 'arrowright':
        case 'd': moveRight = true; break;
        case 'shift': isSprinting = true; break;
    }
};

const onKeyUp = function (event) {
    switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w': moveForward = false; break;
        case 'arrowleft':
        case 'a': moveLeft = false; break;
        case 'arrowdown':
        case 's': moveBackward = false; break;
        case 'arrowright':
        case 'd': moveRight = false; break;
        case 'shift': isSprinting = false; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Procedural Textures
function createPeelingWallpaper(isFlesh = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256; 
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = isFlesh ? '#4a0a0a' : '#2a1a1a'; // Flesh is redder
    ctx.fillRect(0, 0, 256, 256);

    for(let i=0; i<50; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(50, 30, 20, 0.4)' : (isFlesh ? 'rgba(80, 10, 10, 0.6)' : 'rgba(20, 10, 10, 0.6)');
        ctx.beginPath();
        ctx.ellipse(Math.random() * 256, Math.random() * 256, Math.random()*20 + 5, Math.random()*5 + 1, Math.random()*Math.PI, 0, Math.PI*2);
        ctx.fill();
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
}

function createRuinedMarble() {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    for(let i=0; i<15; i++) {
        ctx.beginPath();
        let startX = Math.random()*256; let startY = Math.random()*256;
        ctx.moveTo(startX, startY);
        for(let j=0; j<4; j++) {
            startX += (Math.random()-0.5)*25;
            startY += (Math.random()-0.5)*25;
            ctx.lineTo(startX, startY);
        }
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 10);
    return tex;
}

// Materials
const wallMat = new THREE.MeshLambertMaterial({ color: 0x888888, map: createPeelingWallpaper() });
const fleshMat = new THREE.MeshLambertMaterial({ color: 0xff4444, map: createPeelingWallpaper(true) }); // For Maze
const floorMat = new THREE.MeshLambertMaterial({ color: 0x666666, map: createRuinedMarble() });
const woodMat = new THREE.MeshLambertMaterial({ color: 0x332211 }); 
const ceilMat = new THREE.MeshLambertMaterial({ color: 0x050505 });

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.01)); // Pitch black

// Flashlight (Flickers automatically)
const flashlight = new THREE.SpotLight(0xfff0dd, 1500, 30, Math.PI / 4, 0.8, 1.5);
camera.add(flashlight);
camera.add(flashlight.target);
flashlight.target.position.set(0, 0, -1);

// Global Objects
const objects = [];
const stairObjects = []; 
const bodyParts = [];

const levelGroup = new THREE.Group();
scene.add(levelGroup);

// Global Floor
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

import madaImg from '../assets/images/mada.jpeg';
import gokgokFile from '../assets/audio/gokgokgok.mp3';
import indianFile from '../assets/audio/indian.mp3';

// The Weaver (Monster)
const weaver = new THREE.Group();
weaver.position.set(0, 100, 0); // Hide high up initially
scene.add(weaver);

const weaverTex = new THREE.TextureLoader().load(madaImg);
const weaverMat = new THREE.SpriteMaterial({ map: weaverTex, color: 0xffffff });
const weaverSprite = new THREE.Sprite(weaverMat);
weaverSprite.scale.set(6, 6, 1); // Make face MUCH bigger
weaver.add(weaverSprite);

const weaverRay = new THREE.Raycaster();
let weaverNormal = new THREE.Vector3(0, -1, 0);
let weaverActive = false; // Activates when player collects first item or enters level 2

// Level Management
let currentLevel = 1;
let interactiveDoor = null;
let collectedParts = 0;
const totalParts = 5;
const partsUI = document.getElementById('parts-ui');

function createWall(x, z, w, d, group, height = 4, yOffset = 2, mat = wallMat) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), mat);
    mesh.position.set(x, yOffset, z);
    group.add(mesh);
    objects.push(mesh);
    return mesh;
}

function spawnBodyPartsLevel1() {
    const partMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    // Spread around the 30x30 room
    const positions = [
        new THREE.Vector3(-12, 0.5, -12),
        new THREE.Vector3(12, 0.5, -12),
        new THREE.Vector3(-12, 0.5, 12),
        new THREE.Vector3(12, 0.5, 12),
        new THREE.Vector3(0, 0.5, 5)
    ];
    for (let pos of positions) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3), partMat);
        mesh.position.copy(pos);
        levelGroup.add(mesh);
        bodyParts.push(mesh);
    }
}

function createDimensionDoor(x, y, z, isWhite = false) {
    const doorGeom = new THREE.BoxGeometry(3, 4, 0.5);
    const doorMat = new THREE.MeshLambertMaterial({ color: isWhite ? 0xffffff : 0x442200, emissive: isWhite ? 0xffffff : 0x000000 });
    interactiveDoor = new THREE.Mesh(doorGeom, doorMat);
    interactiveDoor.position.set(x, y + 2, z);
    levelGroup.add(interactiveDoor);
    objects.push(interactiveDoor);
}

function buildMaze(group) {
    // Simple 30x30 Blood Maze
    createWall(0, 15, 30, 1, group, 4, 2, fleshMat); // Back
    createWall(0, -15, 30, 1, group, 4, 2, fleshMat); // Front
    createWall(-15, 0, 1, 30, group, 4, 2, fleshMat); // Left
    createWall(15, 0, 1, 30, group, 4, 2, fleshMat); // Right
    
    if (gameDifficulty === 1) {
        // Easy Maze: Very few walls
        createWall(-5, 0, 1, 10, group, 4, 2, fleshMat);
        createWall(5, -5, 1, 10, group, 4, 2, fleshMat);
    } else if (gameDifficulty === 2) {
        // Normal Maze: Standard complexity
        createWall(-5, 0, 1, 20, group, 4, 2, fleshMat);
        createWall(5, -5, 1, 20, group, 4, 2, fleshMat);
        createWall(0, 10, 10, 1, group, 4, 2, fleshMat);
        createWall(-10, 5, 10, 1, group, 4, 2, fleshMat);
    } else {
        // Hard Maze: Ruwet (Complicated)
        createWall(-5, 0, 1, 20, group, 4, 2, fleshMat);
        createWall(5, -5, 1, 20, group, 4, 2, fleshMat);
        createWall(0, 10, 10, 1, group, 4, 2, fleshMat);
        createWall(-10, 5, 10, 1, group, 4, 2, fleshMat);
        createWall(10, 5, 1, 10, group, 4, 2, fleshMat);
        createWall(0, -10, 10, 1, group, 4, 2, fleshMat);
        createWall(-8, -8, 1, 10, group, 4, 2, fleshMat);
    }
}

window.loadLevel = function(level) {
    // Clear Level
    while(levelGroup.children.length > 0) { 
        levelGroup.remove(levelGroup.children[0]); 
    }
    objects.length = 0;
    bodyParts.length = 0;
    stairObjects.length = 0;
    interactiveDoor = null;
    
    currentLevel = level;
    
    // Manage Sounds
    if (scratchSound) {
        if (scratchSound.isPlaying) scratchSound.stop();
        if (level === 1 || level === 3) scratchSound.play();
    }
    if (window.indianSound) {
        if (window.indianSound.isPlaying) window.indianSound.stop();
        if (level === 2 || level === 3) window.indianSound.play();
    }
    
    // Reset player position safely
    controls.object.position.set(0, 1.6, 0);
    velocity.set(0,0,0);
    
    if (level === 1) {
        // Level 1: Spacious Mansion (30x30)
        createWall(0, 15, 30, 1, levelGroup); // Back
        createWall(0, -15, 30, 1, levelGroup); // Front
        createWall(-15, 0, 1, 30, levelGroup); // Left
        createWall(15, 0, 1, 30, levelGroup); // Right
        
        // A few pillars/walls to hide things
        createWall(-5, -5, 4, 1, levelGroup);
        createWall(5, 5, 1, 4, levelGroup);
        
        if (gameDifficulty >= 2) {
            createWall(8, -8, 4, 1, levelGroup);
            createWall(-8, 8, 1, 4, levelGroup);
        }
        if (gameDifficulty === 3) {
            createWall(0, 8, 8, 1, levelGroup);
            createWall(0, -8, 8, 1, levelGroup);
            createWall(-10, 0, 1, 8, levelGroup);
            createWall(10, 0, 1, 8, levelGroup);
        }
        
        spawnBodyPartsLevel1();
        createDimensionDoor(0, 0, -14.5); // Door at the north wall
        
        if (partsUI) partsUI.innerText = `🦴 Potongan: ${collectedParts}/${totalParts} | Temukan Semua`;
    } 
    else if (level === 2) {
        // Level 2: The Blood Maze
        buildMaze(levelGroup);
        createDimensionDoor(-10, 0, 14, false); // Door at south-west corner
        if (partsUI) partsUI.innerText = `Tugas: Cari Pintu Keluar di dalam Labirin!`;
        weaverActive = true; // Monster definitely hunts you here
        weaver.position.set(0, 1.6, -10); // Spawns behind you
    }
    else if (level === 3) {
        // Level 3: The Void
        const bridgeGeom = new THREE.BoxGeometry(4, 1, 100);
        const bridge = new THREE.Mesh(bridgeGeom, woodMat);
        bridge.position.set(0, -0.5, -45);
        levelGroup.add(bridge);
        objects.push(bridge);
        
        createDimensionDoor(0, 0, -90, true); // Glowing white door at the end
        if (partsUI) partsUI.innerText = `Tugas: LARI MENUJU CAHAYA!`;
        weaverActive = true;
        weaver.position.set(0, 1.6, 5); // Spawns right behind you
    }
};

// Audio Synthesis
let audioInitialized = false;
let droneOsc;

function initAudio() {
    if(audioInitialized) return;
    audioInitialized = true;
    
    try {
        listener = new THREE.AudioListener();
        camera.add(listener);
        audioCtx = listener.context;
        
        // Deep Wind
        const windBufferSize = Math.floor(audioCtx.sampleRate * 2);
        const windBuffer = audioCtx.createBuffer(1, windBufferSize, audioCtx.sampleRate);
        const windOutput = windBuffer.getChannelData(0);
        for (let i = 0; i < windBufferSize; i++) { windOutput[i] = Math.random() * 2 - 1; }
        const windSource = audioCtx.createBufferSource();
        windSource.buffer = windBuffer;
        windSource.loop = true;
        const windFilter = audioCtx.createBiquadFilter();
        windFilter.type = 'lowpass';
        windFilter.frequency.value = 150; 
        const windLfo = audioCtx.createOscillator();
        windLfo.type = 'sine';
        windLfo.frequency.value = 0.2; 
        const windLfoGain = audioCtx.createGain();
        windLfoGain.gain.value = 100;
        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);
        const windGain = audioCtx.createGain();
        windGain.gain.value = 2.0;
        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(audioCtx.destination);
        windLfo.start();
        windSource.start();

        // Heartbeat
        droneOsc = audioCtx.createOscillator();
        droneOsc.type = 'sine';
        droneOsc.frequency.value = 50;
        const heartbeatGain = audioCtx.createGain();
        heartbeatGain.gain.value = 0;
        droneOsc.connect(heartbeatGain);
        heartbeatGain.connect(audioCtx.destination);
        droneOsc.start();
        
        setInterval(() => {
            if(!audioCtx || audioCtx.state === 'suspended') return;
            const t = audioCtx.currentTime;
            heartbeatGain.gain.setValueAtTime(0, t);
            heartbeatGain.gain.linearRampToValueAtTime(1, t + 0.1);
            heartbeatGain.gain.linearRampToValueAtTime(0, t + 0.25);
            heartbeatGain.gain.setValueAtTime(0, t + 0.35);
            heartbeatGain.gain.linearRampToValueAtTime(0.7, t + 0.45);
            heartbeatGain.gain.linearRampToValueAtTime(0, t + 0.6);
        }, 1500);

        // Load Custom Sounds for Weaver
        const audioLoader = new THREE.AudioLoader();
        
        scratchSound = new THREE.PositionalAudio(listener);
        audioLoader.load(gokgokFile, function(buffer) {
            scratchSound.setBuffer(buffer);
            scratchSound.setRefDistance(2);
            scratchSound.setDistanceModel('linear');
            scratchSound.setMaxDistance(20);
            scratchSound.setLoop(true);
            scratchSound.setVolume(3.0); 
            weaver.add(scratchSound);
            if(currentLevel === 1 || currentLevel === 3) scratchSound.play();
        });

        window.indianSound = new THREE.PositionalAudio(listener);
        audioLoader.load(indianFile, function(buffer) {
            window.indianSound.setBuffer(buffer);
            window.indianSound.setRefDistance(2);
            window.indianSound.setDistanceModel('linear');
            window.indianSound.setMaxDistance(20);
            window.indianSound.setLoop(true);
            window.indianSound.setVolume(3.0);
            weaver.add(window.indianSound);
            if(currentLevel === 2 || currentLevel === 3) window.indianSound.play();
        });
        
    } catch(e) {
        console.error("Audio initialization failed:", e);
    }
}

// Initialize Game
loadLevel(1);

let time = 0;
let lastFlashlightFlicker = 0;
let gameOver = false;
let currentHeight = 1.6; 

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    if (gameOver) return;

    const now = performance.now();
    const delta = (now - prevTime) / 1000;
    prevTime = now;
    time += delta;

    if (controls.isLocked) {
        // Player Movement Logic
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speed = isSprinting ? 5.0 : 2.0;
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * 10 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * 10 * delta;

        const oldPos = controls.object.position.clone();

        // X Collision
        controls.moveRight(-velocity.x * delta);
        let playerBox = new THREE.Box3().setFromCenterAndSize(controls.object.position, new THREE.Vector3(0.3, 1.0, 0.3));
        for(let w of objects) {
            if(playerBox.intersectsBox(new THREE.Box3().setFromObject(w))) {
                controls.object.position.x = oldPos.x; velocity.x = 0; break;
            }
        }

        // Z Collision
        const tempX = controls.object.position.x;
        controls.object.position.copy(oldPos);
        controls.object.position.x = tempX;

        controls.moveForward(-velocity.z * delta);
        playerBox.setFromCenterAndSize(controls.object.position, new THREE.Vector3(0.3, 1.0, 0.3));
        for(let w of objects) {
            if(playerBox.intersectsBox(new THREE.Box3().setFromObject(w))) {
                controls.object.position.z = oldPos.z; velocity.z = 0; break;
            }
        }
        
        // Gravity / Floor snapping
        controls.object.position.y += (1.6 - controls.object.position.y) * 10 * delta;

        // Flashlight Flicker
        if (now - lastFlashlightFlicker > Math.random() * 2000 + 500) {
            flashlight.intensity = Math.random() > 0.8 ? 0 : 1500;
            lastFlashlightFlicker = now;
        }

        // Collect Body Parts
        for (let i = bodyParts.length - 1; i >= 0; i--) {
            const part = bodyParts[i];
            if (controls.object.position.distanceTo(part.position) < 2) {
                levelGroup.remove(part);
                bodyParts.splice(i, 1);
                collectedParts++;
                if (partsUI && currentLevel === 1) partsUI.innerText = `🦴 Potongan: ${collectedParts}/${totalParts} | Pintu Butuh 5`;
                
                if(!weaverActive) weaverActive = true; // Wake up ghost!
            }
        }

        // Interactive Door Logic
        if (interactiveDoor) {
            const distToDoor = controls.object.position.distanceTo(interactiveDoor.position);
            if (distToDoor < 3.5) {
                if (currentLevel === 1) {
                    if (collectedParts >= totalParts) {
                        loadLevel(2);
                    } else {
                        if(partsUI) partsUI.innerText = `[Terkunci] Butuh ${totalParts - collectedParts} Potongan Lagi!`;
                    }
                } else if (currentLevel === 2) {
                    loadLevel(3);
                } else if (currentLevel === 3) {
                    gameOver = true;
                    if(partsUI) {
                        partsUI.innerText = "KAMU BERHASIL KABUR!";
                        partsUI.style.fontSize = "40px";
                        partsUI.style.top = "50%";
                        partsUI.style.left = "50%";
                        partsUI.style.transform = "translate(-50%, -50%)";
                        partsUI.style.color = "#00ff00";
                    }
                    controls.unlock();
                    document.body.style.backgroundColor = "#ffffff";
                    renderer.domElement.style.opacity = 0;
                }
            }
        }

        // Weaver AI
        if (weaverActive) {
            const distToPlayer = controls.object.position.distanceTo(weaver.position);
            const dirToPlayer = new THREE.Vector3().subVectors(controls.object.position, weaver.position).normalize();
            
            // Scale Speed based on difficulty
            // Player sprint is 5.0
            let maxSpeed = 3.0;
            if (gameDifficulty === 2) maxSpeed = 4.0;
            if (gameDifficulty === 3) maxSpeed = 4.8;

            if(Math.random() > 0.8) {
                weaver.position.addScaledVector(dirToPlayer, maxSpeed * delta); 
            } else {
                weaver.position.addScaledVector(dirToPlayer, 1.5 * delta); 
            }
            
            // Stick to nearest surface
            weaverRay.set(weaver.position, weaverNormal);
            const weaverSurfaces = objects.concat([floor]);
            const intersects = weaverRay.intersectObjects(weaverSurfaces);
            if(intersects.length > 0 && intersects[0].distance < 2) {
                weaver.position.copy(intersects[0].point).addScaledVector(intersects[0].face.normal, 0.4);
                weaverNormal.lerp(intersects[0].face.normal, 0.2).normalize();
                
                const up = weaverNormal;
                const targetZ = dirToPlayer.clone().projectOnPlane(up).normalize();
                if(targetZ.lengthSq() > 0) {
                    const targetX = new THREE.Vector3().crossVectors(up, targetZ).normalize();
                    const mat = new THREE.Matrix4().makeBasis(targetX, up, targetZ);
                    weaver.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(mat), 0.2);
                }
            } else {
                weaverNormal.set(0, 1, 0);
                weaver.position.y -= 5 * delta;
                if(weaver.position.y < 0.5) weaver.position.y = 0.5;
            }

            // Jumpscare Death
            if(distToPlayer < 1.5) {
                gameOver = true;
                document.getElementById('health-ui').innerText = "THE WEAVER CLAIMED YOU";
                document.getElementById('health-ui').style.fontSize = "80px";
                document.getElementById('health-ui').style.top = "50%";
                document.getElementById('health-ui').style.left = "50%";
                document.getElementById('health-ui').style.transform = "translate(-50%, -50%)";
                document.body.style.backgroundColor = "#550000";
                renderer.domElement.style.opacity = 0;
                controls.unlock();
                if(scratchSound && scratchSound.isPlaying) scratchSound.stop();
            }
        }
    }

    const debugUI = document.getElementById('debug-ui');
    if (debugUI) {
        debugUI.innerText = `Lvl: ${currentLevel} | Pos: ${controls.object.position.x.toFixed(1)}, ${controls.object.position.z.toFixed(1)}`;
    }

    renderer.render(scene, camera);
}

animate();