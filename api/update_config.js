export default function handler(req, res) {
  // Expect { panorama, sphereSize, depthScale, meshResolution }
  // In a real scenario, you'd store these in Firestore or another DB.
  // For now, just return success without actually updating files.
  res.status(200).json({ status: "Config updated" });
}
