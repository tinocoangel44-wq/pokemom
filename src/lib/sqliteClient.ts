// @ts-nocheck
import initSqlJs from 'sql.js';
import { supabase } from './supabaseClient';

const WASM_PATH = '/sql-wasm.wasm'; // Ajusta esta ruta según donde guardaste el archivo en el paso anterior
const DB_STORAGE_KEY = 'pokecardgame_local_db';

let db = null;
let SQL = null;

export async function initDatabase() {
  if (db) return db;
  try {
    SQL = await initSqlJs({ locateFile: () => WASM_PATH });
    const savedDb = localStorage.getItem(DB_STORAGE_KEY);
    
    if (savedDb) {
      const binaryArray = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
      db = new SQL.Database(binaryArray);
      console.log('[SQLite] Base de datos cargada desde localStorage.');
    } else {
      db = new SQL.Database();
      console.log('[SQLite] Nueva base de datos creada.');
      db.run('PRAGMA journal_mode=WAL;');
      db.run('PRAGMA foreign_keys=ON;');
    }
    
    await createTables();
    
    
    try {
      db.run("ALTER TABLE cached_cards ADD COLUMN pre_evolution_name TEXT DEFAULT NULL;");
      console.log('[SQLite] Columna pre_evolution_name añadida a cached_cards.');
    } catch(e) {
      // La columna ya existe
    }
    
    try {
      const updates = `
UPDATE cached_cards SET pre_evolution_name = 'Charmeleon', level = 3 WHERE LOWER(name) = 'charizard';
UPDATE cached_cards SET pre_evolution_name = 'Charmander', level = 2 WHERE LOWER(name) = 'charmeleon';
UPDATE cached_cards SET pre_evolution_name = 'Wartortle', level = 3 WHERE LOWER(name) = 'blastoise';
UPDATE cached_cards SET pre_evolution_name = 'Squirtle', level = 2 WHERE LOWER(name) = 'wartortle';
UPDATE cached_cards SET pre_evolution_name = 'Ivysaur', level = 3 WHERE LOWER(name) = 'venusaur';
UPDATE cached_cards SET pre_evolution_name = 'Bulbasaur', level = 2 WHERE LOWER(name) = 'ivysaur';
UPDATE cached_cards SET pre_evolution_name = 'Sprigatito', level = 2 WHERE LOWER(name) = 'floragato';
UPDATE cached_cards SET pre_evolution_name = 'Floragato', level = 3 WHERE LOWER(name) = 'meowscarada';
UPDATE cached_cards SET pre_evolution_name = 'Fuecoco', level = 2 WHERE LOWER(name) = 'crocalor';
UPDATE cached_cards SET pre_evolution_name = 'Crocalor', level = 3 WHERE LOWER(name) = 'skeledirge';
UPDATE cached_cards SET pre_evolution_name = 'Quaxly', level = 2 WHERE LOWER(name) = 'quaxwell';
UPDATE cached_cards SET pre_evolution_name = 'Quaxwell' WHERE LOWER(name) = 'quaquaval';
UPDATE cached_cards SET pre_evolution_name = 'Lechonk' WHERE LOWER(name) = 'oinkologne';
UPDATE cached_cards SET pre_evolution_name = 'Tarountula' WHERE LOWER(name) = 'spidops';
UPDATE cached_cards SET pre_evolution_name = 'Nymble' WHERE LOWER(name) = 'lokix';
UPDATE cached_cards SET pre_evolution_name = 'Pawmi' WHERE LOWER(name) = 'pawmo';
UPDATE cached_cards SET pre_evolution_name = 'Pawmo' WHERE LOWER(name) = 'pawmot';
UPDATE cached_cards SET pre_evolution_name = 'Tandemaus' WHERE LOWER(name) = 'maushold';
UPDATE cached_cards SET pre_evolution_name = 'Fidough' WHERE LOWER(name) = 'dachsbun';
UPDATE cached_cards SET pre_evolution_name = 'Smoliv' WHERE LOWER(name) = 'dolliv';
UPDATE cached_cards SET pre_evolution_name = 'Dolliv' WHERE LOWER(name) = 'arboliva';
UPDATE cached_cards SET pre_evolution_name = 'Nacli' WHERE LOWER(name) = 'naclstack';
UPDATE cached_cards SET pre_evolution_name = 'Naclstack' WHERE LOWER(name) = 'garganacl';
UPDATE cached_cards SET pre_evolution_name = 'Charcadet' WHERE LOWER(name) = 'armarouge';
UPDATE cached_cards SET pre_evolution_name = 'Charcadet' WHERE LOWER(name) = 'ceruledge';
UPDATE cached_cards SET pre_evolution_name = 'Tadbulb' WHERE LOWER(name) = 'bellibolt';
UPDATE cached_cards SET pre_evolution_name = 'Wattrel' WHERE LOWER(name) = 'kilowattrel';
UPDATE cached_cards SET pre_evolution_name = 'Maschiff' WHERE LOWER(name) = 'mabosstiff';
UPDATE cached_cards SET pre_evolution_name = 'Shroodle' WHERE LOWER(name) = 'grafaiai';
UPDATE cached_cards SET pre_evolution_name = 'Bramblin' WHERE LOWER(name) = 'brambleghast';
UPDATE cached_cards SET pre_evolution_name = 'Toedscool' WHERE LOWER(name) = 'toedscruel';
UPDATE cached_cards SET pre_evolution_name = 'Capsakid' WHERE LOWER(name) = 'scovillain';
UPDATE cached_cards SET pre_evolution_name = 'Rellor' WHERE LOWER(name) = 'rabsca';
UPDATE cached_cards SET pre_evolution_name = 'Flittle' WHERE LOWER(name) = 'espathra';
UPDATE cached_cards SET pre_evolution_name = 'Tinkatink' WHERE LOWER(name) = 'tinkatuff';
UPDATE cached_cards SET pre_evolution_name = 'Tinkatuff' WHERE LOWER(name) = 'tinkaton';
UPDATE cached_cards SET pre_evolution_name = 'Wiglett' WHERE LOWER(name) = 'wugtrio';
UPDATE cached_cards SET pre_evolution_name = 'Finizen' WHERE LOWER(name) = 'palafin';
UPDATE cached_cards SET pre_evolution_name = 'Varoom' WHERE LOWER(name) = 'revavroom';
UPDATE cached_cards SET pre_evolution_name = 'Glimmet' WHERE LOWER(name) = 'glimmora';
UPDATE cached_cards SET pre_evolution_name = 'Greavard' WHERE LOWER(name) = 'houndstone';
UPDATE cached_cards SET pre_evolution_name = 'Cetoddle' WHERE LOWER(name) = 'cetitan';
UPDATE cached_cards SET pre_evolution_name = 'Primeape' WHERE LOWER(name) = 'annihilape';
UPDATE cached_cards SET pre_evolution_name = 'Wooper' WHERE LOWER(name) = 'clodsire';
UPDATE cached_cards SET pre_evolution_name = 'Girafarig' WHERE LOWER(name) = 'farigiraf';
UPDATE cached_cards SET pre_evolution_name = 'Dunsparce' WHERE LOWER(name) = 'dudunsparce';
UPDATE cached_cards SET pre_evolution_name = 'Bisharp' WHERE LOWER(name) = 'kingambit';
UPDATE cached_cards SET pre_evolution_name = 'Frigibax' WHERE LOWER(name) = 'arctibax';
UPDATE cached_cards SET pre_evolution_name = 'Arctibax' WHERE LOWER(name) = 'baxcalibur';
UPDATE cached_cards SET pre_evolution_name = 'Gimmighoul' WHERE LOWER(name) = 'gholdengo';
UPDATE cached_cards SET pre_evolution_name = 'Applin' WHERE LOWER(name) = 'dipplin';
UPDATE cached_cards SET pre_evolution_name = 'Poltchageist' WHERE LOWER(name) = 'sinistcha';
UPDATE cached_cards SET pre_evolution_name = 'Duraludon' WHERE LOWER(name) = 'archaludon';
UPDATE cached_cards SET pre_evolution_name = 'Dipplin' WHERE LOWER(name) = 'hydrapple';
`;
      const updateLines = updates.split(';').map(l => l.trim()).filter(l => l.length > 0);
      for (const line of updateLines) {
        db.run(line);
      }
      console.log('[SQLite] 48 filas de evoluciones actualizadas localmente.');
      saveDatabase(); // Ensure the updates are physically saved
    } catch(e) {
      console.error('[SQLite] Error actualizando evoluciones', e);
    }

    try {
      db.run("ALTER TABLE cached_cards ADD COLUMN card_category TEXT DEFAULT 'pokemon';");
      console.log('[SQLite] Columna card_category añadida a cached_cards.');
    } catch(e) {
      // Si falla, significa que la columna ya existe, lo cual es normal.
    }
    
    insertTrainerCards();
    
    saveDatabase();
    return db;
  } catch (error) {
    console.error('[SQLite] Error al inicializar:', error);
    throw error;
  }
}

export function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    
    // Convertir a base64 de manera segura sin reventar el Call Stack
    let binary = '';
    const CHUNK_SIZE = 8192;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(null, data.subarray(i, i + CHUNK_SIZE));
    }
    
    const base64 = btoa(binary);
    localStorage.setItem(DB_STORAGE_KEY, base64);
  } catch (error) {
    console.error('[SQLite] Error al guardar:', error);
  }
}

async function createTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS local_user_config (
      id INTEGER PRIMARY KEY, supabase_user_id TEXT, username TEXT, sound_enabled INTEGER DEFAULT 1, music_volume REAL DEFAULT 0.7, sfx_volume REAL DEFAULT 1.0, preferred_deck_id TEXT, last_sync_at TEXT
    );
    CREATE TABLE IF NOT EXISTS cached_cards (
      id INTEGER PRIMARY KEY, pokemon_id INTEGER UNIQUE NOT NULL, name TEXT NOT NULL, image_url TEXT, type_primary TEXT, type_secondary TEXT, attack_points INTEGER, defense_points INTEGER, hp_points INTEGER, special_ability TEXT, special_ability_description TEXT, rarity TEXT, level INTEGER, raw_api_data TEXT, cached_at TEXT DEFAULT (datetime('now')), card_category TEXT DEFAULT 'pokemon'
    );
    CREATE TABLE IF NOT EXISTS local_decks (
      id INTEGER PRIMARY KEY, deck_id TEXT, name TEXT, card_ids TEXT, is_active INTEGER DEFAULT 0, last_modified TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS pve_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT, result TEXT NOT NULL CHECK(result IN ('win', 'loss', 'draw')), player_final_lp INTEGER, ai_final_lp INTEGER, total_turns INTEGER, duration_seconds INTEGER, deck_used TEXT, ended_by TEXT, played_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS local_match_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT, match_type TEXT CHECK(match_type IN ('pve', 'pvp')), opponent_name TEXT, result TEXT CHECK(result IN ('win', 'loss', 'draw')), turns INTEGER, played_at TEXT DEFAULT (datetime('now')), synced_to_cloud INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS temp_game_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT, game_type TEXT NOT NULL CHECK(game_type IN ('pve', 'pvp')), room_id TEXT, state_json TEXT NOT NULL, saved_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_cached_cards_pokemon_id ON cached_cards(pokemon_id);
    CREATE INDEX IF NOT EXISTS idx_pve_matches_played_at ON pve_matches(played_at DESC);
    CREATE INDEX IF NOT EXISTS idx_local_history_played_at ON local_match_history(played_at DESC);
    INSERT OR IGNORE INTO local_user_config (id, sound_enabled, music_volume, sfx_volume) VALUES (1, 1, 0.7, 1.0);
  `;
  db.run(schema);
  saveDatabase();
  console.log('[SQLite] Tablas creadas exitosamente.');
}

export function queryAll(query: string, params: any[] = []) {
  if (!db) throw new Error('[SQLite] Base de datos no inicializada.');
  const stmt = db.prepare(query);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

export function execute(query: string, params: any[] = []) {
  if (!db) throw new Error('[SQLite] Base de datos no inicializada.');
  db.run(query, params);
  saveDatabase();
  return { changes: db.getRowsModified(), lastInsertRowId: queryAll('SELECT last_insert_rowid() as id')[0]?.id };
}

export function getUserConfig() { return queryAll('SELECT * FROM local_user_config WHERE id = 1')[0] || null; }
export function updateUserConfig(config) {
  const { supabase_user_id, username, sound_enabled, music_volume, sfx_volume, preferred_deck_id } = config;
  execute(`UPDATE local_user_config SET supabase_user_id = COALESCE(?, supabase_user_id), username = COALESCE(?, username), sound_enabled = COALESCE(?, sound_enabled), music_volume = COALESCE(?, music_volume), sfx_volume = COALESCE(?, sfx_volume), preferred_deck_id = COALESCE(?, preferred_deck_id), last_sync_at = datetime('now') WHERE id = 1`, [supabase_user_id, username, sound_enabled, music_volume, sfx_volume, preferred_deck_id]);
}
export function savePvEMatch(matchData) {
  const { result, player_final_lp, ai_final_lp, total_turns, duration_seconds, deck_used, ended_by } = matchData;
  const insertResult = execute(`INSERT INTO pve_matches (result, player_final_lp, ai_final_lp, total_turns, duration_seconds, deck_used, ended_by) VALUES (?, ?, ?, ?, ?, ?, ?)`, [result, player_final_lp, ai_final_lp, total_turns, duration_seconds, JSON.stringify(deck_used), ended_by]);
  execute(`INSERT INTO local_match_history (match_type, opponent_name, result, turns) VALUES ('pve', 'Computadora', ?, ?)`, [result, total_turns]);
  return insertResult;
}
export function getPvEHistory(limit = 50) { return queryAll('SELECT * FROM pve_matches ORDER BY played_at DESC LIMIT ?', [limit]); }
export function cacheCards(cards: any[]) {
  const insertCard = db.prepare(`INSERT OR REPLACE INTO cached_cards (pokemon_id, name, image_url, type_primary, type_secondary, attack_points, defense_points, hp_points, special_ability, special_ability_description, rarity, level, pre_evolution_name, raw_api_data, card_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pokemon')`);
  db.run('BEGIN TRANSACTION;');
  try {
    cards.forEach(c => insertCard.run([c.pokemon_id, c.name, c.image_url, c.type_primary, c.type_secondary, c.attack_points, c.defense_points, c.hp_points, c.special_ability, c.special_ability_description, c.rarity, c.level, c.pre_evolution_name || null, JSON.stringify(c.rawData || {})]));
    db.run('COMMIT;');
    saveDatabase();
  } catch (error) {
    db.run('ROLLBACK;');
    throw error;
  } finally {
    insertCard.free();
  }
}

export async function insertTrainerCards() {
  execute(`DELETE FROM cached_cards WHERE card_category = 'trainer'`);

  const trainerCards = [
    // 18 Cartas de Buff por Tipo
    { id: 10001, name: 'Volcán Activo', image: '/volcan_activo_1779846060473.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Aumenta el ATK de todos tus Pokémon de tipo Fuego en 400.' },
    { id: 10002, name: 'Océano Profundo', image: '/oceano_profundo_1779846073233.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Aumenta el ATK y DEF de todos tus Pokémon de tipo Agua en 200.' },
    { id: 10003, name: 'Bosque Milenario', image: '/bosque_milenario_1779846085648.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Los Pokémon de tipo Planta recuperan 200 HP en cada Standby Phase.' },
    { id: 10004, name: 'Central de Energía', image: '/central_energia_1779846100799.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Aumenta el ATK de todos tus Pokémon de tipo Eléctrico en 300 y reduce la DEF del rival en 100.' },
    { id: 10005, name: 'Llanura Serena', image: '/llanura_serena_1779846115766.png', rarity: 'uncommon', ability: 'Magia de Campo', desc: 'Aumenta el HP máximo de todos tus Pokémon de tipo Normal en 500.' },
    { id: 10006, name: 'Cielos Tempestuosos', image: '/cielos_tempestuosos_1779846128788.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Los ataques de tus Pokémon de tipo Volador infligen 200 de daño adicional.' },
    { id: 10007, name: 'Enjambre Feroz', image: '/enjambre_feroz_1779846143918.png', rarity: 'uncommon', ability: 'Magia Continua', desc: 'Aumenta el ATK de tus Pokémon Bicho en 100 por cada Pokémon Bicho en tu campo.' },
    { id: 10008, name: 'Pantano Tóxico', image: '/pantano_toxico_1779846191429.png', rarity: 'rare', ability: 'Magia Continua', desc: 'Inflige 100 de daño directo al rival cada turno si tienes un Pokémon Veneno.' },
    { id: 10009, name: 'Cañón Árido', image: '/canon_arido_1779846204349.png', rarity: 'uncommon', ability: 'Magia de Campo', desc: 'Aumenta la DEF de tus Pokémon de tipo Tierra en 500.' },
    { id: 10010, name: 'Cordillera Inquebrantable', image: '/cordillera_inquebrantable_1779846216405.png', rarity: 'uncommon', ability: 'Magia de Campo', desc: 'Los Pokémon de tipo Roca reciben 200 menos de daño en combate.' },
    { id: 10011, name: 'Fortaleza Metálica', image: '/fortaleza_metalica_1779846243206.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Aumenta la DEF de tus Pokémon de tipo Acero en 400 y el ATK en 200.' },
    { id: 10012, name: 'Dojo de Combate', image: '/dojo_combate_1779846257539.png', rarity: 'uncommon', ability: 'Magia de Campo', desc: 'Aumenta el ATK de tus Pokémon de tipo Lucha en 500.' },
    { id: 10013, name: 'Glaciar Eterno', image: '/glaciar_eterno_1779846271551.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Reduce el ATK de los Pokémon del rival en 200 si tienes un Pokémon Hielo.' },
    { id: 10014, name: 'Dimensión Mental', image: '/dimension_mental_1779846283450.png', rarity: 'rare', ability: 'Magia Continua', desc: 'Puedes robar 1 carta extra en tu Draw Phase si controlas un Pokémon Psíquico.' },
    { id: 10015, name: 'Cementerio de Almas', image: '/cementerio_almas_1779846298070.png', rarity: 'uncommon', ability: 'Magia de Campo', desc: 'Aumenta el ATK de tus Pokémon Fantasma en 300.' },
    { id: 10016, name: 'Valle Oscuro', image: '/valle_oscuro_1779846309432.png', rarity: 'uncommon', ability: 'Magia de Campo', desc: 'Aumenta el ATK de tus Pokémon Siniestros en 400.' },
    { id: 10017, name: 'Nido de Dragones', image: '/nido_dragones_1779909262031.png', rarity: 'legendary', ability: 'Magia de Campo', desc: 'Aumenta el ATK y HP de tus Pokémon de tipo Dragón en 300.' },
    { id: 10018, name: 'Jardín Místico', image: '/jardin_mistico_1779909276582.png', rarity: 'rare', ability: 'Magia de Campo', desc: 'Restaura 300 HP a tus Pokémon Hada cada turno.' },

    // 5 Discard/Destroy
    { id: 10019, name: 'Muñeco Maldito', image: '/muneco_maldito_1779909289718.png', rarity: 'rare', ability: 'Magia Normal', desc: 'Inflige 500 puntos de daño directo al rival.' },
    { id: 10020, name: 'Semilla Drenadora', image: '/semilla_drenadora_1779909302406.png', rarity: 'uncommon', ability: 'Magia Rápida', desc: 'Al ir al Descarte, reduce el ATK del monstruo activo del rival en 300 permanentemente.' },
    { id: 10021, name: 'Caja Sorpresa Voltorb', image: '/caja_sorpresa_voltorb_1779909314603.png', rarity: 'rare', ability: 'Magia Normal', desc: 'Destruye al Pokémon con mayor ATK del rival.' },
    { id: 10022, name: 'Venganza Espectral', image: '/venganza_espectral_1779909328091.png', rarity: 'legendary', ability: 'Magia Normal', desc: 'Revive a un Pokémon de tu Descarte inmediatamente con la mitad de su HP máximo.' },
    { id: 10023, name: 'Polvo Sombrío', image: '/polvo_sombrio_1779909341453.png', rarity: 'uncommon', ability: 'Magia Rápida', desc: 'Si esta carta es descartada, el rival debe descartar 1 carta de su mano al azar.' },

    // 7 Staples
    { id: 10024, name: 'Investigación del Profesor', image: '/investigacion_profesor_1779909360287.png', rarity: 'legendary', ability: 'Magia Normal', desc: 'Roba 2 cartas de tu mazo.' },
    { id: 10025, name: 'Rayo Fulminante', image: '/rayo_fulminante_1779909373532.png', rarity: 'legendary', ability: 'Magia Normal', desc: 'Destruye todos los Pokémon en el campo del rival.' },
    { id: 10026, name: 'Agujero Dimensional', image: '/agujero_dimensional_1779909391352.png', rarity: 'legendary', ability: 'Magia Normal', desc: 'Destruye todos los Pokémon en el campo (tuyos y del rival).' },
    { id: 10027, name: 'Ceniza Sagrada', image: '/ceniza_sagrada_1779909403974.png', rarity: 'legendary', ability: 'Magia Normal', desc: 'Invoca de forma especial un Pokémon de tu Descarte a tu zona activa o banca.' },
    { id: 10028, name: 'Pantalla de Luz', image: '/pantalla_luz_1779909417689.png', rarity: 'rare', ability: 'Trampa', desc: 'Cuando el rival declara un ataque, destruye al Pokémon atacante.' },
    { id: 10029, name: 'Viento Huracanado', image: '/viento_huracanado_1779909431545.png', rarity: 'uncommon', ability: 'Magia Rápida', desc: 'Destruye 1 carta Mágica o de Trampa en el campo.' },
    { id: 10030, name: 'Llamado del Alto Mando', image: '/llamado_alto_mando_1779909447406.png', rarity: 'rare', ability: 'Trampa', desc: 'El rival no puede declarar ataques este turno.' }
  ];

  // Inyección en SQLite
  trainerCards.forEach(c => {
    execute(`
      INSERT OR REPLACE INTO cached_cards 
      (pokemon_id, name, image_url, type_primary, card_category, attack_points, defense_points, hp_points, special_ability, special_ability_description, rarity, level) 
      VALUES (?, ?, ?, 'normal', 'trainer', 0, 0, 0, ?, ?, ?, 1)
    `, [c.id, c.name, c.image, c.ability, c.desc, c.rarity]);
  });
  console.log('[SQLite] 30 Nuevas Cartas de Partidario (Trainers) insertadas exitosamente.');

  // Inyección y Sincronización Masiva a Supabase
  // (Eliminado para evitar bloqueos por credenciales falsas en desarrollo local)
}
export function getCachedCards() { return queryAll('SELECT * FROM cached_cards ORDER BY pokemon_id ASC'); }
export function areCardsCached() { const result = queryAll('SELECT COUNT(*) as count FROM cached_cards')[0]; return result?.count >= 120; }
export function saveTempGameState(gameType, stateJson, roomId = null) {
  execute('DELETE FROM temp_game_state;');
  execute('INSERT INTO temp_game_state (game_type, room_id, state_json) VALUES (?, ?, ?)', [gameType, roomId, stateJson]);
}
export function getTempGameState() { return queryAll('SELECT * FROM temp_game_state ORDER BY id DESC LIMIT 1')[0] || null; }
export function clearTempGameState() { execute('DELETE FROM temp_game_state;'); }

const sqliteClient = { initDatabase, saveDatabase, queryAll, execute, getUserConfig, updateUserConfig, savePvEMatch, getPvEHistory, cacheCards, getCachedCards, areCardsCached, saveTempGameState, getTempGameState, clearTempGameState, insertTrainerCards };
export default sqliteClient;
