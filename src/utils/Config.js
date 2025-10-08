export const GAME_CONFIG = {
    LANE_WIDTH: 2.5,
    NUM_LANES: 5,
    PLAYER_START_Z: 5,
    BASE_SPEED: 0.1,
    SPEED_INCREMENT: 0.00005,
    OBSTACLE_SPAWN_CHANCE: 0.02,
    MAX_OBSTACLES: 20,
    MIN_OBSTACLE_DISTANCE: 2.5,
    CAMERA_FOV: 75,
    CAMERA_POSITION: { x: 0, y: 5, z: 10 },
    FOG_NEAR: 10,
    FOG_FAR: 50,
    SHADOW_MAP_SIZE: 2048,
};

export const DIFFICULTY_LEVELS = {
    1: {
        name: 'EASY',
        nameJa: 'イージー',
        spawnChance: 0.012,
        maxObstacles: 12,
        speedMultiplier: 2.5,
        description: '初心者向け - 障害物が少なめ'
    },
    2: {
        name: 'NORMAL',
        nameJa: 'ノーマル',
        spawnChance: 0.02,
        maxObstacles: 18,
        speedMultiplier: 2.8,
        description: '標準的な難易度'
    },
    3: {
        name: 'HARD',
        nameJa: 'ハード',
        spawnChance: 0.03,
        maxObstacles: 25,
        speedMultiplier: 3.2,
        description: '上級者向け - 障害物が多い'
    },
    4: {
        name: 'EXPERT',
        nameJa: 'エキスパート',
        spawnChance: 0.04,
        maxObstacles: 30,
        speedMultiplier: 3.6,
        description: 'かなり難しい！'
    },
    5: {
        name: 'INSANE',
        nameJa: 'インセイン',
        spawnChance: 0.055,
        maxObstacles: 38,
        speedMultiplier: 4.0,
        description: '超上級者向け - 極限の難易度'
    }
};

export const GAME_MODES = {
    AVOID: {
        id: 'avoid',
        name: '障害物を避ける',
        description: '障害物を避けて進む'
    },
    COLLECT: {
        id: 'collect',
        name: 'コインを集める',
        description: 'コインを集めてスコアアップ'
    }
};

export const VISUAL_CONFIG = {
    PLAYER_COLOR: 0x00ff88,
    OBSTACLE_COLOR: 0xff0066,
    COIN_COLOR: 0xffd700,
    GROUND_COLOR: 0x1a1a2e,
    GRID_COLOR_1: 0x00ff88,
    GRID_COLOR_2: 0x444444,
    FOG_COLOR: 0x0f0f1e,
    PARTICLE_COLORS: [0x00ff88, 0xff0066, 0x00ccff, 0xffff00],
};

export const AUDIO_CONFIG = {
    MASTER_VOLUME: 0.5,
    SFX_VOLUME: 0.7,
    MUSIC_VOLUME: 0.3,
};
