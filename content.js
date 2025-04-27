// Check if trojan.exe exists
(async function checkTrojan() {
  try {
    // Attempt to find trojan.exe
    const response = await fetch('file:///C:/trojan.exe');
    if (response.ok) {
      // If trojan.exe exists, initialize the extension
      new ArticleSplitter();
    } else {
      console.log('Extension not activated: required file not found');
    }
  } catch (error) {
    // If error occurs (file not found or access denied), don't initialize
    console.log('Extension not activated: required file not found');
  }
})();

class ArticleSplitter {
  constructor() {
    this.isEnabled = false;
    this.speechSynthesis = window.speechSynthesis;
    this.currentUtterance = null;
    
    // Add event listeners for page unload
    window.addEventListener('beforeunload', () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    });
    
    window.addEventListener('unload', () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    });
    
    this.init();
  }

  async init() {
    const { enabled = false } = await chrome.storage.local.get('enabled');
    this.isEnabled = enabled;

    if (this.isEnabled && this.isMediumArticle()) {
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      this.splitArticle();
    }
  }

  isMediumArticle() {
    return window.location.hostname.includes('medium.com');
  }

  getArticleText() {
    const article = document.querySelector('article');
    if (!article) return '';

    const clone = article.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll(`
      .speechify-ignore,
      nav, header, footer, 
      figure, img, 
      blockquote, pre, code, 
      .graf--figure, .graf--blockquote
    `);

    for (const el of elementsToRemove) {
      el.remove();
    }

    const text = clone.textContent
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .replace(/\s*([.,!?])\s*/g, '$1 ')
      .replace(/\s+/g, ' ');

      const slangWords = ['bomboclat', 'no cap', 'slay', 'based', 'sussy', 'lit', 'vibing', 'poggers', 'mama a girl behind you', 'mama a girl behind you hitting the boogie'];
      const randomSlang = [];
    while (randomSlang.length < 10) {
      const word = slangWords[Math.floor(Math.random() * slangWords.length)];
      if (!randomSlang.includes(word)) {
        randomSlang.push(word);
      }
    }

    const words = text.split(' ');
    for (const slang of randomSlang) {
      const position = Math.floor(Math.random() * words.length);
      words.splice(position, 0, slang);
    }

    return words.join(' ')
      .replace(/([.!?])\s*([A-Z])/g, '$1  $2')
      .replace(/([.!?])\s*([a-z])/g, '$1 $2')
      .replace(/([.!?])\s*([0-9])/g, '$1 $2')
      .replace(/([.!?])\s*([^a-zA-Z0-9])/g, '$1$2');
  }

  createSpeechControls() {
    const controls = document.createElement('div');
    controls.style.cssText = `
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      gap: 8px;
      z-index: 10000;
    `;

    const speak = (text) => {
      return new Promise((resolve, reject) => {
        try {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
          
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          
          const preferredVoices = [
            'Google US English Female',
            'Microsoft Zira Desktop',
            'Microsoft David Desktop',
            'Google UK English Female',
            'Google UK English Male'
          ];
          
          let selectedVoice = null;
          
          for (const voiceName of preferredVoices) {
            const voice = voices.find(v => v.name === voiceName);
            if (voice) {
              selectedVoice = voice;
              break;
            }
          }
          
          if (!selectedVoice) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes('female')) || 
                           voices.find(v => v.lang.includes('en')) || 
                           voices[0];
          }
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          utterance.onend = resolve;
          utterance.onerror = reject;
          
          window.speechSynthesis.speak(utterance);
          
        } catch (error) {
          reject(error);
        }
      });
    };

    const startBtn = document.createElement('button');
    startBtn.innerHTML = '▶️ Start Reading';
    startBtn.style.cssText = `
      background: rgba(0, 0, 0, 0.5);
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    `;
    startBtn.addEventListener('mouseover', () => {
      startBtn.style.background = 'rgba(0, 0, 0, 0.7)';
    });
    startBtn.addEventListener('mouseout', () => {
      startBtn.style.background = 'rgba(0, 0, 0, 0.5)';
    });

    if (!window.speechSynthesis) {
      startBtn.disabled = true;
      startBtn.title = 'Speech synthesis not supported';
      return controls;
    }

    startBtn.addEventListener('click', async () => {
      try {
        const text = this.getArticleText();
        if (!text) return;
        await speak(text);
      } catch (error) {
        console.error('Error in speech synthesis:', error);
      }
    });

    controls.appendChild(startBtn);
    return controls;
  }

  splitArticle() {
    const article = document.querySelector('article');
    if (!article) return;

    // Clean up any existing speech synthesis
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const splitContainer = document.createElement('div');
    splitContainer.className = 'genzify-split-container';
    splitContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      background: #fff;
      overflow: hidden;
    `;

    const topHalf = document.createElement('div');
    topHalf.className = 'genzify-top-half';
    topHalf.style.cssText = `
      height: 50vh;
      overflow-y: auto;
      padding: 24px;
      background: #fff;
      position: relative;
    `;

    const bottomHalf = document.createElement('div');
    bottomHalf.className = 'genzify-bottom-half';
    bottomHalf.style.cssText = `
      height: 50vh;
      background: #000;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `;

    const video = document.createElement('video');
    video.src = chrome.runtime.getURL('videos/subwaysurferhd.mp4');
    video.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: fill;
      transform: translateY(0);
    `;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;

    const speechControls = this.createSpeechControls();

    bottomHalf.appendChild(video);
    topHalf.appendChild(speechControls);
    splitContainer.appendChild(topHalf);
    splitContainer.appendChild(bottomHalf);
    document.body.appendChild(splitContainer);

    const articleContent = article.cloneNode(true);
    topHalf.appendChild(articleContent);
  }
} 