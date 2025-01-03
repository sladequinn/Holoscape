import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;

export async function initViewer() {
    console.log("initViewer: Starting initialization...");
    const container = document.getElementById('container');
    console.log("initViewer: container element:", container);

    clock = new THREE.Clock();
    scene = new THREE.Scene();

    // Dark background
    scene.background = new THREE.Color(0x101010);

    // Lower ambient light a bit so textures are not blown out
    const light = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(light);

    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera.position.set(0, 0, 0);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;

    // Attempt setting various referenceSpaceTypes
    try {
        renderer.xr.setReferenceSpaceType('local');
    } catch (err) {
        console.log('local refSpace not supported.');
    }

    container.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

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
        console.log("initViewer: WebXR not supported by this browser.");
    }
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

export async function loadPanorama(panoramaId) {
    console.log(`loadPanorama: Loading panorama: ${panoramaId}`);
    try {
        // Make sure this is the correct URL to your Worker
        const response = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/panorama/${panoramaId}`);

        if (!response.ok) {
            console.error(`loadPanorama: No config found for ${panoramaId}, server responded with: ${response.status} - ${response.statusText}`);
            return;
        }
        const metadata = await response.json();
        console.log(`loadPanorama: Metadata loaded for ${panoramaId}:`, metadata);

        // Remove old sphere if any
        if (sphere) {
            scene.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
        }

        // Hardcode or use metadata.sphereSize if you trust it
        const sphereSize = metadata.sphereSize || 6;
        // Temporarily reduce displacement scale to 0 or a small value to ensure geometry is visible
        const displacement = 0; 
        // If you trust your data, you can do: const displacement = metadata.depthScale;

        const geometry = new THREE.SphereGeometry(
            sphereSize,
            metadata.meshResolution || 256,
            metadata.meshResolution || 256
        );
        const material = new THREE.MeshStandardMaterial({
            side: THREE.BackSide,
            displacementScale: displacement,
            transparent: false,
            opacity: 1,
        });

        sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
        console.log(`loadPanorama: Created sphere for ${panoramaId} with size=${sphereSize}, displacement=${displacement}`);

        const manager = new THREE.LoadingManager();
        const loader = new THREE.TextureLoader(manager);

        loader.load(
            metadata.imageURL,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.NearestFilter;
                texture.generateMipmaps = false;
                sphere.material.map = texture;
                console.log(`loadPanorama: Main texture loaded for ${panoramaId}`);
            },
            undefined,
            (err) => {
                console.error(`Failed loading main texture for ${panoramaId}:`, err);
            }
        );

        loader.load(
            metadata.depthURL,
            (depthTex) => {
                depthTex.minFilter = THREE.NearestFilter;
                depthTex.generateMipmaps = false;
                sphere.material.displacementMap = depthTex;
                console.log(`loadPanorama: Depth map loaded for ${panoramaId}`);
            },
            undefined,
            (err) => {
                console.log(`No depth map found or error loading for ${panoramaId}`, err);
            }
        );

        manager.onLoad = () => {
            console.log(`loadPanorama: All textures loaded for ${panoramaId}.`);
        };

    } catch (error) {
        console.error(`loadPanorama: Error loading panorama ${panoramaId}:`, error);
    }
}

// Optional config update; remove or fix if you need it:
export async function updatePanoramaConfig(panorama, settings) {
    console.log(`updatePanoramaConfig: Updating config for ${panorama}, settings=`, settings);
    try {
        // If you don’t have an endpoint for update_config, either remove this or
        // implement it in your Worker. Also ensure your Worker sets
        // 'Access-Control-Allow-Methods': 'POST, OPTIONS' and so forth.
        const response = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/update_config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ panorama, ...settings })
        });
        if (!response.ok) {
            console.error(`updatePanoramaConfig: Server responded with error: ${response.status} - ${response.statusText}`);
            return;
        }
        console.log("updatePanoramaConfig: Config updated successfully.");
    } catch (err) {
        console.error("updatePanoramaConfig: Error:", err);
    }
}
