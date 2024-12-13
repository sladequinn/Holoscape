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

    camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 1, 2000);
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
    const res = await fetch('/api/panorama_list');
    return await res.json();
}

export async function updatePanoramaConfig(panorama, settings) {
    // Update config via serverless function
    await fetch(`/api/update_config`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ panorama, ...settings })
    });
}

export async function loadPanorama(panorama) {
    // Fetch config directly from static files for now
    const configRes = await fetch(`/panoramas/${panorama}/config.json`);
    const config = await configRes.json();

    document.getElementById('sphereSizeValue').innerText = config.sphereSize;
    document.getElementById('depthScaleValue').innerText = config.depthScale;
    document.getElementById('meshResolutionValue').innerText = config.meshResolution;

    document.getElementById('sphereSize').value = config.sphereSize;
    document.getElementById('depthScale').value = config.depthScale;
    document.getElementById('meshResolution').value = config.meshResolution;

    if (sphere) {
        scene.remove(sphere);
        sphere.geometry.dispose();
        sphere.material.dispose();
    }

    const panoSphereGeo = new THREE.SphereGeometry(
        config.sphereSize,
        config.meshResolution,
        config.meshResolution
    );

    const panoSphereMat = new THREE.MeshStandardMaterial({
        side: THREE.BackSide,
        displacementScale: config.depthScale
    });
    sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);
    scene.add(sphere);

    const manager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(manager);

    loader.load(`/panoramas/${panorama}/image.png`, (texture) => {
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        sphere.material.map = texture;
    });

    loader.load(`/panoramas/${panorama}/depth.png`, (depth) => {
        depth.minFilter = THREE.NearestFilter;
        depth.generateMipmaps = false;
        sphere.material.displacementMap = depth;
    }, undefined, () => {
        console.log(`No depth map found for ${panorama}`);
    });

    manager.onLoad = () => {
        console.log(`Panorama ${panorama} loaded successfully.`);
    };
}
