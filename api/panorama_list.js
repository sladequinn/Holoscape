export default function handler(req, res) {
  // Hard-code for now (in the future, store in database or fetch dynamically)
  // Must match directories in public/panoramas:
  res.status(200).json(["example_pano_1", "example_pano_2"]);
}
