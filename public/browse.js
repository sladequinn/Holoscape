import { initViewer, loadPanoramas, loadPanorama, updatePanoramaConfig } from './viewer_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    await initViewer(); 
    const panoList = await loadPanoramas();

    const selector = document.getElementById('panoramaSelector');
    panoList.forEach((pano) => {
        const option = document.createElement('option');
        option.value = pano;
        option.text = pano;
        selector.add(option);
    });

    selector.addEventListener('change', () => {
        loadPanorama(selector.value);
    });

    if (panoList.length > 0) {
        loadPanorama(panoList[0]);
    }

    document.getElementById('applySettings').addEventListener('click', async () => {
        const sphereSize = parseFloat(document.getElementById('sphereSize').value);
        const depthScale = parseFloat(document.getElementById('depthScale').value);
        const meshResolution = parseInt(document.getElementById('meshResolution').value);

        const currentPanorama = selector.value;
        if (currentPanorama) {
            await updatePanoramaConfig(currentPanorama, { sphereSize, depthScale, meshResolution });
            loadPanorama(currentPanorama);
        }
    });
});
