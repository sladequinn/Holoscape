export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { prompt } = req.body;
  if (!prompt) return res.status(400).send('No prompt provided');

  const endpoint = process.env.COMFYUI_ENDPOINT;
  if (!endpoint) return res.status(500).send('COMFYUI_ENDPOINT not configured');

  // Example workflow: you must adapt this to your actual workflow.
  const workflow = {
    nodes: [
      {
        class_type: "CLIPTextEncode",
        inputs: { text: prompt }
      },
      // ... other nodes including PanoramaEater
    ]
  };

  try {
    const comfyRes = await fetch(`${endpoint}/v1/run_workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    const result = await comfyRes.json();
    res.status(200).json({ status: 'ok', result });
  } catch (error) {
    console.error('Error calling ComfyUI:', error);
    res.status(500).send('Error calling ComfyUI');
  }
}
