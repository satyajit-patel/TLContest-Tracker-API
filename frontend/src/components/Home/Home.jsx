import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Home = () => {
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [filters, setFilters] = useState({
    codeforces: true,
    codechef: true,
    leetcode: true,
    upcoming: true,
    past: true,
    bookmarked: false
  });
  const [bookmarks, setBookmarks] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [solutionUrl, setSolutionUrl] = useState("");
  const [selectedContest, setSelectedContest] = useState(null);
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  useEffect(() => {
    // Check if user prefers dark mode
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode === "true") {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    fetchContests();
    const storedBookmarks = localStorage.getItem("bookmarks");
    if (storedBookmarks) {
      setBookmarks(JSON.parse(storedBookmarks));
    }
  }, []);

  useEffect(() => {
    if (Array.isArray(contests)) {
      filterContests();
    }
  }, [contests, filters, bookmarks]);

  const fetchContests = async () => {
    setLoading(true);
    try {
      // Corrected API endpoint port from 3000 to 5000
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/contests`);
      setContests(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (error) {
      console.error("Error fetching contests:", error);
      setError("Failed to fetch contests. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filterContests = () => {
    if (!Array.isArray(contests)) return;
    
    const filtered = contests.filter(contest => {
      const platformMatch =
        (filters.codeforces && contest.platform === "Codeforces") ||
        (filters.codechef && contest.platform === "CodeChef") ||
        (filters.leetcode && contest.platform === "LeetCode");

      const now = new Date();
      const isUpcoming = new Date(contest.startTime) > now;
      const typeMatch =
        (filters.upcoming && isUpcoming) ||
        (filters.past && !isUpcoming);
      
      const bookmarkMatch = !filters.bookmarked || (filters.bookmarked && bookmarks.includes(contest._id));

      return platformMatch && typeMatch && bookmarkMatch;
    });

    // Sort contests: Upcoming first (by start time), then past (by end time)
    const sortedFiltered = [...filtered].sort((a, b) => {
      const aDate = new Date(a.startTime);
      const bDate = new Date(b.startTime);
      const now = new Date();
      const aIsUpcoming = aDate > now;
      const bIsUpcoming = bDate > now;
      
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;
      
      if (aIsUpcoming) {
        // Both upcoming - sort by which starts sooner
        return aDate - bDate;
      } else {
        // Both past - sort by most recent first
        return new Date(b.endTime) - new Date(a.endTime);
      }
    });

    setFilteredContests(sortedFiltered);
  };

  const toggleFilter = (filter) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const toggleBookmark = (contestId) => {
    let updatedBookmarks;
    if (bookmarks.includes(contestId)) {
      updatedBookmarks = bookmarks.filter(id => id !== contestId);
    } else {
      updatedBookmarks = [...bookmarks, contestId];
    }
    setBookmarks(updatedBookmarks);
    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
  };

  const getTimeRemaining = (startTime) => {
    const now = new Date();
    const contestTime = new Date(startTime);
    const diff = contestTime - now;

    if (diff < 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  const formatDuration = (durationInSeconds) => {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case "Codeforces":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "CodeChef":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "LeetCode":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    }
  };

  // Function to get a YouTube solution link if not available directly
  const findSolutionLink = (contest) => {
    // If the contest already has a solution URL, return it
    if (contest.solutionUrl) return contest.solutionUrl;
    
    // Otherwise, try to perform a direct YouTube search with a specific query
    const platformSearchQueries = {
      "Codeforces": contest.name.match(/Round\s+#?(\d+)/i) 
        ? `Codeforces Round ${contest.name.match(/Round\s+#?(\d+)/i)[1]} Video Solutions`
        : null,
      "CodeChef": contest.name.match(/Starters\s+(\d+)/i)
        ? `Codechef Starters ${contest.name.match(/Starters\s+(\d+)/i)[1]} Video Solutions`
        : null,
      "LeetCode": contest.name.match(/Weekly\s+Contest\s+(\d+)/i)
        ? `Leetcode Weekly Contest ${contest.name.match(/Weekly\s+Contest\s+(\d+)/i)[1]}`
        : contest.name.match(/Biweekly\s+Contest\s+(\d+)/i)
          ? `Leetcode Biweekly Contest ${contest.name.match(/Biweekly\s+Contest\s+(\d+)/i)[1]}`
          : null
    };
    
    // Create direct search query URL for the specific contest
    const searchQuery = platformSearchQueries[contest.platform];
    if (searchQuery) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
    }
    
    // Fallback to platform playlists if no specific query could be formed
    const platformPlaylistMap = {
      "LeetCode": "https://www.youtube.com/watch?v=i1e54Zn0hq8&list=PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr&index=2",
      "Codeforces": "https://www.youtube.com/watch?v=iclPxRgnrlg&list=PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB",
      "CodeChef": "https://www.youtube.com/watch?v=MKWQFDO5AqU&list=PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr"
    };
    
    return platformPlaylistMap[contest.platform];
  };

  // New function to save solution URL to the backend
  const saveSolutionUrl = async () => {
    if (!selectedContest || !solutionUrl) return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/contests/solution`, {
        contestId: selectedContest._id,
        solutionUrl: solutionUrl
      });
      
      // Update local state with the new solution URL
      const updatedContests = contests.map(contest => 
        contest._id === selectedContest._id 
          ? { ...contest, solutionUrl: solutionUrl }
          : contest
      );
      
      setContests(updatedContests);
      closeModal();
      
      // Show success message
      alert("Solution URL saved successfully!");
    } catch (error) {
      console.error("Error saving solution URL:", error);
      alert("Failed to save solution URL. Please try again.");
    }
  };

  // Modal control functions
  const openSolutionModal = (contest) => {
    setSelectedContest(contest);
    setSolutionUrl(contest.solutionUrl || "");
    setShowSolutionModal(true);
  };

  const closeModal = () => {
    setShowSolutionModal(false);
    setSelectedContest(null);
    setSolutionUrl("");
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900 text-black-100" : "bg-gray-100 text-gray-900"} transition-colors duration-200`}>
      <div className="container mx-auto p-4 md:p-6">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold bg-slate-500 rounded-b-md p-2">Contest Tracker</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => fetchContests()} 
              className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-colors"
            >
              Refresh
            </button>
            <button 
              onClick={toggleDarkMode} 
              className="px-4 py-2 rounded bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 shadow-md transition-colors"
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button 
              onClick={() => fetchContests()} 
              className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white shadow-md transition-colors"
            >
              <Link to="/">Home</Link>
            </button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Platforms</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "codeforces", label: "Codeforces", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100" },
                { id: "codechef", label: "CodeChef", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" },
                { id: "leetcode", label: "LeetCode", color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100" }
              ].map(platform => (
                <button
                  key={platform.id}
                  onClick={() => toggleFilter(platform.id)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    filters[platform.id] 
                      ? platform.color
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "upcoming", label: "Upcoming", color: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100" },
                { id: "past", label: "Past", color: "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100" },
                { id: "bookmarked", label: "Bookmarked", color: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100" }
              ].map(status => (
                <button
                  key={status.id}
                  onClick={() => toggleFilter(status.id)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    filters[status.id] 
                      ? status.color
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 p-4 rounded-lg shadow-md">
            {error}
            <p className="mt-2">Make sure your server is running on port 3000.</p>
          </div>
        ) : filteredContests.length === 0 ? (
          <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 p-4 rounded-lg shadow-md">
            No contests found matching your filters.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredContests.map(contest => {
              const isBookmarked = bookmarks.includes(contest._id);
              const now = new Date();
              const isPast = new Date(contest.startTime) < now;
              const timeRemaining = getTimeRemaining(contest.startTime);
              const hasSolution = isPast && contest.solutionUrl;

              return (
                <div 
                  key={contest._id} 
                  className="bg-slate-300 dark:bg-gray-800 transition-all hover:shadow-xl rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <div className="relative">
                    <div className="absolute top-0 right-0 mt-3 mr-3">
                      <button 
                        onClick={() => toggleBookmark(contest._id)} 
                        className="text-xl hover:scale-110 transition-transform"
                        aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                      >
                        {isBookmarked ? "⭐" : "☆"}
                      </button>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getPlatformColor(contest.platform)}`}>
                          {contest.platform}
                        </span>
                        {!isPast && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            Upcoming
                          </span>
                        )}
                        {isPast && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                            Past
                          </span>
                        )}
                        {hasSolution && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Solution Available
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold line-clamp-2 mb-3 h-14">{contest.name}</h3>

                      <div className="grid grid-cols-2 bg-slate-300 gap-x-2 gap-y-1 text-sm mb-4">
                        <div className="font-semibold">Date:</div>
                        <div>{new Date(contest.startTime).toLocaleDateString()}</div>
                        
                        <div className="font-semibold">Time:</div>
                        <div>{new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                        
                        <div className="font-semibold">Duration:</div>
                        <div>{formatDuration(contest.duration)}</div>
                        
                        {!isPast && (
                          <>
                            <div className="font-semibold">Starts in:</div>
                            <div className="text-blue-600 dark:text-blue-400 font-medium">{timeRemaining}</div>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-auto">
                        <a 
                          href={contest.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors flex-grow text-center"
                        >
                          Go to Contest
                        </a>
                        
                        {hasSolution && (
                          <a 
                            href={contest.solutionUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors flex-grow text-center"
                          >
                            Watch Solution
                          </a>
                        )}
                        {isPast && !hasSolution && (
                          <div className="flex w-full gap-2">
                            <button 
                              onClick={() => openSolutionModal(contest)}
                              className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg shadow-md transition-colors flex-grow text-center"
                            >
                              Add Solution
                            </button>
                            <button 
                              onClick={() => window.open(findSolutionLink(contest) || contest.url, '_blank')}
                              className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-md transition-colors flex-grow text-center"
                            >
                              Find Solutions
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      
        <footer className="mt-10 pt-6 border-t border-gray-300 dark:border-gray-700 text-center text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-2">Solution playlists on YouTube:</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <a 
              href="https://www.youtube.com/watch?v=i1e54Zn0hq8&list=PLcXpkI9A-RZI6FhydNz3JBt_-p_i25Cbr&index=1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <span className="mr-1">▶️</span> LeetCode Solutions
            </a>
            <a 
              href="https://www.youtube.com/watch?v=iclPxRgnrlg&list=PLcXpkI9A-RZLUfBSNp-YQBCOezZKbDSgB" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <span className="mr-1">▶️</span> Codeforces Solutions
            </a>
            <a 
              href="https://www.youtube.com/watch?v=MKWQFDO5AqU&list=PLcXpkI9A-RZIZ6lsE0KCcLWeKNoG45fYr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <span className="mr-1">▶️</span> CodeChef Solutions
            </a>
          </div>
        </footer>
      </div>

      {/* Solution URL Modal */}
      {showSolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 dark:text-white">Add Solution URL</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {selectedContest?.name}
            </p>
            
            <div className="mb-4">
              <label htmlFor="solutionUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                YouTube Solution URL
              </label>
              <input
                type="url"
                id="solutionUrl"
                value={solutionUrl}
                onChange={(e) => setSolutionUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveSolutionUrl}
                disabled={!solutionUrl}
                className={`px-4 py-2 text-white rounded-md ${
                  solutionUrl 
                    ? "bg-green-500 hover:bg-green-600" 
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
