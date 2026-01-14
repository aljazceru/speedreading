import Parsers from './parsers.js';
import Reader from './reader.js';

export default class App {
  constructor() {
    this.parsers = new Parsers();
    this.reader = new Reader();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupReaderCallbacks();
    this.loadSavedState();
    this.loadTheme();
  }

  setupEventListeners() {
    const textInput = document.getElementById('textInput');
    const fileInput = document.getElementById('fileInput');
    const startButton = document.getElementById('startReading');
    const themeToggle = document.getElementById('themeToggle');

    if (textInput) {
      textInput.addEventListener('input', () => this.validateInput());
    }

    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    }

    if (startButton) {
      startButton.addEventListener('click', () => this.startReading());
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateThemeButton();
    }
  }

  setupReaderCallbacks() {
    this.reader.onWordChange = (word) => this.displayWord(word);
    this.reader.onProgressChange = (percent, current, total) => this.updateProgress(percent, current, total);
    this.reader.onPlayStateChange = (isPlaying) => this.updatePlayButton(isPlaying);
  }

  validateInput() {
    const textInput = document.getElementById('textInput');
    const startButton = document.getElementById('startReading');
    if (startButton) {
      startButton.disabled = !textInput.value.trim();
    }
  }

  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const textInput = document.getElementById('textInput');
    const startButton = document.getElementById('startReading');
    const loadingIndicator = document.getElementById('loadingIndicator');

    const fileSizeMB = file.size / (1024 * 1024);
    const needsLoadingIndicator = fileSizeMB > 5;

    if (needsLoadingIndicator) {
      loadingIndicator.classList.remove('hidden');
    }

    try {
      let words;
      if (file.name.endsWith('.txt')) {
        words = await this.parsers.parseTextFile(file);
        textInput.value = words.join(' ');
      } else if (file.name.endsWith('.pdf')) {
        words = await this.parsers.parsePDF(file);
        textInput.value = words.join(' ');
      } else if (file.name.endsWith('.epub')) {
        words = await this.parsers.parseEPUB(file);
        textInput.value = words.join(' ');
      }

      if (needsLoadingIndicator) {
        loadingIndicator.classList.add('hidden');
      }

      this.validateInput();
    } catch (error) {
      if (needsLoadingIndicator) {
        loadingIndicator.classList.add('hidden');
      }
      alert('Error reading file: ' + error.message);
    }
  }

  async startReading() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();

    if (!text) return;

    const words = text.split(/\s+/).filter(word => word.length > 0);

    if (words.length === 0) return;

    this.reader.setWords(words);
    this.showReadingInterface();
    this.reader.play();
  }

  showReadingInterface() {
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="reader-interface">
        <div class="reader-controls-top">
          <button id="backButton" class="icon-button">←</button>
          <div class="wpm-control">
            <label for="wpmSlider">WPM</label>
            <input type="range" id="wpmSlider" min="200" max="1000" value="300" step="10">
            <span id="wpmValue">300</span>
          </div>
          <button id="themeToggle" class="theme-toggle">🌙</button>
        </div>

        <div class="word-display" id="wordDisplay">
          <span class="word"></span>
        </div>

        <div class="reader-controls-bottom">
          <div class="progress-container">
            <div class="progress-bar" id="progressBar"></div>
            <div class="progress-fill" id="progressFill"></div>
          </div>
          <div class="playback-controls">
            <button id="playPauseButton" class="play-button">▶</button>
          </div>
          <div class="position-info">
            <span id="positionInfo">0 / 0</span>
          </div>
        </div>
      </div>
    `;

    this.setupReadingInterfaceControls();
  }

  setupReadingInterfaceControls() {
    const wpmSlider = document.getElementById('wpmSlider');
    const wpmValue = document.getElementById('wpmValue');
    const playPauseButton = document.getElementById('playPauseButton');
    const progressBar = document.getElementById('progressBar');
    const backButton = document.getElementById('backButton');
    const wordDisplay = document.getElementById('wordDisplay');
    const themeToggle = document.getElementById('themeToggle');

    if (wpmSlider) {
      wpmSlider.addEventListener('input', (e) => {
        const wpm = parseInt(e.target.value);
        this.reader.setWPM(wpm);
        if (wpmValue) {
          wpmValue.textContent = wpm;
        }
      });

      wpmSlider.value = this.reader.wpm;
      if (wpmValue) {
        wpmValue.textContent = this.reader.wpm;
      }
    }

    if (playPauseButton) {
      playPauseButton.addEventListener('click', () => {
        this.reader.toggle();
      });
    }

    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        this.reader.jumpToProgress(percent);
      });
    }

    if (backButton) {
      backButton.addEventListener('click', () => {
        this.reader.pause();
        this.reader.saveState();
        this.showLandingInterface();
      });
    }

    if (wordDisplay) {
      wordDisplay.addEventListener('click', () => {
        this.reader.toggle();
      });
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateThemeButton();
    }

    window.addEventListener('beforeunload', () => {
      this.reader.saveState();
    });
  }

  showLandingInterface() {
    const app = document.getElementById('app');

    app.innerHTML = `
      <div class="landing">
        <div class="landing-header">
          <h1>Speed read any text. Choose a file or paste text to begin.</h1>
          <button id="themeToggle" class="theme-toggle">🌙</button>
        </div>
        <textarea id="textInput" rows="10" placeholder="Paste your text here..."></textarea>
        <div class="input-controls">
          <label class="file-picker">
            <input type="file" id="fileInput" accept=".txt,.pdf,.epub">
            Choose File
          </label>
          <button id="startReading" disabled>Start Reading</button>
        </div>
      </div>
    `;

    this.setupEventListeners();

    const savedState = localStorage.getItem('readingState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.text && state.text.length > 0) {
        document.getElementById('textInput').value = state.text.join(' ');
        this.validateInput();
      }
    }
  }

  displayWord(word) {
    const wordDisplay = document.getElementById('wordDisplay');
    if (wordDisplay) {
      const middleIndex = Math.floor(word.length / 2);
      const beforeMiddle = word.substring(0, middleIndex);
      const middleChar = word[middleIndex] || '';
      const afterMiddle = word.substring(middleIndex + 1);

      const offset = (middleIndex - (word.length - 1) / 2) * 0.6;
      const transform = `translateX(${offset}em)`;

      wordDisplay.innerHTML = `
        <span class="word" style="transform: ${transform}">${beforeMiddle}<span class="anchor">${middleChar}</span>${afterMiddle}</span>
      `;
    }
  }

  updateProgress(percent, current, total) {
    const progressFill = document.getElementById('progressFill');
    const positionInfo = document.getElementById('positionInfo');

    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }

    if (positionInfo) {
      positionInfo.textContent = `${current + 1} / ${total}`;
    }
  }

  updatePlayButton(isPlaying) {
    const playPauseButton = document.getElementById('playPauseButton');
    if (playPauseButton) {
      playPauseButton.textContent = isPlaying ? '⏸' : '▶';
    }
  }

  loadSavedState() {
    const hasState = this.reader.loadState();
    if (hasState && this.reader.words.length > 0) {
      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="landing">
          <div class="landing-header">
            <h1>Speed read any text. Choose a file or paste text to begin.</h1>
            <button id="themeToggle" class="theme-toggle">🌙</button>
          </div>
          <textarea id="textInput" rows="10" placeholder="Paste your text here..."></textarea>
          <div class="input-controls">
            <label class="file-picker">
              <input type="file" id="fileInput" accept=".txt,.pdf,.epub">
              Choose File
            </label>
            <button id="startReading">Resume Reading</button>
          </div>
        </div>
      `;
      this.setupEventListeners();
      document.getElementById('textInput').value = this.reader.words.join(' ');
      this.validateInput();
    }
  }

  toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeButton();
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    this.updateThemeButton();
  }

  updateThemeButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const currentTheme = document.body.getAttribute('data-theme');
      themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }
}

const app = new App();