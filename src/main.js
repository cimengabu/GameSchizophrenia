import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Setup Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
// Heavy volumetric fog (reduced density for better visibility)
scene.fog = new THREE.Fog(0x1a1a1a, 2, 30);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.y = 1.6; // average eye height

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Add some basic post-processing-like tonemapping
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
document.getElementById('game-container').appendChild(renderer.domElement);

// Controls
const controls = new PointerLockControls(camera, document.body);

const blocker = document.getElementById('blocker');
const instructions = document.getElementById('instructions');

instructions.addEventListener('click', function () {
    controls.lock();
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
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
    }
};

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Flashlight Toggle via Right Click
document.addEventListener('mousedown', function(event) {
    if (controls.isLocked === true && event.button === 2) {
        flashlight.visible = !flashlight.visible;
    }
});

// Prevent context menu on right click
document.addEventListener('contextmenu', function(event) {
    event.preventDefault();
});

// Generate procedural bloody/rusty texture for walls
function createHorrorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base dark rusty metal/stone
    for (let x = 0; x < 512; x+=4) {
        for (let y = 0; y < 512; y+=4) {
            let val = Math.floor(Math.random() * 40 + 15);
            ctx.fillStyle = `rgb(${val},${val-5},${val-10})`;
            ctx.fillRect(x, y, 4, 4);
        }
    }

    // Blood splatters and black mold
    for(let i=0; i<150; i++) {
        ctx.beginPath();
        let cx = Math.random() * 512;
        let cy = Math.random() * 512;
        let radius = Math.random() * 20 + 5;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = Math.random() > 0.4 ? `rgba(80, 0, 0, ${Math.random()*0.9})` : `rgba(10, 10, 10, ${Math.random()*0.9})`;
        ctx.fill();
        
        // Drip lines (blood dripping down)
        if (Math.random() > 0.5) {
            ctx.fillStyle = `rgba(60, 0, 0, 0.7)`;
            ctx.fillRect(cx - radius/4, cy, Math.random()*5 + 2, Math.random()*150 + 50);
        }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
}

const wallMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x777777, 
    map: createHorrorTexture()
});

const floorMaterial = new THREE.MeshLambertMaterial({ 
    color: 0x222222,
    map: createHorrorTexture()
});

// Environment Map (Tight Claustrophobic Maze)
const mapSize = 25;
const wallSize = 3; // Narrower paths
const ceilingHeight = 2.4; // Extremely low ceiling for claustrophobia
const objects = [];

// Create Floor
const floorGeometry = new THREE.PlaneGeometry(mapSize * wallSize, mapSize * wallSize);
floorGeometry.rotateX(-Math.PI / 2);
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
scene.add(floor);

// Create Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(mapSize * wallSize, mapSize * wallSize);
ceilingGeometry.rotateX(Math.PI / 2);
const ceiling = new THREE.Mesh(ceilingGeometry, floorMaterial);
ceiling.position.y = ceilingHeight;
scene.add(ceiling);

const wallGeometry = new THREE.BoxGeometry(wallSize, ceilingHeight, wallSize);

for (let i = 0; i < mapSize; i++) {
    for (let j = 0; j < mapSize; j++) {
        // Create denser, tighter maze layout
        if (i === 0 || i === mapSize - 1 || j === 0 || j === mapSize - 1 || Math.random() > 0.65) {
            // Don't spawn wall at 0,0 where player starts
            if (i < 3 && j < 3) continue;
            
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.x = (i - mapSize / 2) * wallSize;
            wall.position.y = ceilingHeight / 2;
            wall.position.z = (j - mapSize / 2) * wallSize;
            scene.add(wall);
            objects.push(wall);
        }
    }
}

// Lighting
// Global ambient light to guarantee visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Real Flashlight (SpotLight) attached to camera
const flashlight = new THREE.SpotLight(0xffffee, 1500); // 1500 intensity for modern Three.js
flashlight.position.set(0, 0, 0); // Positioned at the camera
flashlight.target.position.set(0, 0, -1); // Pointing forward
flashlight.angle = Math.PI / 3; // Wide beam
flashlight.penumbra = 0.5; // Soft edges
flashlight.decay = 1.5;
flashlight.distance = 60; // Shines far
camera.add(flashlight);
camera.add(flashlight.target); // Important: add the target to the camera so it rotates with it

// Flickering broken neon lights scattered
const neonLights = [];
for (let i = 0; i < 8; i++) {
    const light = new THREE.PointLight(0xff0000, 500, 15); // 500 intensity
    light.position.x = (Math.random() - 0.5) * mapSize * wallSize;
    light.position.y = ceilingHeight - 0.2;
    light.position.z = (Math.random() - 0.5) * mapSize * wallSize;
    scene.add(light);
    neonLights.push(light);
}

// The Monster (Entity - Eldritch Tentacle Horror)
const monster = new THREE.Group();
monster.position.set(10, 1.5, 10);

// Core of the monster
const coreGeom = new THREE.IcosahedronGeometry(0.8, 1);
const coreMat = new THREE.MeshLambertMaterial({ color: 0x110000, wireframe: true });
const core = new THREE.Mesh(coreGeom, coreMat);
monster.add(core);

// Tentacles
const tentacles = [];
const numTentacles = 8;
const tentacleMat = new THREE.MeshLambertMaterial({ color: 0x330000 });

for (let i = 0; i < numTentacles; i++) {
    // Generate random control points for each tentacle
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0)); // Start at center
    for (let j = 1; j < 5; j++) {
        points.push(new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
        ));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
    const tentacle = new THREE.Mesh(tubeGeom, tentacleMat);
    
    monster.add(tentacle);
    tentacles.push({ mesh: tentacle, curve: curve, points: points, phase: Math.random() * Math.PI * 2 });
}
scene.add(monster);

// Audio Context for heartbeat
let audioCtx, heartbeatOsc, heartbeatGain;
let audioInitialized = false;

function initAudio() {
    if (audioInitialized) return;
    audioInitialized = true;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Heartbeat setup
    heartbeatOsc = audioCtx.createOscillator();
    heartbeatGain = audioCtx.createGain();
    heartbeatOsc.type = 'sine';
    heartbeatOsc.frequency.setValueAtTime(60, audioCtx.currentTime);
    heartbeatGain.gain.setValueAtTime(0, audioCtx.currentTime);
    heartbeatOsc.connect(heartbeatGain);
    heartbeatGain.connect(audioCtx.destination);
    heartbeatOsc.start();
}

function playBeat() {
    if(!audioInitialized) return;
    heartbeatGain.gain.setValueAtTime(1, audioCtx.currentTime);
    heartbeatGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
}

let lastBeatTime = 0;
let health = 100;
const healthUI = document.getElementById('health-ui');
let gameOver = false;

// Raycaster for collisions
const raycaster = new THREE.Raycaster();

window.addEventListener('resize', onWindowResize);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (gameOver) return;

    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        // Velocity damping
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        const speedMultiplier = 30.0; // Movement speed
        if (moveForward || moveBackward) velocity.z -= direction.z * speedMultiplier * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speedMultiplier * delta;

        // Collision detection basic implementation
        // Check forward
        raycaster.ray.origin.copy(controls.object.position);
        
        // Very basic collision: move, if inside wall, move back
        const oldPos = controls.object.position.clone();
        
        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        
        // Keep y position locked to player height
        controls.object.position.y = 1.6;

        // Simple bounding box collision against all objects
        let playerBox = new THREE.Box3().setFromCenterAndSize(controls.object.position, new THREE.Vector3(0.5, 1.6, 0.5));
        for (let obj of objects) {
            let objBox = new THREE.Box3().setFromObject(obj);
            if (playerBox.intersectsBox(objBox)) {
                // Revert movement
                controls.object.position.copy(oldPos);
                break;
            }
        }

        // Flicker neon lights
        for (let light of neonLights) {
            if (Math.random() > 0.9) {
                light.intensity = Math.random() * 2;
            }
        }

        // Monster Logic
        const distToMonster = controls.object.position.distanceTo(monster.position);
        
        // Monster moves towards player
        const dirToPlayer = new THREE.Vector3().subVectors(controls.object.position, monster.position).normalize();
        monster.position.addScaledVector(dirToPlayer, 2.0 * delta); // Monster speed
        
        // Jitter monster & animate core
        monster.position.x += (Math.random() - 0.5) * 0.1;
        monster.position.z += (Math.random() - 0.5) * 0.1;
        monster.position.y = 1.5 + Math.sin(time * 0.005) * 0.2; // Hover
        core.rotation.x += 0.05;
        core.rotation.y += 0.05;

        // Animate tentacles
        tentacles.forEach((t) => {
            const timePhase = time * 0.002 + t.phase;
            // Wiggle control points (keep index 0 at center)
            for (let i = 1; i < t.points.length; i++) {
                t.points[i].x += Math.sin(timePhase + i) * 0.03;
                t.points[i].y += Math.cos(timePhase + i) * 0.03;
                t.points[i].z += Math.sin(timePhase * 0.8 + i) * 0.03;
            }
            // Rebuild geometry
            t.curve.points = t.points;
            t.mesh.geometry.dispose();
            t.mesh.geometry = new THREE.TubeGeometry(t.curve, 20, 0.15, 6, false);
        });

        // Heartbeat
        if (distToMonster < 15) {
            let beatInterval = Math.max(200, distToMonster * 50);
            if (time - lastBeatTime > beatInterval) {
                playBeat();
                lastBeatTime = time;
                // Camera shake
                camera.position.y = 1.6 + (Math.random() - 0.5) * 0.05 * (15/distToMonster);
            }
            
            // Health drain
            health -= delta * (15/distToMonster);
            healthUI.innerText = `❤️ ${Math.floor(Math.max(0, health))}`;
            
            if (health <= 0 || distToMonster < 1) {
                // Game Over
                gameOver = true;
                healthUI.innerText = "YOU DIED";
                healthUI.style.color = "#000";
                healthUI.style.fontSize = "100px";
                healthUI.style.top = "50%";
                healthUI.style.left = "50%";
                healthUI.style.transform = "translate(-50%, -50%)";
                controls.unlock();
                document.body.style.backgroundColor = "#ff0000";
                renderer.domElement.style.opacity = 0;
            }
        } else {
            health = Math.min(100, health + delta * 2);
            healthUI.innerText = `❤️ ${Math.floor(health)}`;
            camera.position.y = 1.6; // Reset shake
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}

animate();