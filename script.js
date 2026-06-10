/* ══════════════════════════════════════════
   THE ARSH GAZETTE  |  script.js
   ══════════════════════════════════════════ */

// ── BIRTHDAY ─────────────────────────────
const BDAY = new Date('2009-06-10T00:00:00'); // ← change to Arsh's real date

// ══════════════════════════════════════════
// SOUND ENGINE
// ══════════════════════════════════════════
let audioCtx = null;
let muted = false;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone({ freq=440, type='sine', gain=0.15, duration=0.1, attack=0.01, detune=0 } = {}) {
  if (muted) return;
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env); env.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.detune.setValueAtTime(detune, ctx.currentTime);
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  } catch(e) {}
}

function playNoise({ gain=0.2, duration=0.08, freq=400, q=1 } = {}) {
  if (muted) return;
  try {
    const ctx = getAudio();
    const buf  = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random()*2-1) * (1-i/data.length);
    const src  = ctx.createBufferSource();
    const filt = ctx.createBiquadFilter();
    const env  = ctx.createGain();
    filt.type = 'bandpass'; filt.frequency.value = freq; filt.Q.value = q;
    env.gain.setValueAtTime(gain, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.buffer = buf; src.connect(filt); filt.connect(env); env.connect(ctx.destination);
    src.start();
  } catch(e) {}
}

const SFX = {
  // Press thud — low impact
  pressThud: () => {
    playNoise({ gain:0.5, duration:0.18, freq:60, q:0.4 });
    playTone({ freq:80, type:'sine', gain:0.3, duration:0.15, attack:0.005 });
  },
  // Paper rolling sound
  paperRoll: () => playNoise({ gain:0.12, duration:0.06, freq:1800, q:0.5 }),
  // Typewriter key
  typeKey: () => playNoise({ gain:0.08 + Math.random()*0.04, duration:0.04, freq:1200+Math.random()*800, q:1.5 }),
  // Typewriter carriage return
  carriageReturn: () => {
    playNoise({ gain:0.18, duration:0.12, freq:600, q:0.6 });
    setTimeout(() => playNoise({ gain:0.08, duration:0.08, freq:900, q:0.8 }), 80);
  },
  // Page flip / swoosh
  pageFlip: () => {
    playNoise({ gain:0.2, duration:0.12, freq:2400, q:0.7 });
    setTimeout(() => playNoise({ gain:0.1, duration:0.08, freq:1800, q:0.6 }), 60);
  },
  // Breaking news sting
  breakingStab: () => {
    playTone({ freq:880, type:'square', gain:0.2, duration:0.08, attack:0.002 });
    setTimeout(() => playTone({ freq:1108, type:'square', gain:0.18, duration:0.08, attack:0.002 }), 80);
    setTimeout(() => playTone({ freq:1320, type:'square', gain:0.22, duration:0.2, attack:0.002 }), 160);
  },
  // Number counter tick
  tick: () => playTone({ freq:700+Math.random()*300, type:'sine', gain:0.06, duration:0.03, attack:0.001 }),
  // Achievement chime
  chime: () => {
    [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone({ freq:f, type:'triangle', gain:0.14, duration:0.18, attack:0.01 }), i*90));
  },
  // Stamp sound
  stamp: () => {
    playNoise({ gain:0.4, duration:0.12, freq:200, q:0.5 });
    playTone({ freq:120, type:'sine', gain:0.25, duration:0.1, attack:0.003 });
  },
  // Confetti pop
  pop: () => playNoise({ gain:0.35, duration:0.1, freq:1400+Math.random()*600, q:1.2 }),
  // Button click (paper-like)
  click: () => playNoise({ gain:0.12, duration:0.04, freq:1000, q:2 }),
  // Finale fanfare — newspaper horn
  fanfare: () => {
    const melody = [523, 523, 659, 784, 784, 659, 523, 659, 784];
    const times  = [0, 180, 360, 540, 720, 900, 1080, 1260, 1440];
    melody.forEach((f,i) => setTimeout(() => playTone({ freq:f, type:'sawtooth', gain:0.15, duration:0.2, attack:0.01 }), times[i]));
  },
};

// Mute button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.createElement('button');
  btn.id = 'muteBtn';
  btn.textContent = '🔊';
  btn.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9999;background:rgba(14,12,10,0.7);border:1px solid #555;color:#ccc;font-size:14px;width:34px;height:34px;cursor:pointer;';
  btn.addEventListener('click', () => {
    muted = !muted;
    btn.textContent = muted ? '🔇' : '🔊';
    if (audioCtx) muted ? audioCtx.suspend() : audioCtx.resume();
  });
  document.body.appendChild(btn);
});

// ══════════════════════════════════════════
// PHASE MANAGER
// ══════════════════════════════════════════
function goTo(id) {
  document.querySelectorAll('.phase').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ══════════════════════════════════════════
// DATE HELPERS
// ══════════════════════════════════════════
function setupDates() {
  const now = new Date();
  const opts = { year:'numeric', month:'long', day:'numeric' };
  document.getElementById('todayDate').textContent = now.toLocaleDateString('en-GB', opts).toUpperCase();
  document.getElementById('todayDateShort').textContent = now.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

  const days  = Math.floor((now - BDAY) / 86400000);
  const hours = Math.floor((now - BDAY) / 3600000);
  animCount('fn-days', days, 1400);
  animCount('fn-hrs',  hours, 1800);
}

function animCount(id, target, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  let lastTick = 0;
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const val = Math.floor((1 - Math.pow(1-p, 3)) * target);
    el.textContent = val.toLocaleString();
    if (val !== lastTick && Math.random() < 0.4) SFX.tick();
    lastTick = val;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ══════════════════════════════════════════
// PHASE 1: PRINTING PRESS
// ══════════════════════════════════════════
const PRESS_MESSAGES = [
  'SETTING TYPE...', 'INKING PLATES...', 'LOADING PAPER...', 'RUNNING PRESS...', 'DRYING INK...', 'EDITION READY.'
];

function runPress() {
  const paper  = document.getElementById('pressPaper');
  const status = document.getElementById('pressStatus');
  let msgIdx   = 0;
  let paperH   = 0;

  const msgIv = setInterval(() => {
    status.textContent = PRESS_MESSAGES[msgIdx++];
    SFX.pressThud();
    if (msgIdx >= PRESS_MESSAGES.length) clearInterval(msgIv);
  }, 600);

  const paperIv = setInterval(() => {
    paperH = Math.min(paperH + 3, 120);
    paper.style.height = paperH + 'px';
    SFX.paperRoll();
    if (paperH >= 120) {
      clearInterval(paperIv);
      setTimeout(() => {
        flashScreen();
        setTimeout(() => {
          goTo('phase-paper');
          startNewspaper();
        }, 400);
      }, 500);
    }
  }, 40);
}

function flashScreen() {
  const fl = document.getElementById('pressFlash');
  fl.classList.add('on');
  SFX.breakingStab();
  setTimeout(() => fl.classList.remove('on'), 150);
}

// ══════════════════════════════════════════
// PHASE 2: NEWSPAPER CONTENT
// ══════════════════════════════════════════

// ── TICKER ──
const TICKER_ITEMS = [
  'ARSH TURNS 16 — WORLD REACTS WITH ADMIRATION  ◆  ',
  'EXPERTS CONFIRM: COOLNESS LEVELS REMAIN "OFF THE CHARTS"  ◆  ',
  'EYEWITNESSES REPORT BIRTHDAY BOY LOOKED "SUSPICIOUSLY UNBOTHERED"  ◆  ',
  'ANALYSTS PREDICT NEXT 16 YEARS WILL BE "EVEN BETTER"  ◆  ',
  'BREAKING: CAKE LOCATED. CANDLES BEING COUNTED. OFFICIALS CONFIRM: 16.  ◆  ',
  'LOCAL LEGEND REPORTEDLY "STILL HIMSELF" DESPITE REACHING LEGENDARY STATUS  ◆  ',
];

function startTicker() {
  const inner = document.getElementById('tickerInner');
  inner.textContent = TICKER_ITEMS.join('') + TICKER_ITEMS.join('');
}

// ── TYPEWRITER for headlines/body ──
function typeInto(el, text, speed=28, cb) {
  if (!el) { if(cb) cb(); return; }
  el.textContent = '';
  let i = 0;
  const iv = setInterval(() => {
    el.textContent += text[i++];
    if (text[i-1] && text[i-1] !== ' ' && text[i-1] !== '\n') SFX.typeKey();
    if (i % 40 === 0) SFX.carriageReturn();
    if (i >= text.length) { clearInterval(iv); if(cb) cb(); }
  }, speed);
}

// ── CONTENT ──
const CONTENT = {
  hl1: 'ARSH, 16, DECLARES\nYEAR OF NO LIMITS',

  lead: [
    `In a development described by close sources as "completely inevitable," Arsh today officially crossed the threshold into his sixteenth year — a milestone that observers say has been building since the very beginning.`,
    `"We always knew," said one unnamed insider. "The way he carries himself. The way he thinks. It was only a matter of time before the rest of the world caught up."`,
    `Analysts note that the transition from 15 to 16 appears to have been seamless — no adjustment period, no lag — suggesting that Arsh had, in fact, been operating at Level 16 capacity for quite some time.`,
  ],

  pullQuote: 'He didn\'t wait for permission. He never does.',

  hl2: 'Why Sixteen Is Just\nthe Opening Chapter',
  opinion: `The mistake most people make is treating 16 as a destination. It is not. It is a runway. The most interesting part of Arsh's story has not been written yet — and given what we have seen so far, this correspondent cannot wait to read it.`,

  hl3: 'Confirmed Attributes\nOn Record',
  traits: [
    'Thinks faster than most people talk',
    'Remembers things worth remembering',
    'Knows when to push and when to wait',
    'The kind of person a room changes around',
    'Refuses to be ordinary. Succeeds.',
    'Still himself — no matter the company',
  ],

  hl4: 'A Note From\nThe Editorial Board',
  editorial: `Every generation produces a few people who make everything around them more interesting. We do not distribute this distinction lightly. Arsh has earned it. Happy Birthday.`,

  bottomHl: '"This Is Only The Beginning," Says\nEveryone Who Knows Arsh',
};

function startNewspaper() {
  setupDates();
  startTicker();
  SFX.pageFlip();

  // Headline 1 — typewrite
  setTimeout(() => typeInto(document.getElementById('hl1'), CONTENT.hl1, 22, () => {
    SFX.chime();

    // Lead body paragraphs
    const leadDiv = document.getElementById('leadText');
    leadDiv.innerHTML = '';
    CONTENT.lead.forEach(t => {
      const p = document.createElement('p');
      leadDiv.appendChild(p);
      typeInto(p, t, 8);
    });

    // Pull quote
    setTimeout(() => {
      typeInto(document.getElementById('pq1'), CONTENT.pullQuote, 30);
    }, 800);

  }), 300);

  // Secondary headlines
  setTimeout(() => typeInto(document.getElementById('hl2'), CONTENT.hl2, 25), 900);
  setTimeout(() => typeInto(document.getElementById('opinText'), CONTENT.opinion, 7), 1400);

  setTimeout(() => typeInto(document.getElementById('hl3'), CONTENT.hl3, 25), 1000);
  setTimeout(() => buildTraits(), 1600);

  setTimeout(() => typeInto(document.getElementById('hl4'), CONTENT.hl4, 25), 1200);
  setTimeout(() => typeInto(document.getElementById('editText'), CONTENT.editorial, 8), 1800);

  // Bottom banner
  setTimeout(() => {
    const banner = document.getElementById('bottomBanner');
    banner.classList.add('visible');
    typeInto(document.getElementById('bh1'), CONTENT.bottomHl, 20);
    SFX.breakingStab();
  }, 3200);
}

function buildTraits() {
  const list = document.getElementById('traitList');
  list.innerHTML = '';
  CONTENT.traits.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'trait-item';
    div.textContent = t;
    div.style.animationDelay = (i * 0.12) + 's';
    list.appendChild(div);
    setTimeout(() => SFX.typeKey(), i * 120 + 100);
  });
}

document.getElementById('celebrateBtn').addEventListener('click', () => {
  SFX.click();
  const ink = document.getElementById('inkOverlay');
  ink.classList.add('flash');
  setTimeout(() => { ink.classList.remove('flash'); goTo('phase-finale'); startConfetti(); SFX.stamp(); setTimeout(() => SFX.fanfare(), 400); }, 350);
});

// ══════════════════════════════════════════
// PHASE 3: CONFETTI (paper scraps style)
// ══════════════════════════════════════════
let cfCanvas, cfCtx, cfPieces = [], cfRaf;

// Newspaper-style palette — ink, red, paper
const PAPER_COLORS = ['#0e0c0a','#b81c1c','#f4f0e6','#ede8d8','#6b6050','#2a2218'];

function startConfetti() {
  cfCanvas = document.getElementById('confettiCanvas');
  cfCtx    = cfCanvas.getContext('2d');
  cfCanvas.width  = window.innerWidth;
  cfCanvas.height = window.innerHeight;
  window.addEventListener('resize', () => { cfCanvas.width = window.innerWidth; cfCanvas.height = window.innerHeight; });

  cfPieces = [];
  let count = 0;

  function burst() {
    for (let i = 0; i < 14; i++) {
      cfPieces.push({
        x: Math.random() * cfCanvas.width,
        y: -10,
        w: Math.random() * 12 + 6,
        h: Math.random() * 6 + 3,
        rot: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 1,
        vr: (Math.random() - 0.5) * 0.15,
        color: PAPER_COLORS[Math.floor(Math.random() * PAPER_COLORS.length)],
        alpha:1,
      });
    }
    SFX.pop();
    count++;
    if (count < 30) setTimeout(burst, 120 + Math.random()*200);
  }
  burst();

  function draw() {
    cfCtx.clearRect(0, 0, cfCanvas.width, cfCanvas.height);
    cfPieces = cfPieces.filter(p => p.alpha > 0.05);
    for (const p of cfPieces) {
      cfCtx.save();
      cfCtx.globalAlpha = p.alpha;
      cfCtx.translate(p.x, p.y);
      cfCtx.rotate(p.rot);
      cfCtx.fillStyle = p.color;
      cfCtx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      cfCtx.restore();
      p.x  += p.vx; p.y += p.vy; p.rot += p.vr;
      p.vy += 0.05; p.alpha -= 0.005;
    }
    cfRaf = requestAnimationFrame(draw);
  }
  draw();
}

// ══════════════════════════════════════════
// REPLAY
// ══════════════════════════════════════════
document.getElementById('reprintBtn').addEventListener('click', () => {
  SFX.click();
  if (cfRaf) cancelAnimationFrame(cfRaf);
  cfPieces = [];
  if (cfCtx) cfCtx.clearRect(0, 0, cfCanvas.width, cfCanvas.height);

  // Reset press
  document.getElementById('pressPaper').style.height = '0px';
  document.getElementById('pressStatus').textContent = '';

  // Reset newspaper content
  ['hl1','hl2','hl3','hl4','bh1','pq1','leadText','opinText','editText'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  document.getElementById('traitList').innerHTML = '';
  document.getElementById('bottomBanner').classList.remove('visible');
  ['fn-days','fn-hrs'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '—'; });

  document.getElementById('inkOverlay').classList.remove('flash');
  goTo('phase-press');
  setTimeout(runPress, 200);
});

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  goTo('phase-press');
  setTimeout(runPress, 400);
});
