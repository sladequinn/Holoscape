import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;

export async function initViewer() {
  console.log("initViewer: Starting initialization...");
  const container = document.getElementById('container');
  console.log("initViewer: container element:", container);

  clock = new THREE.Clock();
  scene = new THREE.Scene();

  // Dark background so if we have no texture, we see black instead of white
  scene.background = new THREE.Color(0x101010);

  // Keep some ambient light, but reduce intensity to avoid washout
  const light = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(light);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 2000);
  // Place camera at the center so we are INSIDE the sphere
  camera.position.set(0, 0, 0);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  // Render loop
  renderer.setAnimationLoop(animate);

  try {
    renderer.xr.setReferenceSpaceType('local');
  } catch (e) {
    console.log("Reference space 'local' not supported");
  }
  try {
    renderer.xr.setReferenceSpaceType('viewer');
  } catch (e) {
    console.log("Reference space 'viewer' not supported");
  }
  try {
    renderer.xr.setReferenceSpaceType('local-floor');
  } catch (e) {
    console.log("Reference space 'local-floor' not supported");
  }

  container.appendChild(renderer.domElement);

  // VR button
  const vrButton = VRButton.createButton(renderer);
  document.body.appendChild(vrButton);
  console.log("initViewer: VRButton created and added to DOM.");

  window.addEventListener('resize', onWindowResize);
  console.log("initViewer: Initialization complete.");

  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
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
  renderer.render(scene, camera);
}

/**
 * Load a panorama with a simplified approach:
 * - Use MeshBasicMaterial with NO displacement
 * - Once we confirm the texture is visible,
 *   we can revert to a standard material with negative displacement.
 */
export async function loadPanorama(panoramaId) {
  console.log(`loadPanorama: Loading panorama: ${panoramaId}`);
  try {
    // Adjust this to your Worker domain
    const response = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/panorama/${panoramaId}`);
    if (!response.ok) {
      console.error(`loadPanorama: No config found, status: ${response.status}`);
      return;
    }
    const metadata = await response.json();
    console.log("loadPanorama: got metadata:", metadata);

    // Remove old sphere if it exists
    if (sphere) {
      scene.remove(sphere);
      sphere.geometry.dispose();
      sphere.material.dispose();
      sphere = null;
    }

    // Temporarily use a simpler geometry & material (BackSide so we see from inside)
    const sphereSize = metadata.sphereSize || 6;
    const geometry = new THREE.SphereGeometry(sphereSize, metadata.meshResolution || 256, metadata.meshResolution || 256);

    // Use a basic material so lighting/displacement won't hide the texture
    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide
    });

    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    console.log(`loadPanorama: sphere created for ${panoramaId}`);

    // Load the main texture + depth map
    const loader = new THREE.TextureLoader();

    // Main image
    loader.load(
      metadata.imageURL,
      (tex) => {
        // For debugging, let's skip SRGB if there's any suspicion of color issues
        // You can uncomment if needed:
        // tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        sphere.material.map = tex;
        sphere.material.needsUpdate = true;
        console.log("loadPanorama: main texture loaded");
      },
      undefined,
      (err) => {
        console.error("loadPanorama: error loading main texture:", err);
      }
    );

    // Depth map (we won't actually use it in MeshBasicMaterial, but let's see if it loads)
    loader.load(
      metadata.depthURL,
      (depthTex) => {
        depthTex.minFilter = THREE.NearestFilter;
        depthTex.generateMipmaps = false;
        // Not used by MeshBasicMaterial, but let's log anyway
        console.log("loadPanorama: depth map loaded");
      },
      undefined,
      (err) => {
        console.log("No depth map or error loading depth map:", err);
      }
    );
  } catch (error) {
    console.error(`loadPanorama: error fetching panorama ${panoramaId}:`, error);
  }
}

/**
 * Keep this so browse.js doesn't break. If you don't have an /api/update_config route,
 * it won't do anything, but at least the import won't fail.
 */
export async function updatePanoramaConfig(panoramaId, settings) {
  console.log("updatePanoramaConfig called:", panoramaId, settings);
  // If you have no actual route for /api/update_config in the Worker, this will 404,
  // but at least browse.js won't crash from missing export.
  try {
    const resp = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/update_config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panoramaId, ...settings })
    });
    if (!resp.ok) {
      console.error(`updatePanoramaConfig: server responded with ${resp.status}`);
    } else {
      console.log("updatePanoramaConfig: config updated successfully on server.");
    }
  } catch (err) {
    console.error("updatePanoramaConfig: error:", err);
  }
}

