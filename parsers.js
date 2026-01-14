export default class Parsers {
  constructor() {
    this.init();
  }

  init() {
  }

  parseTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const words = content.split(/\s+/).filter(word => word.length > 0);
        resolve(words);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  async parsePDF(file) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    document.head.appendChild(script);

    await new Promise((resolve) => script.onload = resolve);

    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'pdf-loading';
    loadingIndicator.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:8px;z-index:9999;';
    loadingIndicator.textContent = 'Loading PDF...';

    const showLoading = () => {
      if (file.size > 5 * 1024 * 1024) {
        document.body.appendChild(loadingIndicator);
      }
    };

    const hideLoading = () => {
      const indicator = document.getElementById('pdf-loading');
      if (indicator) indicator.remove();
    };

    showLoading();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      let fullText = '';

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' ';
      }

      hideLoading();
      return fullText.trim().split(/\s+/);
    } catch (error) {
      hideLoading();
      throw error;
    }
  }

  async parseEPUB(file) {
    const jszipScript = document.createElement('script');
    jszipScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    document.head.appendChild(jszipScript);
    await new Promise((resolve) => jszipScript.onload = resolve);

    const epubScript = document.createElement('script');
    epubScript.src = 'https://unpkg.com/epubjs@0.3.93/dist/epub.min.js';
    document.head.appendChild(epubScript);
    await new Promise((resolve) => epubScript.onload = resolve);

    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'epub-loading';
    loadingIndicator.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:8px;z-index:9999;';
    loadingIndicator.textContent = 'Loading EPUB...';

    const showLoading = () => {
      if (file.size > 5 * 1024 * 1024) {
        document.body.appendChild(loadingIndicator);
      }
    };

    const hideLoading = () => {
      const indicator = document.getElementById('epub-loading');
      if (indicator) indicator.remove();
    };

    showLoading();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const book = window.ePub(arrayBuffer);
      let fullText = '';

      const sections = await book.loaded.spine.items;
      const sectionsList = Object.values(sections);

      for (const section of sectionsList) {
        const text = await section.load(book.load.bind(book));
        const sectionText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        fullText += sectionText + ' ';
      }

      hideLoading();
      return fullText.trim().split(/\s+/);
    } catch (error) {
      hideLoading();
      throw error;
    }
  }
}