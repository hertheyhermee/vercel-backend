export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      message: "HNG Backend Stage 1 API",
      status: "running",
      endpoints: {
        create_profile: "POST /api/profiles",
        get_profiles: "GET /api/profiles",
        get_profile: "GET /api/profiles/{id}",
        delete_profile: "DELETE /api/profiles/{id}"
      }
    });
  }

  return res.status(405).json({
    status: 'error',
    message: 'Method not allowed',
  });
}