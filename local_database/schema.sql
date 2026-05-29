PRAGMA foreign_keys = ON;

-- local_user_config: configuración del usuario
CREATE TABLE IF NOT EXISTS local_user_config (
    id INTEGER PRIMARY KEY,
    supabase_user_id TEXT, -- para sincronizar con remoto
    username TEXT,
    sound_enabled INTEGER DEFAULT 1,
    music_volume REAL DEFAULT 0.7,
    sfx_volume REAL DEFAULT 1.0,
    preferred_deck_id TEXT,
    last_sync_at TEXT -- ISO timestamp
);

-- Insertar configuración por defecto
INSERT INTO local_user_config (id, sound_enabled, music_volume, sfx_volume)
SELECT 1, 1, 0.7, 1.0
WHERE NOT EXISTS (SELECT 1 FROM local_user_config WHERE id = 1);

-- cached_cards: cache de las 120 cartas descargadas de PokéAPI
CREATE TABLE IF NOT EXISTS cached_cards (
    id INTEGER PRIMARY KEY,
    pokemon_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    image_url TEXT,
    type_primary TEXT,
    type_secondary TEXT,
    attack_points INTEGER,
    defense_points INTEGER,
    hp_points INTEGER,
    special_ability TEXT,
    special_ability_description TEXT,
    rarity TEXT,
    level INTEGER,
    raw_api_data TEXT, -- JSON completo
    cached_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_cached_cards_pokemon_id ON cached_cards(pokemon_id);

-- local_decks: copia local del mazo activo
CREATE TABLE IF NOT EXISTS local_decks (
    id INTEGER PRIMARY KEY,
    deck_id TEXT, -- UUID del mazo en Supabase
    name TEXT,
    card_ids TEXT, -- JSON array de IDs
    is_active INTEGER DEFAULT 0,
    last_modified TEXT
);

-- pve_matches: historial de partidas contra computadora
CREATE TABLE IF NOT EXISTS pve_matches (
    id INTEGER PRIMARY KEY,
    result TEXT NOT NULL, -- ('win' | 'loss' | 'draw')
    player_final_lp INTEGER,
    ai_final_lp INTEGER,
    total_turns INTEGER,
    duration_seconds INTEGER,
    deck_used TEXT, -- JSON snapshot del mazo usado
    ended_by TEXT,
    played_at TEXT NOT NULL
);

-- local_match_history: historial combinado (PvE + PvP)
CREATE TABLE IF NOT EXISTS local_match_history (
    id INTEGER PRIMARY KEY,
    match_type TEXT, -- ('pve' | 'pvp')
    opponent_name TEXT,
    result TEXT, -- ('win' | 'loss')
    turns INTEGER,
    played_at TEXT,
    synced_to_cloud INTEGER DEFAULT 0
);

-- temp_game_state: estado temporal de partida en curso
CREATE TABLE IF NOT EXISTS temp_game_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_type TEXT, -- ('pve' | 'pvp')
    room_id TEXT, -- nullable, solo pvp
    state_json TEXT NOT NULL,
    saved_at TEXT NOT NULL
);
