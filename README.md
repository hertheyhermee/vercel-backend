# HNG Backend Stage 1 - Vercel Deployment

A serverless API for managing user profiles with external API integrations, deployed on Vercel.

## Features

- Serverless functions for all endpoints
- MongoDB connection with caching
- External API integration with retry logic
- CORS enabled for all origins

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Install Vercel CLI: `npm i -g vercel`
4. Login to Vercel: `vercel login`
5. Set environment variables: `vercel env add MONGO_CONN_STRING`
6. Deploy: `vercel --prod`

## API Endpoints

- `POST /api/profiles` - Create a new profile
- `GET /api/profiles` - Get all profiles (with optional filters)
- `GET /api/profiles/[id]` - Get a single profile by ID
- `DELETE /api/profiles/[id]` - Delete a profile by ID

## Environment Variables

- `MONGO_CONN_STRING` - MongoDB connection URL (required)

## Request Examples

### Create Profile
```bash
curl -X POST https://https://vercel-backend-taupe-nine.vercel.app/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"name": "ella"}'
```

### Get All Profiles
```bash
curl https://https://vercel-backend-taupe-nine.vercel.app/api/profiles
```

### Get Single Profile
```bash
curl https://https://vercel-backend-taupe-nine.vercel.app/api/profiles/019d92d7-2528-7066-967a-7936619e36fb
```

## Deployment

This is configured for Vercel serverless functions. The `vercel.json` handles routing and function configuration automatically.