# ZuildUp FAR API

Floor Area Ratio (FAR) Calculator API for Delhi NCR residential properties.

## Live API

**Base URL:** `https://far-service-176777907104.asia-south1.run.app`

**Live Demo:** [https://zuildup-far.netlify.app](https://zuildup-far.netlify.app)

**Swagger Docs:** [https://far-service-176777907104.asia-south1.run.app/api/docs](https://far-service-176777907104.asia-south1.run.app/api/docs)

---

## Quick Start

### Example cURL

```bash
curl -X POST https://far-service-176777907104.asia-south1.run.app/api/v1/far/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "city": "delhi",
    "plotArea": 200,
    "plotUnit": "sqm",
    "desiredFloors": 3,
    "wantBasement": false,
    "wantStilt": true,
    "wantTerrace": true,
    "wantBalcony": true,
    "wantLift": false
  }'
```

---

## API Endpoints

### Calculate FAR

`POST /api/v1/far/calculate`

Calculate FAR, setbacks, floor areas, and compliance requirements for a residential plot.

#### Request Body

```json
{
  "city": "delhi",
  "plotArea": 200,
  "plotUnit": "sqm",
  "plotWidth": 10,
  "plotDepth": 20,
  "desiredFloors": 4,
  "wantBasement": true,
  "wantStilt": true,
  "wantTerrace": true,
  "wantBalcony": true,
  "wantLift": false
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | Yes | City code: `delhi`, `noida`, `gurugram`, `ghaziabad`, `faridabad` |
| `plotArea` | number | Yes | Plot area value |
| `plotUnit` | string | Yes | Unit: `sqm`, `sqft`, `sqyd`, `gaj` |
| `plotWidth` | number | No | Plot width in meters |
| `plotDepth` | number | No | Plot depth in meters |
| `desiredFloors` | number | Yes | Number of floors desired |
| `wantBasement` | boolean | Yes | Include basement (single level) |
| `wantStilt` | boolean | Yes | Include stilt parking |
| `wantTerrace` | boolean | Yes | Include terrace |
| `wantBalcony` | boolean | Yes | Include balconies |
| `wantLift` | boolean | Yes | Include lift |

#### Response

```json
{
  "city": {
    "id": "delhi",
    "name": "Delhi",
    "fullName": "New Delhi",
    "authority": "DDA / MCD (MPD-2021)",
    "state": "Delhi"
  },
  "plotAreaSqm": 200,
  "plotAreaSqft": 2152.78,
  "plotAreaSqyd": 239.2,
  "plotAreaGaj": 239.2,
  "applicableFar": 3.5,
  "groundCoverage": 50,
  "farSource": "plot_size",
  "maxBuiltUpArea": 700,
  "maxBuiltUpAreaSqft": 7534.74,
  "maxGroundFloorArea": 100,
  "maxGroundFloorAreaSqft": 1076.39,
  "setbacks": {
    "front": 3,
    "rear": 3,
    "side1": 3,
    "side2": 3
  },
  "maxHeight": 15,
  "maxFloors": 4,
  "maxDwellingUnits": 4,
  "netPlotArea": 136,
  "netPlotAreaSqft": 1463.89,
  "basementInfo": {
    "allowed": true,
    "countedInFar": false,
    "maxArea": 200,
    "maxAreaSqft": 2152.78,
    "maxLevels": 1,
    "minHeight": 2.4,
    "maxHeight": 4.5
  },
  "stiltInfo": {
    "allowed": true,
    "countedInFar": false,
    "mandatory": false,
    "minHeight": 2.4,
    "area": 100,
    "areaSqft": 1076.39
  },
  "floors": [
    {
      "floorName": "Basement",
      "floorType": "basement",
      "area": 200,
      "areaSqft": 2152.78,
      "countedInFar": false,
      "height": 3,
      "notes": "For parking/storage only"
    },
    {
      "floorName": "Stilt",
      "floorType": "stilt",
      "area": 100,
      "areaSqft": 1076.39,
      "countedInFar": false,
      "height": 2.4,
      "notes": "Open parking"
    },
    {
      "floorName": "Ground Floor",
      "floorType": "regular",
      "area": 100,
      "areaSqft": 1076.39,
      "countedInFar": true,
      "height": 3.6
    },
    {
      "floorName": "First Floor",
      "floorType": "regular",
      "area": 100,
      "areaSqft": 1076.39,
      "countedInFar": true,
      "height": 3.6
    }
  ],
  "totalFarArea": 400,
  "totalFarAreaSqft": 4305.56,
  "totalNonFarArea": 300,
  "totalNonFarAreaSqft": 3229.17,
  "grandTotalArea": 700,
  "grandTotalAreaSqft": 7534.74,
  "compliance": {
    "fireNOC": {
      "required": false,
      "reason": "Building height under 15m"
    },
    "rainwaterHarvesting": {
      "required": true,
      "reason": "Plot area > 100 sqm"
    },
    "solarPanel": {
      "required": false,
      "reason": "Plot area under 500 sqm"
    },
    "airportNOC": {
      "required": false,
      "reason": "Height under restriction zone"
    },
    "parkingRequirement": {
      "requiredECS": 2,
      "notes": "1 ECS per 100 sqm of FAR area"
    }
  },
  "notes": [
    "FAR calculated based on plot size category",
    "Basement can be used for parking and storage only",
    "Stilt floor must remain open for parking"
  ]
}
```

### Get All Cities

`GET /api/v1/far/cities`

Returns list of supported cities.

### Get City Bylaws

`GET /api/v1/far/cities/{cityId}`

Returns detailed bylaws for a specific city.

---

## Supported Cities

| City | Authority | FAR Basis |
|------|-----------|-----------|
| Delhi | DDA / MCD (MPD-2021) | Plot Size |
| Noida | Noida Authority / GNIDA | Plot Size |
| Gurugram | HSVP / DTCP Haryana | Plot Size |
| Ghaziabad | GDA Building Bylaws | Plot Size |
| Faridabad | HSVP / MCF Bylaws | Plot Size |

> **Note:** Gurugram bylaws updated as per Haryana Building Bye-Laws 2021.

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your database credentials

# Seed the database
npm run db:seed

# Start development server
npm run start:dev
```

### Environment Variables

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=far_service
PORT=3001
```

### Quick Test (No Database)

```bash
# Run standalone test server with in-memory data
node test-server.js

# Open Swagger docs at: http://localhost:3001/api/docs
```

---

## Tech Stack

- **Framework:** NestJS 10
- **Database:** PostgreSQL with TypeORM
- **Documentation:** Swagger/OpenAPI
- **Deployment:** Google Cloud Run

---

## Docker

```bash
# Build image
docker build -t zuildup-far-api .

# Run container
docker run -p 3001:3001 --env-file .env zuildup-far-api
```

## GCP Deployment

```bash
# Deploy to Cloud Run
gcloud run deploy far-service \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

---

## License

Private - ZuildUp

---

Built with ZuildUp | Don't just build - Zuild
