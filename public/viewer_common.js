import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;

export async function initViewer() {
    console.log("initViewer: Starting initialization...");
    const container = document.getElementById('container');
    console.log("initViewer: container element:", container);
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);

    const light = new THREE.AmbientLight(0xffffff, 3);
    scene.add(light);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 0, 0.01);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;

    try {
        renderer.xr.setReferenceSpaceType('local');
    } catch (error) {
        console.log('local is not supported');
    }
    try {
        renderer.xr.setReferenceSpaceType('viewer');
    } catch (error) {
        console.log('viewer is not supported');
    }
    try {
        renderer.xr.setReferenceSpaceType('local-floor');
    } catch (error) {
        console.log('local-floor is not supported');
    }

    container.appendChild(renderer.domElement);

    const vrButton = VRButton.createButton(renderer);
    document.body.appendChild(vrButton);
    console.log("initViewer: VRButton created and added to DOM.", vrButton);

    window.addEventListener('resize', onWindowResize);

    console.log("initViewer: Initialization complete.");

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

export async function loadPanorama(panoramaId) {
    console.log(`loadPanorama: Loading panorama: ${panoramaId}`);
    try {
        // CHANGED: Use full Worker URL instead of '/api/panorama/...'
        const response = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/panorama/${panoramaId}`);
        if (!response.ok) {
            console.error(`loadPanorama: No config found for ${panoramaId}, server responded with: ${response.status} - ${response.statusText}`);
            return;
        }
        const metadata = await response.json();

        console.log(`loadPanorama: Metadata loaded for ${panoramaId}:`, metadata);

        // Update UI elements if present
        const sphereSizeEl = document.getElementById('sphereSizeValue');
        const depthScaleEl = document.getElementById('depthScaleValue');
        const meshResEl = document.getElementById('meshResolutionValue');

        if (sphereSizeEl) sphereSizeEl.innerText = metadata.sphereSize;
        if (depthScaleEl) depthScaleEl.innerText = metadata.depthScale;
        if (meshResEl) meshResEl.innerText = metadata.meshResolution;

        if (document.getElementById('sphereSize')) {
            document.getElementById('sphereSize').value = metadata.sphereSize;
        }
        if (document.getElementById('depthScale')) {
            document.getElementById('depthScale').value = metadata.depthScale;
        }
        if (document.getElementById('meshResolution')) {
            document.getElementById('meshResolution').value = metadata.meshResolution;
        }

        // Remove old sphere if exists
        if (sphere) {
            console.log(`loadPanorama: Removing old sphere for ${panoramaId}`);
            scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
        }

        // Create sphere
        const panoSphereGeo = new THREE.SphereGeometry(metadata.sphereSize, metadata.meshResolution, metadata.meshResolution);
        const panoSphereMat = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide,
            displacementScale: metadata.depthScale,
            transparent: false,
            opacity: 1,
        });

        sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);
        scene.add(sphere);
        console.log(`loadPanorama: Sphere created and added to scene for ${panoramaId}.`, sphere);

        // Load images using R2 URLs from metadata
        const manager = new THREE.LoadingManager();
        const loader = new THREE.TextureLoader(manager);

        loader.load(
            metadata.imageURL,
            (texture) => {
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

// (Optional) Example config update function. This route doesn't exist in the Worker code.
// If you want it to do something, you must implement a matching /api/update_config endpoint.
export async function updatePanoramaConfig(panorama, settings) {
    console.log(`updatePanoramaConfig: Updating config for panorama: ${panorama}, settings:`, settings);
    try {
        // CHANGED: Use full Worker URL instead of '/api/update_config'
        const response = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/update_config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ panorama, ...settings })
        });
        if (!response.ok) {
            console.error(`updatePanoramaConfig: Server responded with error: ${response.status} - ${response.statusText}`);
            return;
        }
        console.log("updatePanoramaConfig: Config updated successfully.");
    } catch (error) {
        console.error("updatePanoramaConfig: Error updating config:", error);
    }
}
