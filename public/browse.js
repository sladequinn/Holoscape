import { initViewer, loadPanoramas, loadPanorama, updatePanoramaConfig } from './viewer_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("browse.js: DOMContentLoaded event fired.");
    try {
        console.log("browse.js: Initializing viewer...");
        await initViewer();
        console.log("browse.js: Loading panorama list...");
        const panoList = await loadPanoramas();
        console.log("browse.js: Panorama list:", panoList);

        const selector = document.getElementById('panoramaSelector');
        console.log("browse.js: Panorama selector element:", selector);
        panoList.forEach((pano) => {
            const option = document.createElement('option');
            option.value = pano;
            option.text = pano;
            selector.add(option);
        });
        console.log("browse.js: Panorama options populated.");

        selector.addEventListener('change', () => {
            console.log(`browse.js: Panorama selection changed to: ${selector.value}`);
            loadPanorama(selector.value);
        });

        // Load initial panorama after options are populated
        if (panoList.length > 0) {
            console.log(`browse.js: Loading initial panorama: ${panoList[0]}`);
             loadPanorama(panoList[0]);
        }
        else {
            console.log("browse.js: No panoramas available to load.");
        }

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
