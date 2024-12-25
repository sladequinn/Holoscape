import { initViewer, loadPanorama, updatePanoramaConfig } from './viewer_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("browse.js: DOMContentLoaded event fired.");
    try {
        console.log("browse.js: Initializing viewer...");
        await initViewer();

        const selector = document.getElementById('panoramaSelector');
        console.log("browse.js: Panorama selector element:", selector);

        // Load initial panorama data
        const initialPanoramaId = 'b68a109c-9868-40b9-937c-f58b01b4f645'; // Replace with your default panorama ID

         console.log(`browse.js: Loading initial panorama: ${initialPanoramaId}`);

         const initialPanorama = await loadPanorama(initialPanoramaId);

        // Create the initial option, with the name of the first panorama.
        const option = document.createElement('option');
        option.value = initialPanoramaId;
       // if the panorama metadata does not have a name property, use the id
         option.text = initialPanorama?.name || initialPanoramaId;
         selector.add(option);


        console.log("browse.js: Panorama options populated.");

        selector.addEventListener('change', () => {
            console.log(`browse.js: Panorama selection changed to: ${selector.value}`);
            loadPanorama(selector.value);
        });


        document.getElementById('applySettings').addEventListener('click', async () => {
            console.log("browse.js: Apply settings button clicked.");
            try {
                const sphereSize = parseFloat(document.getElementById('sphereSize').value);
                const depthScale = parseFloat(document.getElementById('depthScale').value);
                const meshResolution = parseInt(document.getElementById('meshResolution').value);
                 console.log(`browse.js: New settings: sphereSize=${sphereSize}, depthScale=${depthScale}, meshResolution=${meshResolution}`);

                const currentPanorama = selector.value;
                if (currentPanorama) {
                    console.log(`browse.js: Updating config for panorama: ${currentPanorama}`);
                    await updatePanoramaConfig(currentPanorama, { sphereSize, depthScale, meshResolution });
                    console.log(`browse.js: Reloading panorama: ${currentPanorama} after settings update`);
                    loadPanorama(currentPanorama); // Re-load after settings update
              } else {
                    console.log("browse.js: No panorama selected, settings not updated.");
                }
            } catch (error) {
                console.error("browse.js: Error updating or loading panorama config:", error);
            }
        });
    } catch (error) {
        console.error("browse.js: Error initializing viewer or loading panorama list:", error);
    }
   console.log("browse.js: Initial setup completed.");
});


                const currentPanorama = selector.value;
                if (currentPanorama) {
                    console.log(`browse.js: Updating config for panorama: ${currentPanorama}`);
                    await updatePanoramaConfig(currentPanorama, { sphereSize, depthScale, meshResolution });
                    console.log(`browse.js: Reloading panorama: ${currentPanorama} after settings update`);
                    loadPanorama(currentPanorama); // Re-load after settings update
                } else {
                    console.log("browse.js: No panorama selected, settings not updated.");
                }
            } catch (error) {
                console.error("browse.js: Error updating or loading panorama config:", error);
            }
        });
    } catch (error) {
        console.error("browse.js: Error initializing viewer or loading panorama list:", error);
    }
    console.log("browse.js: Initial setup completed.");
});
