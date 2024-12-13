<!DOCTYPE html>
<html lang="en">
<head>
    <title>Holoscape.ai - Browse</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="container"></div>
    <div id="info">
        <h1>Holoscape.ai</h1>
        <p>Browse Panoramas</p>
    </div>

    <div id="controls">
        <label for="panoramaSelector">Select Panorama:</label>
        <select id="panoramaSelector"></select>

        <label for="sphereSize">Sphere Size: <span id="sphereSizeValue">6</span></label>
        <input type="range" id="sphereSize" min="3" max="30" step="0.1" value="6">

        <label for="depthScale">Depth Scale: <span id="depthScaleValue">4.0</span></label>
        <input type="range" id="depthScale" min="0" max="10" step="0.1" value="4.0">

        <label for="meshResolution">Mesh Resolution: <span id="meshResolutionValue">256</span></label>
        <input type="range" id="meshResolution" min="256" max="8192" step="256" value="256">

        <button id="applySettings">Apply Settings</button>
    </div>

    <script type="module" src="viewer_common.js"></script>
    <script type="module" src="browse.js"></script>
</body>
</html>
