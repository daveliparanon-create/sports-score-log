const API_URL = 'http://localhost:3000/api';

// Auth functions
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Scroll lock functions
function preventBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
}

function allowBodyScroll() {
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

// Handle Login
async function handleLogin(email, password) {
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'dashboard.html';
        } else {
            const error = await response.json();
            alert(error.error || 'Login failed');
        }
    } catch (error) {
        alert('Server error. Please make sure the server is running on http://localhost:3000');
    }
}

// Handle Signup
async function handleSignup(name, email, password, confirmPassword) {
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            alert('Account created successfully!');
            window.location.href = 'dashboard.html';
        } else {
            const error = await response.json();
            alert(error.error || 'Signup failed');
        }
    } catch (error) {
        alert('Server error. Please make sure the server is running.');
    }
}

// Handle Forgot Password
async function handleForgotPassword(email) {
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();
        const userExists = users.find(u => u.email === email);
        
        const messageDiv = document.getElementById('reset-message');
        
        if (userExists) {
            messageDiv.className = 'reset-message success';
            messageDiv.innerHTML = 'Password reset link sent! Check your email. (Demo feature)';
            setTimeout(() => closeForgotModal(), 2000);
        } else {
            messageDiv.className = 'reset-message error';
            messageDiv.innerHTML = 'No account found with this email.';
        }
    } catch (error) {
        const messageDiv = document.getElementById('reset-message');
        messageDiv.className = 'reset-message error';
        messageDiv.innerHTML = 'Server error. Please try again.';
    }
}

// Match CRUD Operations
let allMatches = [];

async function fetchMatches() {
    try {
        const response = await fetch(`${API_URL}/matches`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            allMatches = await response.json();
            updateDashboard();
        } else if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error fetching matches:', error);
        alert('Error connecting to server. Please make sure the backend is running.');
    }
}

async function addMatch(matchData) {
    try {
        const response = await fetch(`${API_URL}/matches`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(matchData)
        });
        
        if (response.ok) {
            await fetchMatches();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error adding match:', error);
        return false;
    }
}

async function updateMatch(id, matchData) {
    try {
        const response = await fetch(`${API_URL}/matches/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(matchData)
        });
        
        if (response.ok) {
            await fetchMatches();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating match:', error);
        return false;
    }
}

async function deleteMatch(id) {
    if (confirm('Delete this match?')) {
        try {
            const response = await fetch(`${API_URL}/matches/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                await fetchMatches();
            }
        } catch (error) {
            console.error('Error deleting match:', error);
        }
    }
}

// Update Dashboard UI
function updateDashboard() {
    updateSummaryCards();
    displayLiveMatches();
    displayUpcomingMatches();
    displayFinishedMatches();
    displayMatchesTable();
}

function updateSummaryCards() {
    const total = allMatches.length;
    const live = allMatches.filter(m => m.status === 'live').length;
    const finished = allMatches.filter(m => m.status === 'finished').length;
    
    document.getElementById('total-games').textContent = total;
    document.getElementById('live-games').textContent = live;
    document.getElementById('finished-games').textContent = finished;
}

function displayLiveMatches() {
    const liveMatches = allMatches.filter(m => m.status === 'live');
    const container = document.getElementById('live-matches');
    
    if (liveMatches.length === 0) {
        container.innerHTML = '<div class="empty-message">🏁 No live matches at the moment</div>';
        return;
    }
    
    container.innerHTML = liveMatches.map(match => `
        <div class="match-card">
            <h3>${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</h3>
            <div class="match-score">${match.teamAScore} - ${match.teamBScore}</div>
            <div class="match-info">${match.sport} • ${match.date} ${match.time}</div>
        </div>
    `).join('');
}

function displayUpcomingMatches() {
    const upcomingMatches = allMatches.filter(m => m.status === 'upcoming');
    const container = document.getElementById('upcoming-matches');
    
    if (upcomingMatches.length === 0) {
        container.innerHTML = '<div class="empty-message">📅 No upcoming matches scheduled</div>';
        return;
    }
    
    container.innerHTML = upcomingMatches.map(match => `
        <div class="match-item">
            <div class="match-details">
                <div class="match-teams">${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</div>
                <div class="match-time">${match.date} at ${match.time} - ${match.sport}</div>
            </div>
            <span class="status-badge status-upcoming">Upcoming</span>
        </div>
    `).join('');
}

function displayFinishedMatches() {
    const finishedMatches = allMatches.filter(m => m.status === 'finished');
    const container = document.getElementById('finished-matches');
    
    if (finishedMatches.length === 0) {
        container.innerHTML = '<div class="empty-message">🏆 No finished matches yet</div>';
        return;
    }
    
    container.innerHTML = finishedMatches.map(match => {
        const winner = match.teamAScore > match.teamBScore ? match.teamA : match.teamBScore > match.teamAScore ? match.teamB : 'Tie';
        return `
            <div class="match-item">
                <div class="match-details">
                    <div class="match-teams">${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</div>
                    <div class="match-result">Final: ${match.teamAScore} - ${match.teamBScore} | Winner: ${winner}</div>
                </div>
                <span class="status-badge status-finished">Finished</span>
            </div>
        `;
    }).join('');
}

function displayMatchesTable() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const sportFilter = document.getElementById('sport-filter')?.value || 'all';
    
    let filteredMatches = allMatches;
    
    if (searchTerm) {
        filteredMatches = filteredMatches.filter(m => 
            m.teamA.toLowerCase().includes(searchTerm) || 
            m.teamB.toLowerCase().includes(searchTerm)
        );
    }
    
    if (sportFilter !== 'all') {
        filteredMatches = filteredMatches.filter(m => m.sport === sportFilter);
    }
    
    const tbody = document.getElementById('matches-table-body');
    
    if (filteredMatches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No matches found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredMatches.map(match => `
        <tr>
            <td>${escapeHtml(match.teamA)} vs ${escapeHtml(match.teamB)}</td>
            <td>${match.teamAScore} - ${match.teamBScore}</td>
            <td>${match.sport}</td>
            <td>${match.date} ${match.time}</td>
            <td><span class="status-badge status-${match.status}">${match.status.toUpperCase()}</span></td>
            <td class="action-buttons">
                <button class="btn-edit" onclick="editMatch(${match.id})">Edit</button>
                <button class="btn-delete" onclick="deleteMatch(${match.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Modal handling
let currentEditId = null;

function openModal(match = null) {
    const modal = document.getElementById('match-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (match) {
        modalTitle.textContent = 'Edit Match';
        document.getElementById('match-id').value = match.id;
        document.getElementById('team-a').value = match.teamA;
        document.getElementById('team-b').value = match.teamB;
        document.getElementById('score-a').value = match.teamAScore;
        document.getElementById('score-b').value = match.teamBScore;
        document.getElementById('sport').value = match.sport;
        document.getElementById('status').value = match.status;
        document.getElementById('date').value = match.date;
        document.getElementById('time').value = match.time;
        currentEditId = match.id;
    } else {
        modalTitle.textContent = 'Add New Match';
        document.getElementById('match-form').reset();
        document.getElementById('match-id').value = '';
        document.getElementById('score-a').value = 0;
        document.getElementById('score-b').value = 0;
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('time').value = '19:00';
        currentEditId = null;
    }
    
    modal.style.display = 'flex';
    preventBodyScroll();
}

function closeModal() {
    const modal = document.getElementById('match-modal');
    if (modal) {
        modal.style.display = 'none';
        allowBodyScroll();
    }
}

function openForgotModal() {
    const modal = document.getElementById('forgot-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('reset-message').innerHTML = '';
        preventBodyScroll();
    }
}

function closeForgotModal() {
    const modal = document.getElementById('forgot-modal');
    if (modal) {
        modal.style.display = 'none';
        allowBodyScroll();
    }
}

window.editMatch = async (id) => {
    const match = allMatches.find(m => m.id === id);
    if (match) openModal(match);
};

window.deleteMatch = deleteMatch;

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== DRAG AND DROP FOR SPORTS BALLS ==========
function makeDraggable() {
    const balls = document.querySelectorAll('.ball-basketball, .ball-soccer, .ball-baseball, .ball-tennis, .ball-football, .ball-volleyball');
    
    balls.forEach(ball => {
        let isDragging = false;
        let startX, startY;
        
        // Mouse events
        ball.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isDragging = true;
            const rect = ball.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            ball.style.cursor = 'grabbing';
            ball.style.zIndex = '10000';
            ball.style.transition = 'none';
            ball.style.animation = 'none';
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            let newX = e.clientX - startX;
            let newY = e.clientY - startY;
            
            // Keep within viewport
            const ballRect = ball.getBoundingClientRect();
            const maxX = window.innerWidth - ballRect.width;
            const maxY = window.innerHeight - ballRect.height;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            ball.style.position = 'fixed';
            ball.style.left = newX + 'px';
            ball.style.top = newY + 'px';
        });
        
        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                ball.style.cursor = 'grab';
                ball.style.zIndex = '0';
                ball.style.transition = '';
                
                // Restore animation
                setTimeout(() => {
                    if (ball.classList.contains('ball-basketball')) {
                        ball.style.animation = 'floatBall1 12s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-soccer')) {
                        ball.style.animation = 'floatBall2 14s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-baseball')) {
                        ball.style.animation = 'floatBall3 10s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-tennis')) {
                        ball.style.animation = 'floatBall4 11s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-football')) {
                        ball.style.animation = 'floatBall5 13s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-volleyball')) {
                        ball.style.animation = 'floatBall6 9s ease-in-out infinite';
                    }
                }, 100);
            }
        });
        
        // Touch events for mobile
        ball.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches[0];
            const rect = ball.getBoundingClientRect();
            startX = touch.clientX - rect.left;
            startY = touch.clientY - rect.top;
            ball.style.zIndex = '10000';
            ball.style.animation = 'none';
        });
        
        window.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            let newX = touch.clientX - startX;
            let newY = touch.clientY - startY;
            
            const ballRect = ball.getBoundingClientRect();
            const maxX = window.innerWidth - ballRect.width;
            const maxY = window.innerHeight - ballRect.height;
            
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            
            ball.style.position = 'fixed';
            ball.style.left = newX + 'px';
            ball.style.top = newY + 'px';
        });
        
        window.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                ball.style.zIndex = '0';
                
                setTimeout(() => {
                    if (ball.classList.contains('ball-basketball')) {
                        ball.style.animation = 'floatBall1 12s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-soccer')) {
                        ball.style.animation = 'floatBall2 14s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-baseball')) {
                        ball.style.animation = 'floatBall3 10s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-tennis')) {
                        ball.style.animation = 'floatBall4 11s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-football')) {
                        ball.style.animation = 'floatBall5 13s ease-in-out infinite';
                    } else if (ball.classList.contains('ball-volleyball')) {
                        ball.style.animation = 'floatBall6 9s ease-in-out infinite';
                    }
                }, 100);
            }
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize drag and drop
    makeDraggable();
    
    // Auth page listeners
    if (document.getElementById('login')) {
        document.getElementById('login').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            handleLogin(email, password);
        });
        
        document.getElementById('signup').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirm = document.getElementById('confirm-password').value;
            handleSignup(name, email, password, confirm);
        });
        
        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            openForgotModal();
        });
        
        document.getElementById('forgot-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value;
            handleForgotPassword(email);
        });
        
        // Tab switching
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.getElementById('login-form').classList.remove('active');
                document.getElementById('signup-form').classList.remove('active');
                document.getElementById(`${tabName}-form`).classList.add('active');
            });
        });
    }
    
    // Dashboard listeners
    if (document.getElementById('add-match-btn')) {
        if (!isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('user-name').textContent = user.name || user.email;
        document.getElementById('welcome-name').textContent = user.name || user.email;
        
        fetchMatches();
        
        document.getElementById('add-match-btn').addEventListener('click', () => openModal());
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
        
        document.getElementById('match-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const matchData = {
                teamA: document.getElementById('team-a').value,
                teamB: document.getElementById('team-b').value,
                teamAScore: parseInt(document.getElementById('score-a').value),
                teamBScore: parseInt(document.getElementById('score-b').value),
                sport: document.getElementById('sport').value,
                status: document.getElementById('status').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value
            };
            
            let success;
            if (currentEditId) {
                success = await updateMatch(currentEditId, matchData);
            } else {
                success = await addMatch(matchData);
            }
            
            if (success) closeModal();
        });
        
        document.getElementById('search-input').addEventListener('input', () => displayMatchesTable());
        document.getElementById('sport-filter').addEventListener('change', () => displayMatchesTable());
        
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal();
                closeForgotModal();
            });
        });
        
        document.getElementById('cancel-btn')?.addEventListener('click', closeModal);
        
        window.onclick = (event) => {
            if (event.target === document.getElementById('match-modal')) {
                closeModal();
            }
            if (event.target === document.getElementById('forgot-modal')) {
                closeForgotModal();
            }
        };
    }
});

if (window.location.pathname.includes('dashboard.html') && !isAuthenticated()) {
    window.location.href = 'index.html';
}