import { GameEngine } from './src/game/GameEngine.js';
import { DIFFICULTY_LEVELS } from './src/utils/Config.js';
import { GachaSystem } from './src/systems/GachaSystem.js';
import { SKINS } from './src/data/Skins.js';

let gameEngine;
let gachaSystem;
let selectedDifficulty = 2;
let selectedGameMode = 'avoid';
let historyInterval = null;
let historyCount = 0;

let keyBindings = {
    left: localStorage.getItem('key_left') || 'ArrowLeft',
    right: localStorage.getItem('key_right') || 'ArrowRight',
    pause: localStorage.getItem('key_pause') || 'p'
};

let isListeningForKey = null;

document.addEventListener('DOMContentLoaded', () => {
    gameEngine = new GameEngine();
    gachaSystem = new GachaSystem();
    
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const volumeControl = document.getElementById('volume-control');
    
    initCoinDisplay();
    initGameModeButtons();
    initDifficultyButtons();
    initGachaUI();
    initSkinsUI();
    initSecretCode();
    initHistoryTool();
    initPauseControls();
    initKeySettings();
    applyCurrentSkin();
    updateBackgroundForSkin();
    
    document.addEventListener('keydown', (e) => {
        if (isListeningForKey) return;
        
        if (e.key.toLowerCase() === keyBindings.pause.toLowerCase() || e.key === ' ') {
            e.preventDefault();
            gameEngine.togglePause();
        }
    });
    
    const setupGameModeButtons = (containerSelector) => {
        const buttons = document.querySelectorAll(`${containerSelector} .mode-btn`);
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedGameMode = btn.dataset.mode;
                gameEngine.setGameMode(selectedGameMode);
            });
        });
    };
    
    const setupDifficultyButtons = (containerSelector) => {
        const buttons = document.querySelectorAll(`${containerSelector} .difficulty-btn`);
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedDifficulty = parseInt(btn.dataset.level);
                gameEngine.setDifficulty(selectedDifficulty);
            });
        });
    };
    
    setupGameModeButtons('#start-screen');
    setupGameModeButtons('#game-over-screen');
    setupDifficultyButtons('#start-screen');
    setupDifficultyButtons('#game-over-screen');
    
    startButton?.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        hideGameMenuElements();
        gameEngine.start();
    });
    
    restartButton?.addEventListener('click', () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        hideGameMenuElements();
        gameEngine.restart();
    });
    
    volumeControl?.addEventListener('input', (e) => {
        const volume = parseFloat(e.target.value);
        gameEngine.audioManager.setMasterVolume(volume);
    });
});

function initCoinDisplay() {
    gameEngine.updateCoinDisplay();
    updateStartScreenCoins();
}

function updateStartScreenCoins() {
    const startCoinsElement = document.getElementById('start-coins');
    if (startCoinsElement) {
        startCoinsElement.textContent = gachaSystem.getCoinSystem().getCoins();
    }
}

function initGameModeButtons() {
    const gachaBtn = document.getElementById('gacha-menu-btn');
    const skinsBtn = document.getElementById('skins-menu-btn');
    const startGachaBtn = document.getElementById('start-gacha-btn');
    const startSkinsBtn = document.getElementById('start-skins-btn');
    
    gachaBtn?.addEventListener('click', () => {
        openGachaModal();
    });
    
    skinsBtn?.addEventListener('click', () => {
        openSkinsModal();
    });
    
    startGachaBtn?.addEventListener('click', () => {
        openGachaModal();
    });
    
    startSkinsBtn?.addEventListener('click', () => {
        openSkinsModal();
    });
}

function initDifficultyButtons() {
}

function initGachaUI() {
    const gachaRollBtn = document.getElementById('gacha-roll-btn');
    const closeGachaBtn = document.getElementById('close-gacha');
    
    gachaRollBtn?.addEventListener('click', () => {
        rollGacha();
    });
    
    closeGachaBtn?.addEventListener('click', () => {
        closeGachaModal();
    });
}

function openGachaModal() {
    const modal = document.getElementById('gacha-modal');
    const coinsElement = document.getElementById('gacha-coins');
    const resultElement = document.getElementById('gacha-result');
    
    if (coinsElement) {
        coinsElement.textContent = gachaSystem.getCoinSystem().getCoins();
    }
    
    resultElement?.classList.add('hidden');
    modal?.classList.remove('hidden');
}

function closeGachaModal() {
    const modal = document.getElementById('gacha-modal');
    modal?.classList.add('hidden');
}

function rollGacha() {
    const result = gachaSystem.roll();
    
    if (!result) {
        alert('コインが足りません！');
        return;
    }
    
    const resultElement = document.getElementById('gacha-result');
    const titleElement = document.getElementById('gacha-result-title');
    const skinElement = document.getElementById('gacha-result-skin');
    const coinsElement = document.getElementById('gacha-coins');
    
    if (titleElement) {
        titleElement.textContent = result.isNew ? '🎉 新しいスキン獲得！' : '⭐ 既に所持しています';
    }
    
    if (skinElement) {
        skinElement.textContent = result.skin.name;
        skinElement.className = `rarity-${result.skin.rarity}`;
    }
    
    if (coinsElement) {
        coinsElement.textContent = gachaSystem.getCoinSystem().getCoins();
    }
    
    resultElement?.classList.remove('hidden');
    gameEngine.updateCoinDisplay();
    updateStartScreenCoins();
    refreshSkinsUI();
}

function initSkinsUI() {
    const closeSkinsBtn = document.getElementById('close-skins');
    
    closeSkinsBtn?.addEventListener('click', () => {
        closeSkinsModal();
    });
}

function openSkinsModal() {
    const modal = document.getElementById('skins-modal');
    refreshSkinsUI();
    modal?.classList.remove('hidden');
}

function closeSkinsModal() {
    const modal = document.getElementById('skins-modal');
    modal?.classList.add('hidden');
}

function refreshSkinsUI() {
    const grid = document.getElementById('skins-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const coinSystem = gachaSystem.getCoinSystem();
    const currentSkin = coinSystem.getCurrentSkin();
    const ownedSkins = coinSystem.getOwnedSkins();
    
    SKINS.forEach(skin => {
        const isOwned = ownedSkins.includes(skin.id);
        const isSelected = currentSkin === skin.id;
        
        const skinItem = document.createElement('div');
        skinItem.className = `skin-item ${isSelected ? 'selected' : ''} ${!isOwned ? 'locked' : ''}`;
        
        const preview = document.createElement('div');
        preview.className = 'skin-preview';
        preview.style.backgroundColor = `#${skin.color.toString(16).padStart(6, '0')}`;
        
        const name = document.createElement('div');
        name.className = 'skin-name';
        name.textContent = isOwned ? skin.name : '🔒';
        
        const rarity = document.createElement('div');
        rarity.className = `skin-rarity rarity-${skin.rarity}`;
        rarity.textContent = skin.rarity.toUpperCase();
        
        skinItem.appendChild(preview);
        skinItem.appendChild(name);
        skinItem.appendChild(rarity);
        
        if (isOwned) {
            skinItem.addEventListener('click', () => {
                selectSkin(skin.id);
            });
        }
        
        grid.appendChild(skinItem);
    });
}

function selectSkin(skinId) {
    const coinSystem = gachaSystem.getCoinSystem();
    if (coinSystem.setCurrentSkin(skinId)) {
        refreshSkinsUI();
        applyCurrentSkin();
        updateBackgroundForSkin();
    }
}

function applyCurrentSkin() {
    const coinSystem = gachaSystem.getCoinSystem();
    const currentSkinId = coinSystem.getCurrentSkin();
    const skin = SKINS.find(s => s.id === currentSkinId);
    
    if (skin && gameEngine.player) {
        gameEngine.player.updateSkin(skin.color, skin.shape);
    }
}

function updateBackgroundForSkin() {
    const coinSystem = gachaSystem.getCoinSystem();
    const currentSkinId = coinSystem.getCurrentSkin();
    const skin = SKINS.find(s => s.id === currentSkinId);
    
    if (skin && skin.bgColor) {
        document.body.style.background = `linear-gradient(180deg, ${skin.bgColor} 0%, #0f0f1e 100%)`;
    } else {
        document.body.style.background = 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)';
    }
}

function initSecretCode() {
    const submitBtn = document.getElementById('submit-code');
    const codeInput = document.getElementById('secret-code');
    const startSubmitBtn = document.getElementById('start-submit-code');
    const startCodeInput = document.getElementById('start-secret-code');
    
    const checkCode = (input) => {
        const code = input?.value?.trim();
        if (code === 'nimono-dayo-0206') {
            openHistoryToolModal();
            if (input) input.value = '';
        } else {
            alert('コードが違います');
        }
    };
    
    submitBtn?.addEventListener('click', () => {
        checkCode(codeInput);
    });
    
    codeInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkCode(codeInput);
        }
    });
    
    startSubmitBtn?.addEventListener('click', () => {
        checkCode(startCodeInput);
    });
    
    startCodeInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkCode(startCodeInput);
        }
    });
}

function initHistoryTool() {
    const closeBtn = document.getElementById('close-history');
    const startBtn = document.getElementById('start-history');
    const stopBtn = document.getElementById('stop-history');
    
    closeBtn?.addEventListener('click', () => {
        closeHistoryToolModal();
        stopHistoryTool();
    });
    
    startBtn?.addEventListener('click', () => {
        startHistoryTool();
    });
    
    stopBtn?.addEventListener('click', () => {
        stopHistoryTool();
    });
}

function openHistoryToolModal() {
    const modal = document.getElementById('history-tool-modal');
    modal?.classList.remove('hidden');
}

function closeHistoryToolModal() {
    const modal = document.getElementById('history-tool-modal');
    modal?.classList.add('hidden');
    stopHistoryTool();
}

function startHistoryTool() {
    const baseUrl = window.location.href.split('?')[0];
    const title = document.getElementById('history-title')?.value?.trim() || 'ページ';
    const speed = parseInt(document.getElementById('history-speed')?.value || '100');
    const maxCount = parseInt(document.getElementById('history-count')?.value || '100');
    const statusElement = document.getElementById('history-status');
    
    stopHistoryTool();
    
    historyCount = 0;
    
    if (statusElement) {
        statusElement.textContent = '開始...';
    }
    
    historyInterval = setInterval(() => {
        if (historyCount >= maxCount) {
            stopHistoryTool();
            if (statusElement) {
                statusElement.textContent = `✓ 完了: ${historyCount} 回変更しました`;
            }
            return;
        }
        
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const newTitle = `${title} ${randomSuffix}`;
        const newUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}id=${randomSuffix}`;
        
        history.pushState({id: randomSuffix}, newTitle, newUrl);
        historyCount++;
        
        if (statusElement) {
            statusElement.textContent = `⏳ 実行中: ${historyCount} / ${maxCount}`;
        }
    }, speed);
}

function stopHistoryTool() {
    if (historyInterval) {
        clearInterval(historyInterval);
        historyInterval = null;
    }
}

function initPauseControls() {
    const resumeBtn = document.getElementById('resume-button');
    const settingsBtn = document.getElementById('settings-button');
    const backToStartFromPause = document.getElementById('back-to-start-from-pause');
    const backToStartFromGameOver = document.getElementById('back-to-start-from-gameover');
    
    resumeBtn?.addEventListener('click', () => {
        gameEngine.resume();
    });
    
    settingsBtn?.addEventListener('click', () => {
        openSettingsModal();
    });
    
    backToStartFromPause?.addEventListener('click', () => {
        returnToStartScreen();
    });
    
    backToStartFromGameOver?.addEventListener('click', () => {
        returnToStartScreen();
    });
}

function returnToStartScreen() {
    const pauseScreen = document.getElementById('pause-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startScreen = document.getElementById('start-screen');
    
    pauseScreen?.classList.add('hidden');
    gameOverScreen?.classList.add('hidden');
    startScreen?.classList.remove('hidden');
    
    gameEngine.gameRunning = false;
    gameEngine.gamePaused = false;
    gameEngine.audioManager.stopBackgroundMusic();
    gameEngine.obstacleManager.clear();
    gameEngine.coinManager.reset();
    gameEngine.particleSystem.clear();
    gameEngine.player.reset();
    
    showGameMenuElements();
}

function hideGameMenuElements() {
    const secretCodeInput = document.getElementById('secret-code-input');
    const gameMenuButtons = document.getElementById('game-menu-buttons');
    
    secretCodeInput?.classList.add('hidden');
    gameMenuButtons?.classList.add('hidden');
}

function showGameMenuElements() {
    const secretCodeInput = document.getElementById('secret-code-input');
    const gameMenuButtons = document.getElementById('game-menu-buttons');
    
    secretCodeInput?.classList.remove('hidden');
    gameMenuButtons?.classList.remove('hidden');
}

window.showGameMenuElements = showGameMenuElements;

function initKeySettings() {
    const closeBtn = document.getElementById('close-settings');
    const resetBtn = document.getElementById('reset-keys');
    const bindBtns = document.querySelectorAll('.key-bind-btn');
    
    updateKeyDisplays();
    
    closeBtn?.addEventListener('click', () => {
        closeSettingsModal();
    });
    
    resetBtn?.addEventListener('click', () => {
        keyBindings = {
            left: 'ArrowLeft',
            right: 'ArrowRight',
            pause: 'p'
        };
        localStorage.setItem('key_left', keyBindings.left);
        localStorage.setItem('key_right', keyBindings.right);
        localStorage.setItem('key_pause', keyBindings.pause);
        updateKeyDisplays();
    });
    
    bindBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            startKeyListen(action, btn);
        });
    });
}

function updateKeyDisplays() {
    const leftInput = document.getElementById('key-left');
    const rightInput = document.getElementById('key-right');
    const pauseInput = document.getElementById('key-pause');
    
    if (leftInput) leftInput.value = getKeyDisplayName(keyBindings.left);
    if (rightInput) rightInput.value = getKeyDisplayName(keyBindings.right);
    if (pauseInput) pauseInput.value = getKeyDisplayName(keyBindings.pause);
}

function getKeyDisplayName(key) {
    const displayNames = {
        'ArrowLeft': '← 左矢印',
        'ArrowRight': '→ 右矢印',
        'ArrowUp': '↑ 上矢印',
        'ArrowDown': '↓ 下矢印',
        ' ': 'スペース'
    };
    return displayNames[key] || key.toUpperCase();
}

function startKeyListen(action, button) {
    isListeningForKey = action;
    button.classList.add('listening');
    button.textContent = 'キーを押してください...';
    
    const keyListener = (e) => {
        e.preventDefault();
        
        if (e.key === 'Escape') {
            button.classList.remove('listening');
            button.textContent = '変更';
            isListeningForKey = null;
            document.removeEventListener('keydown', keyListener);
            return;
        }
        
        keyBindings[action] = e.key;
        localStorage.setItem(`key_${action}`, e.key);
        updateKeyDisplays();
        
        button.classList.remove('listening');
        button.textContent = '変更';
        isListeningForKey = null;
        document.removeEventListener('keydown', keyListener);
    };
    
    document.addEventListener('keydown', keyListener);
}

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal?.classList.remove('hidden');
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal?.classList.add('hidden');
}
