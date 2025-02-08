let scene, camera, renderer, controls, raycaster;
let room;
const artworkSpacing = 5;
const wallWidth = 40;
const wallHeight = 10;
const wallDepth = 0.2;
let artworks = [];
let musicPlaying = false;
const music = document.getElementById('bg-music');
let clock = new THREE.Clock(); // Create a clock for animation timing

// --- Texture Loading ---
const textureLoader = new THREE.TextureLoader();
const wallTexture = textureLoader.load('wall_texture.png', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
}, undefined, (error) => { console.error('Error loading wall texture:', error); });

const floorTexture = textureLoader.load('floor_texture.jpeg', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
}, undefined, (error) => { console.error('Error loading floor texture:', error); });

const ceilingTexture = textureLoader.load('ceiling_texture.jpg', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
}, undefined, (error) => { console.error('Error loading ceiling texture: ', error) });


init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x111111);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    createRoom();
    addLights();

    controls = new THREE.PointerLockControls(camera, document.body);
    const overlay = document.getElementById('overlay');
    overlay.addEventListener('click', () => { controls.lock(); });
    controls.addEventListener('lock', () => {
        overlay.style.display = 'none';
        if (!musicPlaying) { music.play(); musicPlaying = true; }
    });
    controls.addEventListener('unlock', () => { overlay.style.display = 'flex'; });
    raycaster = new THREE.Raycaster();
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('click', onClick, false);
    const fileUpload = document.getElementById('file-upload');
    fileUpload.addEventListener('change', handleFileUpload, false);
    document.getElementById('close-info').addEventListener('click', () => {
        document.getElementById('artwork-info').style.display = 'none';
    });
}

function createRoom() {
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ map: ceilingTexture });

    const floorGeometry = new THREE.PlaneGeometry(wallWidth, wallWidth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceilingGeometry = new THREE.PlaneGeometry(wallWidth, wallWidth);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    scene.add(ceiling);

    const recessLightGeometry = new THREE.PlaneGeometry(1, 1);
    const recessLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffee, emissive: 0xffffcc, emissiveIntensity: 0.5 });

    const recessLight1 = new THREE.Mesh(recessLightGeometry, recessLightMaterial);
    recessLight1.rotation.x = Math.PI / 2;
    recessLight1.position.set(-5, wallHeight - 0.01, -5);
    ceiling.add(recessLight1);

    const recessLight2 = new THREE.Mesh(recessLightGeometry, recessLightMaterial);
    recessLight2.rotation.x = Math.PI / 2;
    recessLight2.position.set(5, wallHeight - 0.01, -5);
    ceiling.add(recessLight2);

    const recessLight3 = new THREE.Mesh(recessLightGeometry, recessLightMaterial);
    recessLight3.rotation.x = Math.PI / 2;
    recessLight3.position.set(5, wallHeight - 0.01, 5);
    ceiling.add(recessLight3);

    const recessLight4 = new THREE.Mesh(recessLightGeometry, recessLightMaterial);
    recessLight4.rotation.x = Math.PI / 2;
    recessLight4.position.set(-5, wallHeight - 0.01, 5);
    ceiling.add(recessLight4);


    const wallGeometry = new THREE.BoxGeometry(wallWidth, wallHeight, wallDepth);
    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.set(0, wallHeight / 2, -wallWidth / 2);
    wall1.castShadow = true;
    wall1.receiveShadow = true;
    wall1.userData.normal = new THREE.Vector3(0, 0, 1);
    scene.add(wall1);

    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.rotation.y = Math.PI / 2;
    wall2.position.set(-wallWidth / 2, wallHeight / 2, 0);
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    wall2.userData.normal = new THREE.Vector3(1, 0, 0);
    scene.add(wall2);

    const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall3.position.set(0, wallHeight / 2, wallWidth / 2);
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    wall3.userData.normal = new THREE.Vector3(0, 0, -1);
    scene.add(wall3);

    const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall4.rotation.y = -Math.PI / 2;
    wall4.position.set(wallWidth / 2, wallHeight / 2, 0);
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    wall4.userData.normal = new THREE.Vector3(-1, 0, 0);
    scene.add(wall4);

    room = new THREE.Group();
    room.add(wall1, wall2, wall3, wall4, floor, ceiling);
    const wall1BB = new THREE.Box3().setFromObject(wall1);
    const wall2BB = new THREE.Box3().setFromObject(wall2);
    const wall3BB = new THREE.Box3().setFromObject(wall3);
    const wall4BB = new THREE.Box3().setFromObject(wall4);
    room.userData.boundingBoxes = [wall1BB, wall2BB, wall3BB, wall4BB];
    scene.add(room);
}

function addLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 0.8);
    spotLight.position.set(0, wallHeight, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.1;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 0.5;
    spotLight.shadow.camera.far = wallWidth;
    scene.add(spotLight);

    //Adding point lights at different positions can also enhance
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5); // White light
    pointLight1.position.set(10, 5, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5);
    pointLight2.position.set(-10, 5, -10);
    scene.add(pointLight2);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (event.key === 'm' || event.key === 'M') {
        if (musicPlaying) {
            music.pause();
        } else {
            music.play();
        }
        musicPlaying = !musicPlaying;
    }
    const moveSpeed = 0.1;
    let moveDirection = new THREE.Vector3();
    switch (event.key) {
        case 'w': moveDirection.z = -1; break;
        case 's': moveDirection.z = 1; break;
        case 'a': moveDirection.x = -1; break;
        case 'd': moveDirection.x = 1; break;
        default: return;
    }
    moveDirection.applyQuaternion(camera.quaternion).normalize();
    moveDirection.multiplyScalar(moveSpeed);
    const nextPosition = camera.position.clone().add(moveDirection);
    const playerBB = new THREE.Box3(new THREE.Vector3(-0.5, -1, -0.5), new THREE.Vector3(0.5, 1, 0.5));
    playerBB.translate(nextPosition);
    if (!isColliding(playerBB)) {
        camera.position.add(moveDirection);
    }
}

function isColliding(playerBB) {
    if (!room.userData.boundingBoxes) return false;
    for (const wallBB of room.userData.boundingBoxes) {
        if (playerBB.intersectsBox(wallBB)) return true;
    }
    return false;
}

function onClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(artworks.map(a => a.mesh), false);
    if (intersects.length > 0) {
        const artwork = intersects[0].object;
        document.getElementById('artwork-title').textContent = artwork.userData.title || "Untitled";
        document.getElementById('artwork-artist').textContent = artwork.userData.artist || "Unknown Artist";
        document.getElementById('artwork-description').textContent = artwork.userData.description || "No description available.";
        document.getElementById('artwork-info').style.display = 'block';
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
            console.warn('Skipping non-image file:', file.name);
            continue;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                createArtwork(img, {
                    title: `Artwork ${artworks.length + 1}`,
                    artist: "Unknown",
                    description: "Uploaded artwork."
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function createArtworkFrame(width, height, depth) {
    const frameGeometry = new THREE.BoxGeometry(width + 0.2, height + 0.2, depth);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.castShadow = true;
    return frame;
}

function createArtwork(img, artworkData) {
    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    const material = new THREE.MeshStandardMaterial({ map: texture });
    material.roughness = 0.8;
    material.metalness = 0.2;

    const geometry = new THREE.BoxGeometry(2, 2 * (img.height / img.width), 0.2);
    const artwork = new THREE.Mesh(geometry, material);
    artwork.castShadow = true;
    artwork.receiveShadow = true;

    artwork.userData = artworkData;
    artwork.userData.animation = {
        speed: Math.random() * 0.005 + 0.002, // Slower speed
        offset: Math.random() * Math.PI * 2,
        amplitude: 0.1,  // Smaller amplitude
        heightOffset: (Math.random() * 2 - 1) * 0.5
    };

    const frame = createArtworkFrame(geometry.parameters.width, geometry.parameters.height, 0.1);
    artwork.add(frame);

    const position = getNextArtworkPosition3D(artwork);
    artwork.position.copy(position);

    scene.add(artwork);
    artworks.push({ mesh: artwork, position: position });
}

function getNextArtworkPosition3D(artwork) {
    const numArtworks = artworks.length;
    const spacing = 5;
    const rows = 4;
    const artworkWidth = artwork.geometry.parameters.width;
    const artworkHeight = artwork.geometry.parameters.height;

    const startX = -15;
    const startZ = -15;
    const startY = 1;

    const row = Math.floor(numArtworks / rows) ;
    const col = numArtworks % rows;

    const x = startX + col * (artworkWidth + spacing);
    const y = startY;
    const z = startZ + row * (artworkHeight + spacing);

    return new THREE.Vector3(x, y, z);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.elapsedTime;

    for (const artwork of artworks) {
        const animation = artwork.mesh.userData.animation;
        artwork.mesh.position.y = 1 + animation.heightOffset + Math.sin(time * animation.speed + animation.offset) * animation.amplitude;
    }

    renderer.render(scene, camera);
}