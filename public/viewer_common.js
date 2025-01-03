import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock;

/** Initialize the VR viewer */
export async function initViewer() {
  console.log("initViewer: Starting initialization...");
  const container = document.getElementById('container');
  console.log("initViewer: container element:", container);

  clock = new THREE.Clock();
  scene = new THREE.Scene();

  // Dark background so we don’t see white if the texture or sphere hasn't loaded
  scene.background = new THREE.Color(0x101010);

  // Bright ambient light (from your original code)
  const light = new THREE.AmbientLight(0xffffff, 3);
  scene.add(light);

  // Camera: inside the sphere
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 0, 0);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.setAnimationLoop(animate);
  container.appendChild(renderer.domElement);

  // Attempt various reference spaces
  try { renderer.xr.setReferenceSpaceType('local'); } catch(e){}
  try { renderer.xr.setReferenceSpaceType('viewer'); } catch(e){}
  try { renderer.xr.setReferenceSpaceType('local-floor'); } catch(e){}

  const vrButton = VRButton.createButton(renderer);
  document.body.appendChild(vrButton);
  console.log("initViewer: VRButton created and added.", vrButton);

  window.addEventListener('resize', onWindowResize);
  console.log("initViewer: Initialization complete.");

  if (navigator.xr) {
    navigator.xr.isSessionSupported('immersive-vr').then(supported => {
      console.log("initViewer: WebXR immersive-vr is", supported ? "supported." : "not supported.");
    });
  } else {
    console.log("initViewer: WebXR is not supported by this browser.");
  }
}

/** Handle window resizing */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/** Render loop */
function animate() {
  if (sphere && !renderer.xr.isPresenting) {
    const t = clock.getElapsedTime();
    sphere.rotation.y += 0.001;
    sphere.position.x = Math.sin(t) * 0.2;
    sphere.position.z = Math.cos(t) * 0.2;
  }
  renderer.render(scene, camera);
}

/** Load panorama from Worker API, attach texture+depth to sphere */
export async function loadPanorama(panoramaId) {
  console.log(`loadPanorama: Loading panorama ${panoramaId}`);
  try {
    const resp = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/panorama/${panoramaId}`);
    if (!resp.ok) {
      console.error(`loadPanorama: no config found, status: ${resp.status}`);
      return;
    }
    const meta = await resp.json();
    console.log("loadPanorama: got metadata:", meta);

    // Cleanup old sphere if present
    if (sphere) {
      scene.remove(sphere);
      sphere.geometry.dispose();
      sphere.material.dispose();
    }

    const geo = new THREE.SphereGeometry(
      meta.sphereSize || 6,
      meta.meshResolution || 256,
      meta.meshResolution || 256
    );
    const mat = new THREE.MeshStandardMaterial({
      side: THREE.BackSide,
      displacementScale: meta.depthScale ?? -4,
      transparent: false,
      opacity: 1
    });

    sphere = new THREE.Mesh(geo, mat);
    scene.add(sphere);
    console.log(`loadPanorama: sphere created for ${panoramaId}`);

    // Load main + depth
    const loader = new THREE.TextureLoader();
    loader.load(meta.imageURL, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      sphere.material.map = tex;
      console.log("loadPanorama: main texture loaded");
    });
    loader.load(meta.depthURL, dTex => {
      dTex.minFilter = THREE.NearestFilter;
      dTex.generateMipmaps = false;
      sphere.material.displacementMap = dTex;
      console.log("loadPanorama: depth map loaded");
    });
  } catch (err) {
    console.error(`loadPanorama: error fetching panorama ${panoramaId}`, err);
  }
}

/** For browse.js calls, so we don't get an import error */
export async function updatePanoramaConfig(panoramaId, settings) {
  console.log("updatePanoramaConfig called:", panoramaId, settings);
  // If you have no /api/update_config route, this won't do anything real
  // but it will avoid import errors in browse.js.
}
