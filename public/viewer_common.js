import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.154.0/examples/jsm/webxr/VRButton.js';

let camera, scene, renderer, sphere, clock, testCube;


export async function initViewer() {
    console.log("initViewer: Starting initialization...");
    const container = document.getElementById('container');
    console.log("initViewer: container element:", container);
    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010);

     const light = new THREE.AmbientLight(0xffffff, 3);
    scene.add(light);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000); // Adjusted near clipping plane
    camera.position.set(0, 0, 0.01); // Slight Z offset
    camera.lookAt(0, 0, 0);

     scene.add(camera);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType('local');

       try {
          renderer.xr.setReferenceSpaceType('viewer');
      } catch (error) {
           console.log('local viewer is not supported')
      }
      try {
          renderer.xr.setReferenceSpaceType('local-floor');
      } catch (error) {
           console.log('local floor is not supported')
      }

    container.appendChild(renderer.domElement);

     const vrButton = VRButton.createButton(renderer);
     document.body.appendChild(vrButton);
     console.log("initViewer: VRButton created and added to DOM.", vrButton);

    window.addEventListener('resize', onWindowResize);

    console.log("initViewer: Initialization complete.");

    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        if(supported){
             console.log("initViewer: WebXR immersive-vr is supported.");
        } else {
             console.log("initViewer: WebXR immersive-vr is not supported.");
        }
      });
     } else{
          console.log("initViewer: WebXR is not supported by this browser.");
     }

        //Create a test cube
      const testCubeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const testCubeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      testCube = new THREE.Mesh(testCubeGeo, testCubeMat);
      scene.add(testCube);
        console.log("initViewer: Test cube added to scene.", testCube);

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
    if (testCube){
        testCube.rotation.x += 0.01;
        testCube.rotation.y += 0.01;
    }
      try {
        renderer.render(scene, camera);
      } catch (error) {
        console.error("An error occurred during render:", error);
      }
}

export async function loadPanoramas() {
    console.log("loadPanoramas: Fetching panorama list...");
     try {
        const response = await fetch('/api/panorama_list');
        if (!response.ok) {
             console.error(`loadPanoramas: Server responded with error: ${response.status} - ${response.statusText}`);
            return [];
        }
        const data = await response.json();
       console.log("loadPanoramas: Panorama list received:", data);
        return data;
    } catch (error) {
       console.error("loadPanoramas: Error fetching panorama list:", error);
       return [];
    }
}

export async function updatePanoramaConfig(panorama, settings) {
     console.log(`updatePanoramaConfig: Updating config for panorama: ${panorama}, settings:`, settings);
    try {
        const response = await fetch(`/api/update_config`, {
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

export async function loadPanorama(panorama) {
    console.log(`loadPanorama: Loading panorama: ${panorama}`);
    try {
         const configResponse = await fetch(`/panoramas/${panorama}/config.json`);
        if (!configResponse.ok) {
           console.error(`loadPanorama: No config found for ${panorama}, server responded with: ${configResponse.status} - ${configResponse.statusText}`);
           return;
        }
        const config = await configResponse.json();
        console.log(`loadPanorama: Config loaded for ${panorama}:`, config);

        // Update UI elements if present
        const sphereSizeEl = document.getElementById('sphereSizeValue');
        const depthScaleEl = document.getElementById('depthScaleValue');
       const meshResEl = document.getElementById('meshResolutionValue');

         console.log("loadPanorama: UI Elements:", sphereSizeEl, depthScaleEl, meshResEl);

         if (sphereSizeEl) {
          sphereSizeEl.innerText = config.sphereSize;
          console.log("loadPanorama: Updated sphereSize UI element.");
         }
         if (depthScaleEl) {
           depthScaleEl.innerText = config.depthScale;
            console.log("loadPanorama: Updated depthScale UI element.");
         }

         if (meshResEl) {
           meshResEl.innerText = config.meshResolution;
            console.log("loadPanorama: Updated meshRes UI element.");
         }

        if (document.getElementById('sphereSize')) document.getElementById('sphereSize').value = config.sphereSize;
        if (document.getElementById('depthScale')) document.getElementById('depthScale').value = config.depthScale;
       if (document.getElementById('meshResolution')) document.getElementById('meshResolution').value = config.meshResolution;


        // Remove old sphere if exists
        if (sphere) {
          console.log(`loadPanorama: Removing old sphere for ${panorama}`);
           scene.remove(sphere);
           sphere.geometry.dispose();
           sphere.material.dispose();
        }

       const panoSphereGeo = new THREE.SphereGeometry(config.sphereSize, config.meshResolution, config.meshResolution);
        const panoSphereMat = new THREE.MeshStandardMaterial({
           side: THREE.DoubleSide,
            displacementScale: config.depthScale,
            transparent: false,
            opacity: 1
       });

      sphere = new THREE.Mesh(panoSphereGeo, panoSphereMat);
      scene.add(sphere);
      console.log(`loadPanorama: Sphere created and added to scene for ${panorama}.`, sphere);


        const manager = new THREE.LoadingManager();
         const loader = new THREE.TextureLoader(manager);

        loader.load(`/panoramas/${panorama}/image.png`, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
           texture.minFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;
           sphere.material.map = texture;
            console.log(`loadPanorama: Main image loaded for ${panorama}`);
       }, undefined, (err) => {
          console.error(`loadPanorama: Failed to load main image for ${panorama}:`, err);
        });

        loader.load(`/panoramas/${panorama}/depth.png`, (depth) => {
           depth.minFilter = THREE.NearestFilter;
            depth.generateMipmaps = false;
            sphere.material.displacementMap = depth;
             console.log(`loadPanorama: Depth map loaded for ${panorama}`);
      }, undefined, () => {
          console.log(`loadPanorama: No depth map found for ${panorama}, proceeding without displacement.`);
       });


       manager.onLoad = () => {
         console.log(`loadPanorama: Panorama ${panorama} loaded successfully.`);
        };
    } catch (error) {
       console.error(`loadPanorama: Error loading panorama ${panorama}:`, error);
   }
}
