export class CoinSystem {
    constructor() {
        this.coins = parseInt(localStorage.getItem('totalCoins')) || 0;
        this.ownedSkins = JSON.parse(localStorage.getItem('ownedSkins')) || [1];
        this.currentSkin = parseInt(localStorage.getItem('currentSkin')) || 1;
    }

    addCoins(amount) {
        this.coins += amount;
        this.save();
    }

    spendCoins(amount) {
        if (this.coins >= amount) {
            this.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    getCoins() {
        return this.coins;
    }

    addSkin(skinId) {
        if (!this.ownedSkins.includes(skinId)) {
            this.ownedSkins.push(skinId);
            this.save();
        }
    }

    hasSkin(skinId) {
        return this.ownedSkins.includes(skinId);
    }

    setCurrentSkin(skinId) {
        if (this.hasSkin(skinId)) {
            this.currentSkin = skinId;
            this.save();
            return true;
        }
        return false;
    }

    getCurrentSkin() {
        return this.currentSkin;
    }

    getOwnedSkins() {
        return this.ownedSkins;
    }

    save() {
        localStorage.setItem('totalCoins', this.coins.toString());
        localStorage.setItem('ownedSkins', JSON.stringify(this.ownedSkins));
        localStorage.setItem('currentSkin', this.currentSkin.toString());
    }
}
