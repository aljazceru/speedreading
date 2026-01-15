class Reader {
  constructor() {
    this.words = [];
    this.wpm = 300;
    this.wordsPerGroup = 1;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.rafId = null;
    this.onWordChange = null;
    this.onProgressChange = null;
    this.onPlayStateChange = null;
    this.onComplete = null;
    this.lastWordTime = 0;
  }

  setWords(words) {
    this.words = words;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.cancelAnimation();
  }

  setWordsPerGroup(num) {
    this.wordsPerGroup = Math.max(1, Math.min(5, num));
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastWordTime = performance.now();
    this.notifyPlayState(true);
    this.loop();
  }

  pause() {
    this.isPlaying = false;
    this.cancelAnimation();
    this.notifyPlayState(false);
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setWPM(wpm) {
    this.wpm = Math.max(200, Math.min(1000, wpm));
  }

  jumpToProgress(percent) {
    const newIndex = Math.floor((percent / 100) * this.words.length);
    this.currentIndex = Math.max(0, Math.min(this.words.length - 1, newIndex));
    this.notifyWordChange();
    this.notifyProgress();
  }

  cancelAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  loop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const delay = 60000 / this.wpm;

    if (now - this.lastWordTime >= delay) {
      this.currentIndex += this.wordsPerGroup;
      this.lastWordTime = now;

      if (this.currentIndex >= this.words.length) {
        this.pause();
        if (this.onComplete) this.onComplete();
        return;
      }

      this.notifyWordChange();
      this.notifyProgress();
    }

    this.rafId = requestAnimationFrame(() => this.loop());
  }

  notifyWordChange() {
    if (this.onWordChange && this.currentIndex < this.words.length) {
      const wordGroup = this.words.slice(this.currentIndex, this.currentIndex + this.wordsPerGroup);
      this.onWordChange(wordGroup);
    }
  }

  notifyProgress() {
    if (this.onProgressChange) {
      const percent = this.words.length > 0 ? (this.currentIndex / this.words.length) * 100 : 0;
      this.onProgressChange(percent, this.currentIndex, this.words.length);
    }
  }

  notifyPlayState(isPlaying) {
    if (this.onPlayStateChange) {
      this.onPlayStateChange(isPlaying);
    }
  }

  saveState() {
    try {
      const state = {
        text: this.words,
        position: this.currentIndex,
        wpm: this.wpm,
        wordsPerGroup: this.wordsPerGroup
      };
      localStorage.setItem('readingState', JSON.stringify(state));
    } catch (e) {
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('readingState');
      if (!saved) return false;
      const state = JSON.parse(saved);
      if (state.text && Array.isArray(state.text) && state.text.length > 0) {
        this.words = state.text;
        this.currentIndex = typeof state.position === 'number' ? state.position : 0;
        if (typeof state.wpm === 'number') {
          this.wpm = Math.max(200, Math.min(1000, state.wpm));
        }
        if (typeof state.wordsPerGroup === 'number') {
          this.wordsPerGroup = Math.max(1, Math.min(5, state.wordsPerGroup));
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}

export default Reader;
