const express = require('express');
require("dotenv").config();
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const { google } = require('googleapis');
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
    try {
      await mongoose.connect(`${process.env.MONGODB_URI}/contest-tracker`);
      console.log("✅ Database connected successfully");
    } catch (error) {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1); // Exit the process if DB connection fails
    }
};
  
connectDB();

// Contest Schema
const contestSchema = new mongoose.Schema({
  name: String,
  platform: String,
  url: String,
  startTime: Date,
  endTime: Date,
  duration: Number,
  solutionUrl: String
});

const Contest = mongoose.model('Contest', contestSchema);

// API Routes
app.get('/api/contests', async (req, res) => {
  try {
    const contests = await Contest.find();
    res.json(contests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contests/solution', async (req, res) => {
  const { contestId, solutionUrl } = req.body;
  
  try {
    const contest = await Contest.findByIdAndUpdate(
      contestId,
      { solutionUrl },
      { new: true }
    );
    res.json(contest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ------------------------------------------------------------------------------------------------------------------------

// YouTube solution links fetching
const fetchYouTubeSolutionLinks = async () => {
  try {
    // Initialize the YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    
    // YouTube playlists for each platform
    const playlists = {
      'LeetCode': process.env.LEETCODE_PLAYLIST_ID,
      'Codeforces': process.env.CODEFORCES_PLAYLIST_ID,
      'CodeChef': process.env.CODECHEF_PLAYLIST_ID
    };
    
    const solutions = {};
    
    for (const [platform, playlistId] of Object.entries(playlists)) {
      if (!playlistId) {
        console.log(`No playlist ID configured for ${platform}`);
        continue;
      }
      
      // Fetch videos from the playlist
      const response = await youtube.playlistItems.list({
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50
      });
      
      // Process each video
      for (const item of response.data.items) {
        const title = item.snippet.title;
        const videoId = item.snippet.resourceId.videoId;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Store the original title
        solutions[`${platform}-${title}`] = videoUrl;
        
        // Also store a clean version of the title (removing decorations)
        const cleanTitle = title
          .replace(/\*\*/g, '')  // Remove ** markdown formatting
          .replace(/\|.*$/, '')   // Remove everything after | character
          .trim();
        solutions[`${platform}-${cleanTitle}`] = videoUrl;
        
        // Platform-specific processing
        if (platform === 'LeetCode') {
          // Extract Weekly Contest numbers - handle more variations
          const weeklyMatch = title.match(/Weekly\s+Contest\s+(\d+)/i);
          if (weeklyMatch) {
            solutions[`${platform}-Weekly Contest ${weeklyMatch[1]}`] = videoUrl;
            // Add additional keys for common YouTube title formats
            solutions[`${platform}-Leetcode Weekly Contest ${weeklyMatch[1]}`] = videoUrl;
          }
          
          // Extract Biweekly Contest numbers - handle more variations
          const biweeklyMatch = title.match(/Biweekly\s+Contest\s+(\d+)/i);
          if (biweeklyMatch) {
            solutions[`${platform}-Biweekly Contest ${biweeklyMatch[1]}`] = videoUrl;
            solutions[`${platform}-Leetcode Biweekly Contest ${biweeklyMatch[1]}`] = videoUrl;
          }
        } 
        else if (platform === 'Codeforces') {
          // Extract Round numbers
          const roundMatch = title.match(/Round\s+#?(\d+)/i);
          if (roundMatch) {
            solutions[`${platform}-Codeforces Round #${roundMatch[1]}`] = videoUrl;
            solutions[`${platform}-Codeforces Round ${roundMatch[1]}`] = videoUrl;
            
            // Handle divisions - account for both formats with and without period
            const divMatch = title.match(/Div\.?\s*(\d+)/i);
            if (divMatch) {
              solutions[`${platform}-Codeforces Round #${roundMatch[1]} (Div. ${divMatch[1]})`] = videoUrl;
              solutions[`${platform}-Codeforces Round #${roundMatch[1]} (Div ${divMatch[1]})`] = videoUrl;
              // Add without parentheses
              solutions[`${platform}-Codeforces Round #${roundMatch[1]} Div. ${divMatch[1]}`] = videoUrl;
              solutions[`${platform}-Codeforces Round #${roundMatch[1]} Div ${divMatch[1]}`] = videoUrl;
            }
          }
          
          // Handle Educational Rounds
          const eduMatch = title.match(/Educational\s+(?:Codeforces\s+)?Round\s+#?(\d+)/i);
          if (eduMatch) {
            solutions[`${platform}-Educational Codeforces Round ${eduMatch[1]}`] = videoUrl;
            solutions[`${platform}-Educational Round ${eduMatch[1]}`] = videoUrl;
          }
        }
        else if (platform === 'CodeChef') {
          // Extract Starters contest numbers
          const starterMatch = title.match(/Starters\s+(\d+)/i);
          if (starterMatch) {
            solutions[`${platform}-Starters ${starterMatch[1]}`] = videoUrl;
            solutions[`${platform}-Codechef Starters ${starterMatch[1]}`] = videoUrl;
          }
          
          // Look for Long Challenge
          if (title.match(/Long Challenge/i)) {
            const monthMatch = title.match(/(\w+)\s+Long Challenge/i);
            if (monthMatch) {
              solutions[`${platform}-${monthMatch[1]} Long Challenge`] = videoUrl;
              solutions[`${platform}-Codechef ${monthMatch[1]} Long Challenge`] = videoUrl;
            }
          }
          
          // Look for Cook-off
          if (title.match(/Cook[- ]off/i)) {
            const monthMatch = title.match(/(\w+)\s+Cook[- ]off/i);
            if (monthMatch) {
              solutions[`${platform}-${monthMatch[1]} Cook-off`] = videoUrl;
              solutions[`${platform}-${monthMatch[1]} Cookoff`] = videoUrl;
              solutions[`${platform}-Codechef ${monthMatch[1]} Cook-off`] = videoUrl;
            }
          }
        }
        
        // Create normalized keys for fuzzy matching
        const normalizedTitle = title
          .toLowerCase()
          .replace(/[^\w\s\d]/g, '')  // Remove special characters
          .replace(/\s+/g, ' ')        // Normalize whitespace
          .trim();
        
        solutions[`${platform}-normalized-${normalizedTitle}`] = videoUrl;
        
        // Extract numbers from titles for number-based matching
        const numbers = title.match(/\d+/g);
        if (numbers) {
          for (const number of numbers) {
            solutions[`${platform}-number-${number}`] = videoUrl;
          }
        }
      }
    }
    
    return solutions;
  } catch (error) {
    console.error('Error fetching YouTube solutions:', error);
    return {};
  }
};




// Update contest solutions by matching with YouTube videos
const updateContestSolutions = async (solutions) => {
  try {
    const contests = await Contest.find();
    let updatedCount = 0;
    
    for (const contest of contests) {
      // Skip if solution already exists
      if (contest.solutionUrl) continue;
      
      const contestName = contest.name;
      const platform = contest.platform;
      
      // Function to normalize strings for comparison
      const normalize = (str) => str.toLowerCase()
        .replace(/[^\w\s\d]/g, '')  // Remove special characters
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .trim();

      // Try direct match first
      const directKey = `${platform}-${contestName}`;
      if (solutions[directKey]) {
        contest.solutionUrl = solutions[directKey];
        await contest.save();
        updatedCount++;
        continue;
      }
      
      // Extract key information from contest name
      let contestNumber = null;
      let division = null;
      
      // For LeetCode contests
      if (platform === 'LeetCode') {
        const weeklyMatch = contestName.match(/Weekly\s+Contest\s+(\d+)/i);
        const biweeklyMatch = contestName.match(/Biweekly\s+Contest\s+(\d+)/i);
        
        if (weeklyMatch) {
          contestNumber = weeklyMatch[1];
          
          // Check for any key containing Weekly Contest number
          for (const [key, url] of Object.entries(solutions)) {
            if (key.startsWith(platform) && 
                normalize(key).includes(normalize(`weekly contest ${contestNumber}`))) {
              contest.solutionUrl = url;
              await contest.save();
              updatedCount++;
              break;
            }
          }
        } else if (biweeklyMatch) {
          contestNumber = biweeklyMatch[1];
          
          // Check for any key containing Biweekly Contest number
          for (const [key, url] of Object.entries(solutions)) {
            if (key.startsWith(platform) && 
                normalize(key).includes(normalize(`biweekly contest ${contestNumber}`))) {
              contest.solutionUrl = url;
              await contest.save();
              updatedCount++;
              break;
            }
          }
        }
      }
      
      // For Codeforces contests
      else if (platform === 'Codeforces') {
        const roundMatch = contestName.match(/Round\s+#?(\d+)/i);
        const divMatch = contestName.match(/Div\.?\s*(\d+)/i);
        
        if (roundMatch) {
          contestNumber = roundMatch[1];
          division = divMatch ? divMatch[1] : null;
          
          // Try various formats
          for (const [key, url] of Object.entries(solutions)) {
            if (!key.startsWith(platform)) continue;
            
            const normalizedKey = normalize(key);
            const hasRoundNumber = normalizedKey.includes(`round ${contestNumber}`) || 
                                 normalizedKey.includes(`round#${contestNumber}`);
            
            // If division is specified, it should match in the key
            const hasDivMatch = !division || 
                             normalizedKey.includes(`div ${division}`) || 
                             normalizedKey.includes(`div${division}`);
            
            if (hasRoundNumber && hasDivMatch) {
              contest.solutionUrl = url;
              await contest.save();
              updatedCount++;
              break;
            }
          }
        }
        
        // Handle Educational Rounds
        const eduMatch = contestName.match(/Educational\s+(?:Codeforces\s+)?Round\s+#?(\d+)/i);
        if (eduMatch) {
          contestNumber = eduMatch[1];
          
          for (const [key, url] of Object.entries(solutions)) {
            if (key.startsWith(platform) && 
                normalize(key).includes(normalize(`educational round ${contestNumber}`))) {
              contest.solutionUrl = url;
              await contest.save();
              updatedCount++;
              break;
            }
          }
        }
      }
      
      // For CodeChef contests
      else if (platform === 'CodeChef') {
        // Handle Starters
        const starterMatch = contestName.match(/Starters\s+(\d+)/i);
        if (starterMatch) {
          contestNumber = starterMatch[1];
          
          for (const [key, url] of Object.entries(solutions)) {
            if (key.startsWith(platform) && 
                normalize(key).includes(normalize(`starters ${contestNumber}`))) {
              contest.solutionUrl = url;
              await contest.save();
              updatedCount++;
              break;
            }
          }
        }
        
        // Handle Long Challenge and Cook-off with fuzzy matching
        const longMatch = contestName.match(/(\w+)\s+Long\s+Challenge/i);
        const cookoffMatch = contestName.match(/(\w+)\s+Cook[- ]off/i);
        
        if (longMatch || cookoffMatch) {
          const month = longMatch ? longMatch[1] : cookoffMatch[1];
          const contestType = longMatch ? "long challenge" : "cookoff";
          
          for (const [key, url] of Object.entries(solutions)) {
            if (key.startsWith(platform) && 
                normalize(key).includes(normalize(month)) && 
                normalize(key).includes(normalize(contestType))) {
              contest.solutionUrl = url;
              await contest.save();
              updatedCount++;
              break;
            }
          }
        }
      }

      // If no specialized match was found, try fuzzy matching as a last resort
      if (!contest.solutionUrl) {
        const normalizedContestName = normalize(contestName);
        
        for (const [key, url] of Object.entries(solutions)) {
          if (!key.startsWith(platform)) continue;
          
          const normalizedKey = normalize(key.replace(`${platform}-`, ''));
          
          // Check if either contains the other
          if (normalizedKey.includes(normalizedContestName) || 
              normalizedContestName.includes(normalizedKey)) {
            contest.solutionUrl = url;
            await contest.save();
            updatedCount++;
            break;
          }
          
          // For title format in your examples: "**Leetcode Weekly Contest 439**"
          if (platform === 'LeetCode' && normalizedKey.includes('weekly') && 
              contestName.includes('Weekly')) {
            const numFromKey = normalizedKey.match(/\d+/);
            const numFromContest = normalizedContestName.match(/\d+/);
            
            if (numFromKey && numFromContest && numFromKey[0] === numFromContest[0]) {
              contest.solutionUrl = url;
              await contest.save();
              updatedCount++;
              break;
            }
          }
        }
      }
    }
    
    console.log(`Updated solution links for ${updatedCount} contests`);
  } catch (error) {
    console.error('Error updating contest solutions:', error);
  }
};








// ----------------------------------------------------------------------------------------------------------------------------




// Fetch contests from Codeforces
const fetchCodeforcesContests = async () => {
  try {
    const response = await axios.get('https://codeforces.com/api/contest.list');
    const contests = response.data.result.map(contest => ({
      name: contest.name,
      platform: 'Codeforces',
      url: `https://codeforces.com/contest/${contest.id}`,
      startTime: new Date(contest.startTimeSeconds * 1000),
      duration: contest.durationSeconds,
      endTime: new Date((contest.startTimeSeconds + contest.durationSeconds) * 1000)
    }));
    
    return contests;
  } catch (error) {
    console.error('Error fetching Codeforces contests:', error);
    return [];
  }
};

// Fetch contests from CodeChef
const fetchCodeChefContests = async () => {
  try {
    const response = await axios.get('https://www.codechef.com/api/list/contests/all');
    
    // Verify the response structure
    if (!response.data || (!response.data.future_contests && !response.data.present_contests && !response.data.past_contests)) {
      console.error('Invalid response structure from CodeChef API:', response.data);
      return [];
    }
    
    // Combine all contest types
    const allContests = [
      ...(response.data.future_contests || []),
      ...(response.data.present_contests || []),
      ...(response.data.past_contests || [])
    ];
    
    // Map to our schema
    const contests = allContests.map(contest => {
      if (!contest.contest_name || !contest.contest_code || !contest.contest_start_date || !contest.contest_end_date) {
        return null;
      }
      
      return {
        name: contest.contest_name,
        platform: 'CodeChef',
        url: `https://www.codechef.com/${contest.contest_code}`,
        startTime: new Date(contest.contest_start_date),
        endTime: new Date(contest.contest_end_date),
        duration: (new Date(contest.contest_end_date) - new Date(contest.contest_start_date)) / 1000
      };
    }).filter(contest => contest !== null);
    
    return contests;
  } catch (error) {
    console.error('Error fetching CodeChef contests:', error.message);
    return [];
  }
};

// Fetch contests from LeetCode
const fetchLeetCodeContests = async () => {
  try {
    const response = await axios.post('https://leetcode.com/graphql', {
      query: `
        {
          allContests {
            title
            titleSlug
            startTime
            duration
          }
        }
      `
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data || !response.data.data || !response.data.data.allContests) {
      console.error('Invalid response structure from LeetCode API:', response.data);
      return [];
    }
    
    const contests = response.data.data.allContests.map(contest => {
      if (!contest.title || !contest.titleSlug || contest.startTime === undefined || contest.duration === undefined) {
        return null;
      }
      
      return {
        name: contest.title,
        platform: 'LeetCode',
        url: `https://leetcode.com/contest/${contest.titleSlug}`,
        startTime: new Date(contest.startTime * 1000),
        duration: contest.duration,
        endTime: new Date((contest.startTime + contest.duration / 60) * 1000)
      };
    }).filter(contest => contest !== null);
    
    return contests;
  } catch (error) {
    console.error('Error fetching LeetCode contests:', error.message);
    return [];
  }
};

// -----------------------------------------------------------------------------------------------------------------------




// Sync contests from all platforms
const syncContests = async () => {
  try {
    console.log('Starting contest sync...');
    
    const [codeforcesContests, codeChefContests, leetCodeContests] = await Promise.all([
      fetchCodeforcesContests(),
      fetchCodeChefContests(),
      fetchLeetCodeContests()
    ]);
    
    console.log(`Fetched: ${codeforcesContests.length} Codeforces, ${codeChefContests.length} CodeChef, ${leetCodeContests.length} LeetCode contests`);
    
    const allContests = [...codeforcesContests, ...codeChefContests, ...leetCodeContests];
    
    // Bulk update to improve performance
    const updatePromises = allContests.map(contest => 
      Contest.findOneAndUpdate(
        { name: contest.name, platform: contest.platform },
        contest,
        { upsert: true, new: true }
      )
    );
    
    await Promise.all(updatePromises);
    console.log('Contests synced successfully');
    
    // After syncing contests, fetch and update YouTube solutions
    const solutions = await fetchYouTubeSolutionLinks();
    await updateContestSolutions(solutions);
  } catch (error) {
    console.error('Error syncing contests:', error);
  }
};

// Schedule jobs
cron.schedule('0 */12 * * *', syncContests); // Every 12 hours
cron.schedule('0 */24 * * *', async () => {
  const solutions = await fetchYouTubeSolutionLinks();
  await updateContestSolutions(solutions);
}); // Every 24 hours

// Initial sync
syncContests();

// Default route
app.get("/", (req, res) => {
  res.send("Contest Tracker API is running!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});