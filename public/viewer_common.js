import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;

export async function initViewer() {
    console.log("initViewer: Starting initialization...");
    const container = document.getElementById('container');
    console.log("initViewer: container element:", container);

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    
    // Ensure the background is dark rather than defaulting to white
    scene.background = new THREE.Color(0x101010);

    // Same ambient light you used before (brightness is up to you)
    const light = new THREE.AmbientLight(0xffffff, 3);
    scene.add(light);

    // Perspective camera from the original code
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);

    // Make sure the camera is *inside* the sphere
    camera.position.set(0, 0, 0);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;

    // Attempt to set reference spaces (harmless if unsupported)
    try { renderer.xr.setReferenceSpaceType('local'); } catch (err) { }
    try { renderer.xr.setReferenceSpaceType('viewer'); } catch (err) { }
    try { renderer.xr.setReferenceSpaceType('local-floor'); } catch (err) { }

    container.appendChild(renderer.domElement);

    const vrButton = VRButton.createButton(renderer);
    document.body.appendChild(vrButton);
    console.log("initViewer: VRButton created and added to DOM.", vrButton);

    window.addEventListener('resize', onWindowResize);
    console.log("initViewer: Initialization complete.");

    // Log WebXR support if you want
    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                console.log("initViewer: WebXR immersive-vr is supported.");
            } else {
                console.log("initViewer: WebXR immersive-vr is not supported.");
            }
        });
    } else {
        console.log("initViewer: WebXR is not supported by this browser.");
    }
}

function onWindowResize() {
    console.log("onWindowResize: Window resized.");
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log("onWindowResize: Camera and renderer updated.");
}

function animate() {
    if (sphere && !renderer.xr.isPresenting) {
        const time = clock.getElapsedTime();
        sphere.rotation.y += 0.001;
        sphere.position.x = Math.sin(time) * 0.2;
        sphere.position.z = Math.cos(time) * 0.2;
    }
    try {
        renderer.render(scene, camera);
    } catch (error) {
        console.error("An error occurred during render:", error);
    }
}

/**
 * Loads a panorama by ID (with negative displacement, SRGB color, etc. intact).
 */
export async function loadPanorama(panoramaId) {
    console.log(`loadPanorama: Loading panorama: ${panoramaId}`);
    try {
        // If your Worker domain is different, change it here:
        const response = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/panorama/${panoramaId}`);
        if (!response.ok) {
            console.error(`loadPanorama: No config found for ${panoramaId}, status: ${response.status}`);
            return;
        }
        const metadata = await response.json();
        console.log(`loadPanorama: Metadata loaded for ${panoramaId}:`, metadata);

        // Remove old sphere if exists
        if (sphere) {
            console.log(`loadPanorama: Removing old sphere for ${panoramaId}`);
            scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
        }

        // EXACTLY as you had before: sphereSize, meshResolution, negative displacement
        const panoSphereGeo = new THREE.SphereGeometry(
            metadata.sphereSize,        // e.g., 6
            metadata.meshResolution,    // e.g., 256
            metadata.meshResolution     // e.g., 256
        );
        const panoSphereMat = new THREE.MeshStandardMaterial({
            // Key: BACKSIDE so we see texture from inside
            side: THREE.BackSide,
            // e.g., -4 if your data says so
            displacementScale: metadata.depthScale,
            transparent: false,
            opacity: 1
        });

        sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);
        scene.add(sphere);
        console.log(`loadPanorama: Sphere created and added to scene for ${panoramaId}.`, sphere);

        const manager = new THREE.LoadingManager();
        const loader = new THREE.TextureLoader(manager);

        // Load main color/texture
        loader.load(
            metadata.imageURL,
            (texture) => {
                // Keep SRGB so it matches your original “three.js vr - panorama with depth” code
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.NearestFilter;
                texture.generateMipmaps = false;
                sphere.material.map = texture;
                console.log(`loadPanorama: Main image loaded for ${panoramaId}`);
            },
            undefined,
            (err) => {
                console.error(`loadPanorama: Failed to load main image for ${panoramaId}:`, err);
            }
        );

        // Load depth/displacement map
        loader.load(
            metadata.depthURL,
            (depth) => {
                depth.minFilter = THREE.NearestFilter;
                depth.generateMipmaps = false;
                sphere.material.displacementMap = depth;
                console.log(`loadPanorama: Depth map loaded for ${panoramaId}`);
            },
            undefined,
            () => {
                console.log(`loadPanorama: No depth map found for ${panoramaId}, proceeding without displacement.`);
            }
        );

        manager.onLoad = () => {
            console.log(`loadPanorama: Panorama ${panoramaId} loaded successfully.`);
        };
    } catch (error) {
        console.error(`loadPanorama: Error loading panorama ${panoramaId}:`, error);
    }
}

/**
 * Optional config update, if you have that route implemented in your Worker.
 */
export async function updatePanoramaConfig(panorama, settings) {
    console.log(`updatePanoramaConfig: Updating config for panorama: ${panorama}, settings:`, settings);
    try {
        const response = await fetch(
            `https://holoscape-api.sladebquinn.workers.dev/api/update_config`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ panorama, ...settings })
            }
        );
        if (!response.ok) {
            console.error(`updatePanoramaConfig: Server responded with ${response.status}`);
            return;
        }
        console.log("u
