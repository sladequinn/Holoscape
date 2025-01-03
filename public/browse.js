import { initViewer, loadPanorama, updatePanoramaConfig } from './viewer_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("browse.js: DOMContentLoaded event fired.");
    try {
        console.log("browse.js: Initializing viewer...");
        await initViewer();

        const selector = document.getElementById('panoramaSelector');
        console.log("browse.js: Panorama selector element:", selector);

        // Load initial panorama data
        const initialPanoramaId = 'edc0dfb9-5017-4f53-97ef-73b6da9a26a7'; // or any valid ID
        console.log(`browse.js: Loading initial panorama: ${initialPanoramaId}`);
        await loadPanorama(initialPanoramaId);

        // Create an <option> for the initial panorama
        const option = document.createElement('option');
        option.value = initialPanoramaId;
        option.text = initialPanoramaId; // or you could fetch the name from metadata
        selector.add(option);

        console.log("browse.js: Panorama options populated.");

        selector.addEventListener('change', () => {
            console.log(`browse.js: Panorama selection changed to: ${selector.value}`);
            loadPanorama(selector.value);
        });

        // ─────────────────────────────────────────
        // Slider elements
        // ─────────────────────────────────────────
        const sphereSizeRange = document.getElementById('sphereSize');
        const depthScaleRange = document.getElementById('depthScale');
        const meshResRange = document.getElementById('meshResolution');

        const sphereSizeValueEl = document.getElementById('sphereSizeValue');
        const depthScaleValueEl = document.getElementById('depthScaleValue');
        const meshResValueEl = document.getElementById('meshResolutionValue');

        // Update the text next to the sliders whenever user adjusts them
        sphereSizeRange.addEventListener('input', () => {
            sphereSizeValueEl.textContent = sphereSizeRange.value;
        });
        depthScaleRange.addEventListener('input', () => {
            depthScaleValueEl.textContent = depthScaleRange.value;
        });
        meshResRange.addEventListener('input', () => {
            meshResValueEl.textContent = meshResRange.value;
        });

        // Apply Settings button
        document.getElementById('applySettings').addEventListener('click', async () => {
            console.log("browse.js: Apply settings button clicked.");
            try {
                const sphereSize = parseFloat(sphereSizeRange.value);
                const depthScale = parseFloat(depthScaleRange.value);
                const meshResolution = parseInt(meshResRange.value);

                console.log(
                    `browse.js: New settings: sphereSize=${sphereSize}, depthScale=${depthScale}, meshResolution=${meshResolution}`
                );

                const currentPanorama = selector.value;
                if (currentPanorama) {
                    console.log(`browse.js: Updating config for panorama: ${currentPanorama}`);
                    await updatePanoramaConfig(currentPanorama, {
                        sphereSize,
                        depthScale,
                        meshResolution,
                    });
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
