import { getRandomSkin } from '../data/Skins.js';
import { CoinSystem } from './CoinSystem.js';

export class GachaSystem {
    constructor() {
        this.coinSystem = new CoinSystem();
        this.gachaCost = 250;
    }

    canRoll() {
        return this.coinSystem.getCoins() >= this.gachaCost;
    }

    roll() {
        if (!this.canRoll()) {
            return null;
        }

        if (this.coinSystem.spendCoins(this.gachaCost)) {
            const skin = getRandomSkin();
            
            const isNew = !this.coinSystem.hasSkin(skin.id);
            if (isNew) {
                this.coinSystem.addSkin(skin.id);
            }
            
            return {
                skin: skin,
                isNew: isNew
            };
        }
        
        return null;
    }

    getCoinSystem() {
        return this.coinSystem;
    }
}
