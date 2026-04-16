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
      message: "HNG Backend Stage 1 - Profile API",
      status: "success",
      endpoints: {
        profiles: "/api/profiles",
        profile_by_id: "/api/profiles/{id}"
      }
    });
  }

  return res.status(405).json({
    status: 'error',
    message: 'Method not allowed',
  });
}