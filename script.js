// DOM refs
const fileUploader      = document.getElementById('fileUploader');
const uploadWrapper     = document.getElementById('uploadWrapper');
const musicCard         = document.getElementById('musicCard');
const audioPlayer       = document.getElementById('audioPlayer');
const cardTitle         = document.getElementById('cardTitle');
const cardSubtitle      = document.getElementById('cardSubtitle');
const playlistList      = document.getElementById('playlistList');
const playlistContainer = document.getElementById('playlistContainer');
const timeline          = document.getElementById('timeline');

const prevBtn           = document.getElementById('prevBtn');
const nextBtn           = document.getElementById('nextBtn');
const playPauseBtn      = document.getElementById('playPauseBtn');
const playIcon          = document.getElementById('playIcon');
const shuffleBtn        = document.getElementById('shuffleBtn');
const listBtn           = document.getElementById('listBtn');
const favBtn            = document.getElementById('favBtn');
const favIcon           = document.getElementById('favIcon');

let playlist     = [];
let currentTrack = 0;
let isPlaying    = false;
let isShuffled   = false;
let isFav        = false;

// Build playlist UI with drag-handle
function buildPlaylist() {
  playlistList.innerHTML = '';
  playlist.forEach((t, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;

    // 1) Drag handle
    const handle = document.createElement('span');
    handle.classList.add('drag-handle');
    handle.textContent = '☰';
    li.appendChild(handle);

    // 2) Track name
    const text = document.createElement('span');
    text.textContent = t.name;
    text.style.flex = '1';
    li.appendChild(text);

    // 3) Remove button
    const btn = document.createElement('button');
    btn.textContent = '×';
    btn.classList.add('remove-btn');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      removeTrack(i);
    });
    li.appendChild(btn);

    // 4) Click to load & play
    li.addEventListener('click', () => {
      loadTrack(i);
      playAudio();
    });

    playlistList.appendChild(li);
  });
}

// Initialize Sortable with handle
Sortable.create(playlistList, {
  animation: 150,
  forceFallback: true,
  fallbackOnBody: true,
  ghostClass: 'sortable-ghost',
  handle: '.drag-handle',
  onEnd: () => {
    const newOrder = [];
    playlistList.querySelectorAll('li').forEach(li => {
      newOrder.push(playlist[li.dataset.index]);
    });
    playlist = newOrder;
    buildPlaylist();
    loadTrack(0);
  }
});

// File selection
fileUploader.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  playlist = files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }));
  uploadWrapper.classList.add('hidden');
  musicCard.classList.remove('hidden');
  buildPlaylist();
  loadTrack(0);
  playAudio();
});

// Load track
function loadTrack(i) {
  if (i < 0 || i >= playlist.length) return;
  currentTrack = i;
  audioPlayer.src = playlist[i].url;
  cardTitle.textContent = playlist[i].name;
  cardSubtitle.textContent = 'Unknown Artist';
  timeline.value = 0;
  updateTimelineFill();
  isFav = false;
  updateFav();
}

// Play / Pause
function playAudio() {
  audioPlayer.play();
  isPlaying = true;
  playIcon.innerHTML = `<rect x="0" y="0" width="6" height="22"/><rect x="12" y="0" width="6" height="22"/>`;
  playPauseBtn.setAttribute('data-tooltip', 'Pause');
}
function pauseAudio() {
  audioPlayer.pause();
  isPlaying = false;
  playIcon.innerHTML = `<path d="M0 0v22l18-11z"/>`;
  playPauseBtn.setAttribute('data-tooltip', 'Play');
}
playPauseBtn.addEventListener('click', () => isPlaying ? pauseAudio() : playAudio());

// Prev / Next
prevBtn.addEventListener('click', () => {
  if (audioPlayer.currentTime > 3) {
    audioPlayer.currentTime = 0;
  } else {
    currentTrack = (currentTrack - 1 + playlist.length) % playlist.length;
    loadTrack(currentTrack);
    playAudio();
  }
});
nextBtn.addEventListener('click', () => {
  if (isShuffled) {
    currentTrack = Math.floor(Math.random() * playlist.length);
  } else {
    currentTrack = (currentTrack + 1) % playlist.length;
  }
  loadTrack(currentTrack);
  playAudio();
});

// Shuffle toggle
shuffleBtn.addEventListener('click', () => {
  isShuffled = !isShuffled;
  shuffleBtn.setAttribute('data-tooltip', isShuffled ? 'Shuffle On' : 'Shuffle Off');
  shuffleBtn.querySelector('svg').style.color = isShuffled ? 'var(--accent)' : '';
});

// Favorite toggle
favBtn.addEventListener('click', () => {
  isFav = !isFav;
  favBtn.setAttribute('data-tooltip', isFav ? 'Remove from Favorites' : 'Add to Favorites');
  updateFav();
});
function updateFav() {
  favIcon.setAttribute('fill', isFav ? '#FF4081' : 'none');
}

// Toggle playlist view
listBtn.addEventListener('click', () => {
  playlistContainer.classList.toggle('hidden');
});

// Remove track
function removeTrack(i) {
  playlist.splice(i, 1);
  if (!playlist.length) {
    location.reload();
    return;
  }
  if (i === currentTrack) {
    currentTrack = i % playlist.length;
    loadTrack(currentTrack);
  }
  buildPlaylist();
}

// Timeline sync & fill
audioPlayer.addEventListener('timeupdate', () => {
  if (audioPlayer.duration) {
    timeline.value = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    updateTimelineFill();
  }
});
function seek() {
  if (!audioPlayer.duration) return;
  audioPlayer.currentTime = (timeline.value / 100) * audioPlayer.duration;
  updateTimelineFill();
}
timeline.addEventListener('input', seek);
timeline.addEventListener('change', seek);
function updateTimelineFill() {
  timeline.style.setProperty('--percent', `${timeline.value}%`);
}

// Auto‐advance
audioPlayer.addEventListener('ended', () => nextBtn.click());
