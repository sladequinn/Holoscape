import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere;

export async function initViewer() {
  const container = document.getElementById('container');
  scene = new THREE.Scene();

  // Simple ambient light
  const light = new THREE.AmbientLight(0xffffff, 3);
  scene.add(light);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 2000);
  // Place camera at origin so you're inside the sphere
  camera.position.set(0, 0, 0);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
  container.appendChild(renderer.domElement);

  document.body.appendChild(VRButton.createButton(renderer));
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export async function loadPanorama(panoramaId) {
  console.log(`Loading panorama: ${panoramaId}`);
  const resp = await fetch(`https://holoscape-api.sladebquinn.workers.dev/api/panorama/${panoramaId}`);
  if (!resp.ok) {
    console.error(`Failed to fetch config for ${panoramaId}`);
    return;
  }
  const metadata = await resp.json();
  console.log('Metadata:', metadata);

  if (sphere) {
    scene.remove(sphere);
    sphere.geometry.dispose();
    sphere.material.dispose();
    sphere = null;
  }

  // The geometry must be large enough, e.g., 6
  const geo = new THREE.SphereGeometry(metadata.sphereSize || 6, metadata.meshResolution || 256, metadata.meshResolution || 256);
  // side: BackSide so we see from inside; displacementScale from metadata
  const mat = new THREE.MeshStandardMaterial({
    side: THREE.BackSide,
    displacementScale: metadata.depthScale || -4,
  });
  sphere = new THREE.Mesh(geo, mat);
  scene.add(sphere);

  // Load image & depth
  const loader = new THREE.TextureLoader();
  loader.load(metadata.imageURL, (texture) => {
    sphere.material.map = texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    console.log('Main texture loaded');
  });
  loader.load(metadata.depthURL, (depthTex) => {
    sphere.material.displacementMap = depthTex;
    depthTex.minFilter = THREE.NearestFilter;
    depthTex.generateMipmaps = false;
    console.log('Depth map loaded');
  });
}
