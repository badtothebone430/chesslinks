// Opening Recommender: Load questions, collect answers, and suggest openings
let openings = [];

const questions = [
  {
    id: 'timecontrol',
    label: 'Favorite time control?',
    options: ['Blitz', 'Rapid', 'Classical', 'Bullet']
  },
  {
    id: 'style',
    label: 'Playing style?',
    options: ['Positional', 'Tactical', 'Balanced']
  },
  {
    id: 'rating',
    label: 'Your rating range?',
    options: ['<1200', '1200-1600', '1600-2000', '2000+']
  },
  {
    id: 'approach',
    label: 'Attacking or defensive?',
    options: ['Attacking', 'Defensive', 'Flexible']
  },
  {
    id: 'sharpness',
    label: 'Sharp or easy?',
    options: ['Sharp', 'Easy', 'Doesn\'t matter']
  },
  {
    id: 'phase',
    label: 'Do you prefer middlegame or endgame?',
    options: ['Middlegame', 'Endgame', "Doesn't matter"]
  },
  {
    id: 'vibe',
    label: 'What is your chess vibe today?',
    options: ['Serious', 'Casual', 'MEME']
  },
  {
    id: 'line',
    label: 'Do you want to surprise your opponent or play something more concrete?',
    options: ['Surprise', 'Concrete', "Doesn't matter"]
  },
  {
    id: 'priority',
    label: 'Which feature do you value the most?',
    options: [
      'Time control',
      'Style',
      'Rating',
      'Approach',
      'Sharpness',
      'Phase',
      'Vibe',
      'Line type'
    ]
  }
];

window.addEventListener('DOMContentLoaded', async () => {
  // Load openings
  const res = await fetch('openings.json');
  openings = await res.json();

  // Render questions
  const form = document.getElementById('opening-quiz-form');
  questions.forEach(q => {
    const div = document.createElement('div');
    div.innerHTML = `<label style='font-size:1.1em;'>${q.label}</label><select id='${q.id}' style='margin-left:10px; padding:6px 14px; border-radius:8px; border:none; font-size:1em;'>${q.options.map(opt => `<option value='${opt.toLowerCase()}'>${opt}</option>`).join('')}</select>`;
    form.appendChild(div);
  });
  form.innerHTML += `<button type='submit' class='modern-btn' style='width:220px;'>Get My Openings</button>`;

  form.onsubmit = async function(e) {
    e.preventDefault();
    // Show loading spinners while processing
    ['white-kings-pawn', 'white-queens-pawn', 'white-flank-pawn', 'black-kings-pawn', 'black-queens-pawn', 'black-flank-pawn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<div class="spinner"></div>';
    });
    await new Promise(r => setTimeout(r, 100)); // Simulate async loading
    const answers = {};
    questions.forEach(q => {
      answers[q.id] = document.getElementById(q.id).value;
    });
    // Map priority to question id
    const priorityMap = {
      'time control': 'timecontrol',
      'style': 'style',
      'rating': 'rating',
      'approach': 'approach',
      'sharpness': 'sharpness',
      'phase': 'phase',
      'vibe': 'vibe',
      'line type': 'line'
    };
    const priorityId = priorityMap[answers['priority']];
    // Tag mapping
    const tagMap = {
      blitz: 'blitz', rapid: 'rapid', classical: 'classical', bullet: 'bullet',
      positional: 'positional', tactical: 'tactical', balanced: '',
      '<1200': 'beginner-friendly', '1200-1600': 'easy', '1600-2000': '', '2000+': '',
      attacking: 'attacking', defensive: 'defensive', flexible: '',
      sharp: 'sharp', easy: 'easy', "doesn't matter": '',
      middlegame: 'middlegame', endgame: 'endgame', "doesn't matter": '',
      serious: 'serious', casual: 'casual', meme: 'meme',
      surprise: 'sideline', concrete: 'mainline', "doesn't matter": ''
    };
    // Categories and their divs
    const categories = [
      { key: 'vs-kings-pawn', label: "vs King's Pawn ", whiteDiv: 'white-kings-pawn', blackDiv: 'black-kings-pawn' },
      { key: 'vs-queens-pawn', label: "vs Queen's Pawn ", whiteDiv: 'white-queens-pawn', blackDiv: 'black-queens-pawn' },
      { key: 'vs-flank-pawn', label: "vs Flank Pawn / Other", whiteDiv: 'white-flank-pawn', blackDiv: 'black-flank-pawn' }
    ];
    // Count non-empty tags for percentage calculation
    const nonEmptyTags = Object.values(answers).filter(ans => (tagMap[ans] || '') !== '').length;
    // Clear previous results
    categories.forEach(cat => {
      document.getElementById(cat.whiteDiv).innerHTML = '';
      document.getElementById(cat.blackDiv).innerHTML = '';
    });
    // For each category, find best opening for White and Black
    categories.forEach((cat, idx) => {
      // Filter openings for this category
      const catOpenings = openings.filter(o => o.tags.includes(cat.key));
      // Score each opening
      const scored = catOpenings.map(opening => {
        let score = 0;
        let matchedTags = [];
        Object.entries(answers).forEach(([qid, ans]) => {
          if (qid === 'priority') return; // skip priority itself
          const tag = tagMap[ans] || '';
          if (tag && opening.tags.includes(tag)) {
            // Double the score if this is the prioritized feature
            if (qid === priorityId) {
              score += 2;
            } else {
              score++;
            }
            matchedTags.push(tag);
          }
        });
        // Apply dubious nerf: lower score by 7% if opening is dubious
        if (opening.tags.includes('dubious')) {
          score *= 0.93;
        }
        return { opening, score, matchedTags };
      });
      // Find best for White and Black
      const bestWhite = scored.filter(s => s.opening.color === 'white').sort((a, b) => b.score - a.score || a.opening.name.localeCompare(b.opening.name))[0];
      const bestBlack = scored.filter(s => s.opening.color === 'black').sort((a, b) => b.score - a.score || a.opening.name.localeCompare(b.opening.name))[0];
      // Spacing style
      const spacing = (idx < categories.length - 1) ? 'margin-bottom:120px;' : '';
      // Helper for Lichess link
      function lichessUrl(moves) {
        // Remove move numbers and extra spaces
        const sanMoves = moves.replace(/\d+\.(\s*\.{3})?/g, '').replace(/\s+/g, ' ').trim();
        if (typeof window.Chess === 'function') {
          try {
            const chess = new window.Chess();
            sanMoves.split(' ').forEach(move => {
              if (move) chess.move(move);
            });
            const fen = chess.fen();
            return 'https://lichess.org/analysis/standard/' + encodeURIComponent(fen);
          } catch (e) {
            // fallback to SAN if something goes wrong
            return 'https://lichess.org/analysis/standard/' + encodeURIComponent(sanMoves);
          }
        } else {
          // fallback to SAN if chess.js is not loaded
          return 'https://lichess.org/analysis/standard/' + encodeURIComponent(sanMoves);
        }
      }
      // Build HTML for each
      if (bestWhite) {
        const percent = nonEmptyTags ? Math.round((bestWhite.score / nonEmptyTags) * 100) : 0;
        document.getElementById(cat.whiteDiv).innerHTML =
          `<div style='${spacing}margin:0; padding:0; text-indent:0;'>` +
          `<b>${cat.label}:</b><br>` +
          `<span>${bestWhite.opening.name}</span> <span style='color:#aaa;'>${bestWhite.opening.moves}</span><br>` +
          `<span style='color:#00ffe0;'>Compatibility: ${percent}%</span><br>` +
          `<a href='${lichessUrl(bestWhite.opening.moves)}' target='_blank' class='modern-btn' style='margin-top:8px; display:inline-block;'>View on Lichess</a>` +
          `</div>`;
      } else {
        document.getElementById(cat.whiteDiv).innerHTML =
          `<div style='${spacing}margin:0; padding:0; text-indent:0;'><b>${cat.label}:</b><br><span style='color:#ff6666;'>No suitable opening found.</span></div>`;
      }
      if (bestBlack) {
        const percent = nonEmptyTags ? Math.round((bestBlack.score / nonEmptyTags) * 100) : 0;
        document.getElementById(cat.blackDiv).innerHTML =
          `<div style='${spacing}margin:0; padding:0; text-indent:0;'>` +
          `<b>${cat.label}:</b><br>` +
          `<span>${bestBlack.opening.name}</span> <span style='color:#aaa;'>${bestBlack.opening.moves}</span><br>` +
          `<span style='color:#00ffe0;'>Compatibility: ${percent}%</span><br>` +
          `<a href='${lichessUrl(bestBlack.opening.moves)}' target='_blank' class='modern-btn' style='margin-top:8px; display:inline-block;'>View on Lichess</a>` +
          `</div>`;
      } else {
        document.getElementById(cat.blackDiv).innerHTML =
          `<div style='${spacing}margin:0; padding:0; text-indent:0;'><b>${cat.label}:</b><br><span style='color:#ff6666;'>No suitable opening found.</span></div>`;
      }
    });
    // Add spacing between opening containers (not just inside)
    // For White
    ['white-kings-pawn', 'white-queens-pawn', 'white-flank-pawn'].forEach((id, idx, arr) => {
      const el = document.getElementById(id);
      if (el) el.style.marginBottom = (idx < arr.length - 1) ? '48px' : '0';
    });
    // For Black
    ['black-kings-pawn', 'black-queens-pawn', 'black-flank-pawn'].forEach((id, idx, arr) => {
      const el = document.getElementById(id);
      if (el) el.style.marginBottom = (idx < arr.length - 1) ? '48px' : '0';
    });
  };
});

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
