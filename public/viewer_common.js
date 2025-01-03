import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;

export async function initViewer() {
  console.log("initViewer: Starting initialization...");
  const container = document.getElementById('container');
  console.log("initViewer: container element:", container);

  clock = new THREE.Clock();
  scene = new THREE.Scene();

  // Lower ambient intensity a bit so bright textures don't wash out
  const light = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(light);

  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    2000
  );
  // Place the camera at the center so you're inside the sphere
  camera.position.set(0, 0, 0);
  scene.add(camera);

  // Dark background to avoid white flash
  scene.background = new THREE.Color(0x101010);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  // Animate
  renderer.setAnimationLoop(animate);

  try { renderer.xr.setReferenceSpaceType('local'); } catch (e) {}
  try { renderer.xr.setReferenceSpaceType('viewer'); } catch (e) {}
  try { renderer.xr.setReferenceSpaceType('local-floor'); } catch (e) {}

  container.appendChild(renderer.domElement);

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
 * Loads a 3D panorama with depth using MeshStandardMaterial and displacement.
 */
export async function loadPanorama(panoramaId) {
  console.log(`loadPanorama: Loading panorama: ${panoramaId}`);
  try {
    // Replace with your actual Worker domain if needed
    const response = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/panorama/${panoramaId}`);
    if (!response.ok) {
      console.error(`loadPanorama: No config found, status: ${response.status}`);
      return;
    }
    const metadata = await response.json();
    console.log("loadPanorama: got metadata:", metadata);

    // Remove old sphere if present
    if (sphere) {
      scene.remove(sphere);
      sphere.geometry.dispose();
      sphere.material.dispose();
      sphere = null;
    }

    // Sphere geometry from metadata
    const sphereSize = metadata.sphereSize || 6;
    const geometry = new THREE.SphereGeometry(
      sphereSize,
      metadata.meshResolution || 256,
      metadata.meshResolution || 256
    );

    // CHANGED: Use MeshStandardMaterial with displacement
    const material = new THREE.MeshStandardMaterial({
      side: THREE.BackSide,
      displacementScale: metadata.depthScale ?? -4,
      transparent: false,
      opacity: 1
    });

    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    console.log(`loadPanorama: sphere created for ${panoramaId}`);

    const loader = new THREE.TextureLoader();

    // Main (color) texture
    loader.load(
      metadata.imageURL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
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

    // Depth/displacement map
    loader.load(
      metadata.depthURL,
      (depthTex) => {
        depthTex.minFilter = THREE.NearestFilter;
        depthTex.generateMipmaps = false;
        sphere.material.displacementMap = depthTex;
        sphere.material.needsUpdate = true;
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
 * Retained for browse.js compatibility. If /api/update_config doesn't exist,
 * the call will 404, but at least it won't break the import.
 */
export async function updatePanoramaConfig(panoramaId, settings) {
  console.log("updatePanoramaConfig called:", panoramaId, settings);
  try {
    const resp = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/update_config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ panoramaId, ...settings })
    });
    if (!resp.ok) {
      console.error(`updatePanoramaConfig: server responded with ${resp.status}`);
    } else {
      console.log("updatePanoramaConfig: config updated successfully.");
    }
  } catch (err) {
    console.error("updatePanoramaConfig: error:", err);
  }
}
