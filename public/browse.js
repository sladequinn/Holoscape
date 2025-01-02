import { initViewer, loadPanorama, updatePanoramaConfig } from './viewer_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("browse.js: DOMContentLoaded event fired.");
    try {
        console.log("browse.js: Initializing viewer...");
        await initViewer();

        const selector = document.getElementById('panoramaSelector');
        console.log("browse.js: Panorama selector element:", selector);

        // Load initial panorama data
        const initialPanoramaId = 'edc0dfb9-5017-4f53-97ef-73b6da9a26a7'; // Replace if needed
        console.log(`browse.js: Loading initial panorama: ${initialPanoramaId}`);

        // Load the initial panorama
        await loadPanorama(initialPanoramaId);

        // Create an <option> with the initial panorama name or ID
        const option = document.createElement('option');
        option.value = initialPanoramaId;
        // We'll just label it with the ID. 
        // If you'd prefer a name, manually specify or fetch the name from Supabase first.
        option.text = initialPanoramaId;
        selector.add(option);

        console.log("browse.js: Panorama options populated.");

        // Handle dropdown changes
        selector.addEventListener('change', () => {
            console.log(`browse.js: Panorama selection changed to: ${selector.value}`);
            loadPanorama(selector.value);
        });

        // Handle "Apply Settings" button
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
                    loadPanorama(currentPanorama);
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
