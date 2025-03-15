# Contest Tracker
## Overview
The Contest Tracker API is a Node.js-based backend service that tracks coding contests from platforms like LeetCode, Codeforces, and CodeChef. It fetches contest details, stores them in a MongoDB database, and associates YouTube solution links using the Google YouTube API.

## Features
- Fetches upcoming and ongoing contests from LeetCode, Codeforces, and CodeChef.
- Stores contest details in a MongoDB database.
- Provides a REST API for retrieving contest details.
- Allows adding and retrieving YouTube solution links for contests.
- Runs cron jobs to update contest data and solutions at scheduled intervals.
- Supports CORS for secure API access.

## Technologies Used
- Node.js & Express.js – Backend framework.
- MongoDB & Mongoose – Database and ORM.
- Axios – HTTP requests for fetching contest data.
- Google APIs (YouTube) – Fetching YouTube solution links.
- dotenv – Managing environment variables.
- cron – Scheduling periodic updates.

## find the video demo [here]()
# find the live demo [here]()


### frontend 
![flowchart](https://img.plantuml.biz/plantuml/dsvg/ZLJBRjim4BmBq3yiShA1D1_W79h0W0i3GLhOzS57YbpPX2ckmeS3vEkxrCEIgpZ8IKjoE3Fxe9vy42x4okHP4-NPOcrrqCBe3mJU2WXduRGe37gOIR81VV3tK6eJq75G49qguKuSAlv0HGhl0ODyc3yos_A8yWI6f31CHquS44fo0nQ4LGD9khBYoqVef1WO19IEAYY4FA5L3CapNSBi-SyQ7Bx5XF9HIlI-ZERd7C8HBSpswETv1h3OiYnUyJqs-wicXVx0Cxz71MGXUjwk7PReq38jmz5uXDahTOn7UWTqZlEeM9LpIX2hT9cyBJOSCiDkpTnLJHPjI1p9yovH1peSKZb5LyMfvLsjKkNRuxODhUSD_YYlRO-L9mfzNMygN0e_5jcAy_Waq7N_lbIyzFMcvD3v_oM7aeEstz2KHalsT_Ui56p9nA39tarrVzUyzDrvKXQc4Rtm-5XKcWVWWjbjNYOqlSanA9LccCe6qoKvcRREFIEMXdYMUXktirff-sLQMnIEtycUujzOj8-gL-qzVZuSlS0lIlwNxPrF13Qej4CP4gfdvgJ7dDoTEi-UUDtyGlBi7m00)


### backend
![flowchart](https://img.plantuml.biz/plantuml/dsvg/hLJDSjem4BxxANOuaHFJApuqRQ2TT6XWW1no5DOQRojhDTAAqZvz9R1nIkWjDv1slvzlrxeFehp4rXId7yLqmKe3sWDvjYrQWOFof7O6GrbC7oq9AKD_4EP7vp44KCwbYmUs5Yi1OVZETi-ppsL1DOoxSs8B8LPLQgYZ-NW7qg25yGk6km8WSUvXD5EYTYeWLESUrAzQpEzHMQ19j-CdljtJyzIA3EfKdehcHn9mdZDAwhUQwgAOph0cYv2q2GQ1K3NOAb1MGyiQJJcKV5ezmffZAZlR-JhVmaGvcXm-JAfpUpYRoMnVKAe6-dEeFRUWEuKdEMkKwErGeG9ysooVEcUPOBNSl6MO13OnUnkedbq2nXu9-W9uNYzUCyLJcUxhUg8h9uxiVe3kMaSkpN4qX7Oszy9n6tSu41goFxjm-hiKMZ-vDvEU7yMhIk106XaqYY8JJeetmXwXPjygoPA5n638Kyccmetfe_Vi1u7_YQGJj-a5johxg3bQVQtk6k8NIVDFj5SYyWAHZGW1bQ-QbEAWvjOkEACa6mpzjw4n_KqvtOZi4ic0GNROffEGcq7qo0yDrk-Dkq2KZFsUkEdjCAXiTC16NvhBTBwf6jJH8FpWNSYR0GuziQQgs-jKbJYLbyjZ5D0Vq0DRM2tNsx88mgwuJqInDNy1)


## Installation backend

1. **Clone the repository**
2. **npm install**
3. **Set up environment variables**
- Create a `.env` file in the root directory and add:
  ```
  PORT=5000
  MONGODB_URI=mongodb+srv://your-mongodb-url
  YOUTUBE_API_KEY=your-youtube-api-key
  LEETCODE_PLAYLIST_ID=your-leetcode-playlist-id
  CODEFORCES_PLAYLIST_ID=your-codeforces-playlist-id
  CODECHEF_PLAYLIST_ID=your-codechef-playlist-id
  ```
4. **node server.js**:

## Installation frontend

1. **Clone the repository**
2. **npm install**
3. **npm run dev**