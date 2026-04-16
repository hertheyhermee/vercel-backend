import { connectToDatabase } from '../lib/db.js';
import Profile from '../models/Profile.js';
import fetchUserData from './_fetchUserData.js';
import { ApiError } from './_apiError.js';
import { validateName } from './_validateInput.js';

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