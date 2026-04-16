import { getProfile, deleteProfile } from '../profiles.js';

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'Profile ID is required',
      });
    }

    if (req.method === 'GET') {
      const result = await getProfile(id);
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE') {
      await deleteProfile(id);
      return res.status(204).send();
    }

    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal server error';

    if (statusCode >= 500) {
      console.error(error);
    }

    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
}