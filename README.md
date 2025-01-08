# YouTube Downloader API

A RESTful API for downloading YouTube videos and retrieving video information.

## Endpoints

### 1. Get Video Information
- **URL**: `/api/info`
- **Method**: GET
- **Query Parameters**: 
  - `url`: YouTube video URL
- **Response**: Video details including title, description, duration, thumbnail, and available formats

### 2. Download Video
- **URL**: `/api/download`
- **Method**: GET
- **Query Parameters**:
  - `url`: YouTube video URL
  - `quality`: (optional) Video quality (defaults to highest)
- **Response**: Video file stream

## Example Usage

### Get Video Information
\`\`\`bash
curl "http://localhost:3000/api/info?url=https://www.youtube.com/watch?v=VIDEO_ID"
\`\`\`

### Download Video
\`\`\`bash
curl "http://localhost:3000/api/download?url=https://www.youtube.com/watch?v=VIDEO_ID"
\`\`\`

## Rate Limiting
- 100 requests per IP address per 15 minutes

## Security
- CORS enabled
- Security headers implemented using Helmet
- Rate limiting to prevent abuse