import { connectToDatabase } from '../lib/db.js';
import Profile from '../models/Profile.js';
import { v7 as uuidv7 } from 'uuid';

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const validateName = (name) => {
  if (name === undefined || name === null || name === '') {
    throw new ApiError(400, 'Name is required');
  }

  if (typeof name !== 'string') {
    throw new ApiError(422, 'Name must be a string');
  }

  const trimmedName = name.trim();
  if (trimmedName === '') {
    throw new ApiError(400, 'Name is required');
  }

  return trimmedName.toLowerCase();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, apiName, maxRetries = 5, initialDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${apiName}] Attempt ${attempt}/${maxRetries}...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[${apiName}] Success on attempt ${attempt}`);
      return { data, status: response.status };
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      console.error(`[${apiName}] Attempt ${attempt} failed: ${error.message}`);

      if (isLastAttempt) {
        console.error(`[${apiName}] All ${maxRetries} retries failed`);
        throw new ApiError(502, `${apiName} returned an invalid response`);
      }

      const exponentialDelay = initialDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 1000;
      const waitTime = exponentialDelay + jitter;

      console.log(`[${apiName}] Waiting ${Math.round(waitTime)}ms before retry...`);
      await sleep(waitTime);
    }
  }
};

const fetchUserData = async (name) => {
  try {
    console.log(`\n=== Fetching data for name: ${name} ===`);

    const genderRes = await fetchWithRetry(
      `https://api.genderize.io?name=${name}`,
      'Genderize',
      5,
      2000
    );

    await sleep(1000);

    const ageRes = await fetchWithRetry(
      `https://api.agify.io?name=${name}`,
      'Agify',
      5,
      2000
    );

    await sleep(1000);

    const nationRes = await fetchWithRetry(
      `https://api.nationalize.io?name=${name}`,
      'Nationalize',
      5,
      2000
    );

    return { genderRes, ageRes, nationRes };
  } catch (error) {
    if (error.isOperational) {
      throw error;
    }
    throw new ApiError(502, 'External API error');
  }
};

const getAgeGroup = (age) => {
  if (age <= 12) return 'child';
  if (age <= 19) return 'teenager';
  if (age <= 59) return 'adult';
  return 'senior';
};

const getTopCountry = (countryList) => {
  if (!Array.isArray(countryList) || countryList.length === 0) {
    throw new ApiError(502, 'Nationalize returned an invalid response');
  }

  return countryList.reduce((prev, curr) =>
    curr.probability > prev.probability ? curr : prev
  );
};

// Controller functions
export const createProfile = async (name) => {
  await connectToDatabase();
  const normalizedName = validateName(name);

  const existingProfile = await Profile.findOne({ name: normalizedName });
  if (existingProfile) {
    return {
      status: 'success',
      message: 'Profile already exists',
      data: existingProfile,
    };
  }

  const { genderRes, ageRes, nationRes } = await fetchUserData(normalizedName);

  if (!genderRes?.data?.gender || genderRes.data.count === 0) {
    throw new ApiError(502, 'Genderize returned an invalid response');
  }

  const age = ageRes?.data?.age;
  if (age === null || age === undefined) {
    throw new ApiError(502, 'Agify returned an invalid response');
  }

  const topCountry = getTopCountry(nationRes?.data?.country);
  if (!topCountry?.country_id || topCountry.probability === undefined) {
    throw new ApiError(502, 'Nationalize returned an invalid response');
  }

  const profile = await Profile.create({
    id: uuidv7(),
    name: normalizedName,
    gender: genderRes.data.gender,
    gender_probability: genderRes.data.probability,
    sample_size: genderRes.data.count,
    age,
    age_group: getAgeGroup(age),
    country_id: topCountry.country_id,
    country_probability: topCountry.probability,
    created_at: new Date().toISOString(),
  });

  return {
    status: 'success',
    data: profile,
  };
};

export const getProfile = async (id) => {
  await connectToDatabase();
  const profile = await Profile.findOne({ id });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  return {
    status: 'success',
    data: profile,
  };
};

export const getProfiles = async (query) => {
  await connectToDatabase();
  const filters = {};

  if (query.gender) {
    filters.gender = query.gender.toLowerCase();
  }

  if (query.age_group) {
    filters.age_group = query.age_group.toLowerCase();
  }

  if (query.country_id) {
    filters.country_id = query.country_id.toUpperCase();
  }

  const profiles = await Profile.find(filters)
    .select('id name gender age age_group country_id -_id')
    .lean();

  return {
    status: 'success',
    count: profiles.length,
    data: profiles,
  };
};

export const deleteProfile = async (id) => {
  await connectToDatabase();
  const profile = await Profile.findOneAndDelete({ id });

  if (!profile) {
    throw new ApiError(404, 'Profile not found');
  }

  return { status: 204 };
};

export default async function handler(req, res) {
  try {
    const { id } = req.query;

    if (id) {
      // Handle /api/profiles/[id]
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
    } else {
      // Handle /api/profiles
      if (req.method === 'POST') {
        const { name } = req.body;
        const result = await createProfile(name);
        return res.status(201).json(result);
      }

      if (req.method === 'GET') {
        const result = await getProfiles(req.query);
        return res.status(200).json(result);
      }

      return res.status(405).json({
        status: 'error',
        message: 'Method not allowed',
      });
    }
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