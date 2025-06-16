// Parallax background effect (optimized for smoothness)
let parallaxX = 50, parallaxY = 50, targetX = 50, targetY = 50;
document.addEventListener('mousemove', function(e) {
  targetX = 50 + (e.clientX / window.innerWidth - 0.5) * 40;
  targetY = 50 + (e.clientY / window.innerHeight - 0.5) * 40;
});
function animateParallax() {
  parallaxX += (targetX - parallaxX) * 0.08;
  parallaxY += (targetY - parallaxY) * 0.08;
  document.body.style.backgroundPosition = `${parallaxX}% ${parallaxY}%`;
  requestAnimationFrame(animateParallax);
}
animateParallax();

// Play chess move sound effect
function playChessMoveSound() {
  const audio = document.getElementById('chessMoveSound');
  audio.currentTime = 0;
  audio.play();
}
// Play chess capture sound effect
function playChessCaptureSound() {
  const audio = document.getElementById('chessCaptureSound');
  audio.currentTime = 0;
  audio.play();
}

// Update button click handlers to use capture sound
document.querySelectorAll('.modern-btn').forEach(btn => {
  btn.onclick = function(e) {
    playChessCaptureSound();
    const action = btn.getAttribute('data-action');
    if (action === 'lichess') window.open('https://lichess.org', '_blank');
    else if (action === 'chesscom') window.open('https://chess.com', '_blank');
    else if (action === 'home') window.open('https://www.lokiclarke.com', '_self');
  };
});

// Fetch Lichess Leaderboard for selected time control
async function fetchLichessLeaderboard() {
  const timeControl = document.getElementById('timeControlSelect').value;
  document.getElementById('lichess-leaderboard').textContent = 'Loading...';
  document.getElementById('lichess-leaderboard').innerHTML = '<div class="spinner"></div>';
  try {
    const res = await fetch(`https://lichess.org/api/player/top/20/${timeControl}`);
    const data = await res.json();
    let html = '<ol style="padding-left:20px;">';
    data.users.forEach((user, i) => {
      html += `<li><a href="https://lichess.org/@/${user.id}" target="_blank" style="color:#00ffe0;text-decoration:none;">${user.username}</a> <span style="color:#aaa;">(${user.perfs[timeControl].rating})</span></li>`;
    });
    html += '</ol>';
    document.getElementById('lichess-leaderboard').innerHTML = html;
  } catch (e) {
    document.getElementById('lichess-leaderboard').textContent = 'Failed to load leaderboard.';
  }
}
document.getElementById('timeControlSelect').addEventListener('change', fetchLichessLeaderboard);
fetchLichessLeaderboard();

// Fetch Lichess Recent Games for a user
async function fetchLichessGames() {
  const username = document.getElementById('lichessUserInput').value.trim();
  const gamesDiv = document.getElementById('lichess-games');
  if (!username) {
    gamesDiv.textContent = 'Please enter a username.';
    return;
  }
  gamesDiv.innerHTML = '<div class="spinner"></div>';
  try {
    const res = await fetch(`https://lichess.org/api/games/user/${username}?max=10&opening=true&clocks=false&evals=false&perfType=bullet,blitz,rapid,classical&moves=false`, {
      headers: { 'Accept': 'application/x-ndjson' }
    });
    if (!res.ok) throw new Error('User not found or error fetching games');
    const text = await res.text();
    const games = text.trim().split('\n').map(line => JSON.parse(line));
    // Only keep the 10 most recent games
    const recentGames = games.slice(0, 10);
    if (!recentGames.length || !recentGames[0].id) {
      gamesDiv.textContent = 'No recent games found.';
      return;
    }
    function timeAgo(ts) {
      const now = Date.now() / 1000;
      const diff = Math.floor(now - ts);
      if (diff < 60) return diff + 's ago';
      if (diff < 3600) return Math.floor(diff/60) + 'm ago';
      if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
      return Math.floor(diff/86400) + 'd ago';
    }
    function getResult(game, username) {
      const userColor = game.players.white.user && game.players.white.user.name.toLowerCase() === username.toLowerCase() ? 'white' : 'black';
      const result = game.status === 'draw' ? 'Draw' : (game.winner === userColor ? 'Win' : 'Loss');
      return result;
    }
    let winCount = 0;
    let html = '<ol style="padding-left:20px;">';
    recentGames.forEach(game => {
      const opp = game.players.white.user && game.players.white.user.name.toLowerCase() === username.toLowerCase()
        ? game.players.black.user.name : game.players.white.user.name;
      const color = game.players.white.user && game.players.white.user.name.toLowerCase() === username.toLowerCase() ? 'White' : 'Black';
      const result = getResult(game, username);
      if (result === 'Win') winCount++;
      html += `<li style=\"margin-bottom:18px;\"><a href=\"https://lichess.org/${game.id}\" target=\"_blank\" style=\"color:#00ffe0;text-decoration:none;\">vs ${opp}</a> <span style=\"color:#aaa;\">(${color}, ${result}, ${timeAgo(game.createdAt/1000)})</span></li>`;
    });
    html += '</ol>';
    const winrate = Math.round((winCount / recentGames.length) * 100);
    gamesDiv.innerHTML = html + `<div style=\"margin-top:24px;text-align:center;font-weight:600;font-size:1.1em;\">Winrate: <span style=\"color:#00ffe0;\">${winrate}%</span> (${winCount}/${recentGames.length})</div>`;
  } catch (e) {
    gamesDiv.textContent = 'Failed to load games.';
  }
}
// Bouncing pawn animation with sound
const pawn = document.getElementById('bouncingPawn');
let px = window.innerWidth / 2, py = window.innerHeight / 2;
let vx = 2.2 * (Math.random() > 0.5 ? 1 : -1), vy = 1.8 * (Math.random() > 0.5 ? 1 : -1);
const pawnSize = 48;
let rotation = 0;
function animatePawn() {
  let bounced = false;
  px += vx;
  py += vy;
  rotation += 4; // Increase rotation angle
  if (px <= 0) { px = 0; vx = Math.abs(vx); bounced = true; }
  if (px + pawnSize >= window.innerWidth) { px = window.innerWidth - pawnSize; vx = -Math.abs(vx); bounced = true; }
  if (py <= 0) { py = 0; vy = Math.abs(vy); bounced = true; }
  if (py + pawnSize >= window.innerHeight) { py = window.innerHeight - pawnSize; vy = -Math.abs(vy); bounced = true; }
  pawn.style.left = px + 'px';
  pawn.style.top = py + 'px';
  pawn.style.transform = `rotate(${rotation}deg)`;
  if (bounced) playChessMoveSound();
  requestAnimationFrame(animatePawn);
}
animatePawn();
