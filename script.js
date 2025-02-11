const CLIENT_ID = "a6196a760a754ef896f357c0cbcba788";
const REDIRECT_URI = "https://stark145.github.io/Spotify-playlist-maker/auth-complete";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const SCOPES = [
    "playlist-modify-private",
    "playlist-modify-public",
    "user-read-private"
];

const loginBtn = document.getElementById("login-btn");

// Create profile elements
const profileContainer = document.createElement("div");
profileContainer.style.display = "none";
profileContainer.style.alignItems = "center";
profileContainer.style.gap = "10px";
profileContainer.style.justifyContent = "center";

const profileImg = document.createElement("img");
profileImg.style.width = "40px";
profileImg.style.height = "40px";
profileImg.style.borderRadius = "50%";
profileImg.style.objectFit = "cover";

const logoutBtn = document.createElement("button");
logoutBtn.textContent = "Logout";
logoutBtn.style.padding = "8px 16px";

profileContainer.appendChild(profileImg);
profileContainer.appendChild(logoutBtn);

loginBtn.parentNode.appendChild(profileContainer);

// Spotify Gradient UI Styling
document.body.style.background = "linear-gradient(to right, #1DB954, #191414)";
document.body.style.color = "#fff";

// Get Token from URL hash
const getToken = () => {
    return window.location.hash
        .substring(1)
        .split("&")
        .find((item) => item.startsWith("access_token"))
        ?.split("=")[1];
};

// Logout function
const logout = () => {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("playlist_id");
    loginBtn.style.display = "block";
    profileContainer.style.display = "none";
    window.location.reload();
};

// Update Profile UI
const updateProfileUI = async (token) => {
    try {
        const response = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userData = await response.json();
        
        if (userData.images && userData.images.length > 0) {
            profileImg.src = userData.images[0].url;
        } else {
            profileImg.src = "https://api.spotify.com/favicon.ico";
        }
        
        loginBtn.style.display = "none";
        profileContainer.style.display = "flex";
    } catch (error) {
        console.error("Error fetching user data:", error);
        logout();
    }
};

// Login Button Action
loginBtn.addEventListener("click", () => {
    window.location.href = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPES.join("%20")}`;
});

// Logout Button Action
logoutBtn.addEventListener("click", logout);

// Check for Token in URL or Local Storage
const token = getToken();
if (token) {
    localStorage.setItem("spotify_token", token);
    window.history.pushState({}, document.title, "/");
    updateProfileUI(token);
} else {
    const storedToken = localStorage.getItem("spotify_token");
    if (storedToken) {
        updateProfileUI(storedToken);
    }
}

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resultsDiv = document.getElementById("results");
const selectedSongsList = document.getElementById("selected-songs");
const selectedTracks = [];

searchBtn.addEventListener("click", async () => {
    const query = searchInput.value;
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("spotify_token")}` },
    });
    const data = await response.json();
    resultsDiv.innerHTML = "";
    
    data.tracks.items.forEach((track) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "10px";
        
        const trackImg = document.createElement("img");
        trackImg.src = track.album.images[2].url;  // Display small image of track
        trackImg.style.width = "30px";
        trackImg.style.height = "30px";
        trackImg.style.borderRadius = "5px";
        
        const trackInfo = document.createElement("div");
        trackInfo.textContent = `${track.name} - ${track.artists[0].name}`;
        
        const addButton = document.createElement("button");
        addButton.textContent = "Add";
        addButton.addEventListener("click", () => {
            selectedTracks.push(track.uri);
            const selectedLi = document.createElement("li");
            selectedLi.style.display = "flex";
            selectedLi.style.alignItems = "center";
            selectedLi.style.gap = "10px";
            
            const selectedTrackImg = document.createElement("img");
            selectedTrackImg.src = track.album.images[2].url;
            selectedTrackImg.style.width = "30px";
            selectedTrackImg.style.height = "30px";
            selectedTrackImg.style.borderRadius = "5px";
            
            const selectedTrackName = document.createElement("span");
            selectedTrackName.textContent = track.name;
            
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", () => {
                selectedTracks.splice(selectedTracks.indexOf(track.uri), 1);
                selectedSongsList.removeChild(selectedLi);
            });
            
            selectedLi.appendChild(selectedTrackImg);
            selectedLi.appendChild(selectedTrackName);
            selectedLi.appendChild(removeButton);
            selectedSongsList.appendChild(selectedLi);
        });

        li.appendChild(trackImg);
        li.appendChild(trackInfo);
        li.appendChild(addButton);
        resultsDiv.appendChild(li);
    });
});

// Create Playlist Button Action
document.getElementById("create-playlist-btn").addEventListener("click", async () => {
    const playlistName = document.getElementById("playlist-name").value;
    
    if (!playlistName) {
        alert("Please enter a playlist name!");
        return;
    }
    
    // Get the user's playlists to check if one already exists with the same name
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${localStorage.getItem("spotify_token")}` },
    });
    const userData = await userResponse.json();
    
    const playlistsResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("spotify_token")}` },
    });
    const playlistsData = await playlistsResponse.json();
    
    // Check if the playlist name already exists
    const existingPlaylist = playlistsData.items.find(playlist => playlist.name.toLowerCase() === playlistName.toLowerCase());
    
    if (existingPlaylist) {
        alert("A playlist with this name already exists!");
    } else {
        // Create new playlist if one with the same name doesn't exist
        const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("spotify_token")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: playlistName, public: false }),
        });

        const playlistData = await playlistResponse.json();
        localStorage.setItem("playlist_id", playlistData.id);
        alert("Playlist created successfully!");
    }
});


// Add Tracks to Playlist Button Action
document.getElementById("add-tracks-btn").addEventListener("click", async () => {
    const playlistId = localStorage.getItem("playlist_id");
    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("spotify_token")}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: selectedTracks }),
    });
    alert("Tracks added to playlist!");
});

// Play Song Button Action
const playSong = (uri) => {
    const audioPlayer = new Audio(uri); // Spotify's audio preview link or equivalent
    audioPlayer.play();
};

