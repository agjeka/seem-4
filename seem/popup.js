let accessToken = '';

document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const loginSection = document.getElementById('login-section');
    const content = document.getElementById('content');
    const statusDiv = document.getElementById('status');
    const playlistsDiv = document.getElementById('playlists');
    const shuffleLikedSongsButton = document.getElementById('shuffle-liked-songs');
    const nowPlayingDiv = document.getElementById('now-playing');

    function updateUI(isLoggedIn, username = '') {
        console.log('Updating UI, isLoggedIn:', isLoggedIn);
        loginSection.style.display = isLoggedIn ? 'none' : 'block';
        content.style.display = isLoggedIn ? 'block' : 'none';
        statusDiv.textContent = isLoggedIn ? `Logged in as ${username}` : 'Not logged in';
    }

    function getSpotifyProfile(token) {
        console.log('Getting Spotify profile');
        accessToken = token;
        fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Profile data:', data);
            updateUI(true, data.display_name || data.id);
            getPlaylists(token);
        })
        .catch(error => {
            console.error('Error fetching profile:', error);
            statusDiv.textContent = `Error fetching profile: ${error.message}`;
            updateUI(false);
        });
    }

    function getPlaylists(token) {
        console.log('Getting playlists');
        fetch('https://api.spotify.com/v1/me/playlists', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Playlists data:', data);
            playlistsDiv.innerHTML = '';
            data.items.forEach(playlist => {
                const button = document.createElement('button');
                button.textContent = playlist.name;
                button.onclick = () => shufflePlayPlaylist(playlist.id);
                playlistsDiv.appendChild(button);
            });
        })
        .catch(error => {
            console.error('Error fetching playlists:', error);
            playlistsDiv.textContent = `Error fetching playlists: ${error.message}`;
        });
    }

    chrome.storage.local.get(['spotifyAccessToken'], (result) => {
        console.log('Checking for stored access token');
        if (result.spotifyAccessToken) {
            console.log('Access token found, getting profile');
            getSpotifyProfile(result.spotifyAccessToken);
        } else {
            console.log('No access token found, updating UI');
            updateUI(false);
        }
    });

    loginButton.addEventListener('click', () => {
        console.log('Login button clicked');
        chrome.runtime.sendMessage({action: 'login'}, (response) => {
            console.log('Login response:', response);
            if (response && response.success) {
                chrome.storage.local.get(['spotifyAccessToken'], (result) => {
                    if (result.spotifyAccessToken) {
                        console.log('Access token received, getting profile');
                        getSpotifyProfile(result.spotifyAccessToken);
                    } else {
                        console.error('No access token received after login');
                        statusDiv.textContent = 'Login failed: No access token received';
                    }
                });
            } else {
                console.error('Login failed', response ? response.error : 'Unknown error');
                statusDiv.textContent = `Login failed: ${response ? response.error : 'Unknown error'}`;
            }
        });
    });

    logoutButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({action: 'logout'}, (response) => {
            if (response && response.success) {
                console.log('Logged out successfully');
                updateUI(false);
            } else {
                console.error('Logout failed');
                statusDiv.textContent = 'Logout failed. Please try again.';
            }
        });
    });
});