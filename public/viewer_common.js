import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;

export async function initViewer() {
    const container = document.getElementById('container');
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);

    const light = new THREE.AmbientLight(0xffffff, 3);
    scene.add(light);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');
    container.appendChild(renderer.domElement);

    document.body.appendChild(VRButton.createButton(renderer));
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if (sphere && !renderer.xr.isPresenting) {
        const time = clock.getElapsedTime();
        sphere.rotation.y += 0.001;
        sphere.position.x = Math.sin(time) * 0.2;
        sphere.position.z = Math.cos(time) * 0.2;
    }
    renderer.render(scene, camera);
}

export async function loadPanoramas() {
    // Fetch the list of panoramas from your serverless endpoint or static list
    // Adjust this to your actual API endpoint or method of getting panorama names.
    const response = await fetch('/api/panorama_list');
    return await response.json();
}

export async function updatePanoramaConfig(panorama, settings) {
    // Call your serverless function to update config
    // Adjust as needed if you store configs elsewhere
    await fetch(`/api/update_config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panorama, ...settings })
    });
}

export async function loadPanorama(panorama) {
    // Fetch config.json
    const configResponse = await fetch(`/panoramas/${panorama}/config.json`);
    if (!configResponse.ok) {
        console.error('No config found for', panorama);
        return;
    }
    const config = await configResponse.json();

    // Update UI elements if present
    const sphereSizeEl = document.getElementById('sphereSizeValue');
    const depthScaleEl = document.getElementById('depthScaleValue');
    const meshResEl = document.getElementById('meshResolutionValue');

    if (sphereSizeEl) sphereSizeEl.innerText = config.sphereSize;
    if (depthScaleEl) depthScaleEl.innerText = config.depthScale;
    if (meshResEl) meshResEl.innerText = config.meshResolution;

    if (document.getElementById('sphereSize')) document.getElementById('sphereSize').value = config.sphereSize;
    if (document.getElementById('depthScale')) document.getElementById('depthScale').value = config.depthScale;
    if (document.getElementById('meshResolution')) document.getElementById('meshResolution').value = config.meshResolution;

    // Remove old sphere if exists
    if (sphere) {
        scene.remove(sphere);
        sphere.geometry.dispose();
        sphere.material.dispose();
    }

    const panoSphereGeo = new THREE.SphereGeometry(config.sphereSize, config.meshResolution, config.meshResolution);
    const panoSphereMat = new THREE.MeshStandardMaterial({
        side: THREE.BackSide,
        displacementScale: config.depthScale
    });

    sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);
    scene.add(sphere);

    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);

    loader.load(`/panoramas/${panorama}/image.png`, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        sphere.material.map = texture;
    }, undefined, (err) => {
        console.error('Failed to load main image for', panorama, err);
    });

    loader.load(`/panoramas/${panorama}/depth.png`, (depth) => {
        depth.minFilter = THREE.NearestFilter;
        depth.generateMipmaps = false;
        sphere.material.displacementMap = depth;
    }, undefined, () => {
        console.log(`No depth map found for ${panorama}, proceeding without displacement.`);
    });

    manager.onLoad = () => {
        console.log(`Panorama ${panorama} loaded successfully.`);
    };
}
