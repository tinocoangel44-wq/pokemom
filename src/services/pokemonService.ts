/**
 * Interfaz para los datos básicos de la lista devuelta por PokéAPI
 */
export interface PokemonListItem {
  id: number;
  name: string;
  url: string;
}

/**
 * Interfaz para los detalles crudos del Pokémon
 */
export interface PokemonData {
  id: number;
  name: string;
  sprites: any;
  types: any[];
  stats: any[];
  abilities: any[];
}

/**
 * Interfaz de la Carta resultante para la BD y el Juego
 */
export interface Card {
  pokemon_id: number;
  name: string;
  image_url: string;
  type_primary: string;
  type_secondary: string | null;
  attack_points: number;
  defense_points: number;
  hp_points: number;
  special_ability: string;
  special_ability_description: string;
  rarity: 'legendary' | 'rare' | 'uncommon' | 'common';
  level: number;
  raw_api_data: string;
}

const BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Función auxiliar para pausar la ejecución y respetar los límites de la API.
 * @param ms Milisegundos a esperar
 * @returns Promesa que se resuelve tras el tiempo indicado
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene la lista de Pokémon de la Generación 9 y retorna los primeros 120 ordenados por ID.
 * @returns Array de objetos con id, name, y url
 */
export async function fetchGen9PokemonList(): Promise<PokemonListItem[]> {
  try {
    // La Generación 9 es el ID 9 en PokeAPI
    const response = await fetch(`${BASE_URL}/generation/9`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    
    // Extraer especies y mapearlas para incluir el ID obtenido de la URL
    let speciesList: PokemonListItem[] = data.pokemon_species.map((species: any) => {
      // Las URLs son del tipo: https://pokeapi.co/api/v2/pokemon-species/906/
      const urlParts = species.url.split('/').filter(Boolean);
      const id = parseInt(urlParts[urlParts.length - 1], 10);
      return { id, name: species.name, url: species.url };
    });

    // Ordenar por ID ascendente para garantizar que empiece en los primeros de Gen 9 (ej. 906)
    speciesList.sort((a, b) => a.id - b.id);

    // Tomar exactamente los primeros 120 Pokémon
    return speciesList.slice(0, 120);
  } catch (error) {
    console.error('Error en fetchGen9PokemonList:', error);
    throw error;
  }
}

/**
 * Obtiene los detalles completos de un Pokémon individual por su ID.
 * @param id ID del Pokémon en PokéAPI
 * @returns Datos crudos filtrados del Pokémon
 */
export async function fetchPokemonDetails(id: number): Promise<PokemonData> {
  try {
    const response = await fetch(`${BASE_URL}/pokemon/${id}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      sprites: data.sprites,
      types: data.types,
      stats: data.stats,
      abilities: data.abilities
    };
  } catch (error) {
    console.error(`Error en fetchPokemonDetails (ID ${id}):`, error);
    throw error;
  }
}

/**
 * Función utilitaria para limitar un número entre un valor mínimo y uno máximo
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Transforma los datos crudos del Pokémon recibidos de la API en una Carta de Juego.
 * Aplica fórmulas matemáticas para stats, rareza, nivel y asigna una habilidad especial.
 * @param pokemonData Datos devueltos por fetchPokemonDetails
 * @returns Objeto de tipo Card
 */
export function buildCardFromPokemon(pokemonData: PokemonData): Card {
  // 1. Extraer stats base
  let hp = 0, attack = 0, defense = 0, special_attack = 0, special_defense = 0, speed = 0;
  
  for (const statObj of pokemonData.stats) {
    const value = statObj.base_stat;
    switch (statObj.stat.name) {
      case 'hp': hp = value; break;
      case 'attack': attack = value; break;
      case 'defense': defense = value; break;
      case 'special-attack': special_attack = value; break;
      case 'special-defense': special_defense = value; break;
      case 'speed': speed = value; break;
    }
  }

  // 2. Cálculos de stats convertidas para el juego (usando clamp para topes)
  const base_attack = clamp(Math.round(((attack + special_attack) / 2) * 1.5), 100, 3000);
  const attack_points = base_attack * 2; // Duplicar ataque por balance
  const defense_points = clamp(Math.round(((defense + special_defense) / 2) * 1.5), 100, 2500);
  const hp_points = clamp(Math.round(hp * 20), 500, 4000);

  // 3. Determinar Rareza basada en stats
  let rarity: Card['rarity'] = 'common';
  if (hp_points > 3500 || attack_points > 2500) {
    rarity = 'legendary';
  } else if (attack_points > 1800 || defense_points > 1800) {
    rarity = 'rare';
  } else if (attack_points > 1200) {
    rarity = 'uncommon';
  }

  // 4. Determinar Nivel
  const level = clamp(Math.round((attack_points + defense_points + hp_points) / 500), 1, 10);

  // 5. Extraer Tipos
  const type_primary = pokemonData.types.find(t => t.slot === 1)?.type.name || 'normal';
  const type_secondary = pokemonData.types.find(t => t.slot === 2)?.type.name || null;

  // 6. Asignar Habilidades Especiales según tipo primario
  let special_ability = "Instinto";
  let special_ability_description = "Aumenta DEF en 300 por 1 turno";

  switch (type_primary) {
    case 'fire':
      special_ability = "Llamarada";
      special_ability_description = "Daño directo 300 al oponente";
      break;
    case 'water':
      special_ability = "Marea Alta";
      special_ability_description = "Recupera 400 LP propios";
      break;
    case 'grass':
      special_ability = "Regeneración";
      special_ability_description = "Recupera 200 LP y roba 1 carta";
      break;
    case 'electric':
      special_ability = "Descarga";
      special_ability_description = "Reduce ATK del oponente en 200 por 1 turno";
      break;
    case 'psychic':
      special_ability = "Visión Futura";
      special_ability_description = "Roba 2 cartas adicionales";
      break;
    case 'dragon':
      special_ability = "Furia Dragón";
      special_ability_description = "Daño directo 500, solo si LP < 1500";
      break;
    case 'dark':
      special_ability = "Maldición";
      special_ability_description = "Destruye 1 carta aleatoria del campo rival";
      break;
    case 'steel':
      special_ability = "Escudo Férreo";
      special_ability_description = "Bloquea el siguiente ataque recibido";
      break;
    case 'ghost':
      special_ability = "Posesión";
      special_ability_description = "Revive la última carta descartada propia";
      break;
    case 'fighting':
      special_ability = "Golpe Crítico";
      special_ability_description = "ATK x1.5 en el siguiente ataque";
      break;
  }

  // 7. Seleccionar la mejor imagen disponible (oficial > frente por defecto)
  const imageUrl = 
    pokemonData.sprites?.other?.['official-artwork']?.front_default ||
    pokemonData.sprites?.front_default ||
    '';

  return {
    pokemon_id: pokemonData.id,
    name: pokemonData.name,
    image_url: imageUrl,
    type_primary,
    type_secondary,
    attack_points,
    defense_points,
    hp_points,
    special_ability,
    special_ability_description,
    rarity,
    level,
    // Se guarda como string para inserciones SQL/Supabase sencillas
    raw_api_data: JSON.stringify(pokemonData) 
  };
}

/**
 * Función orquestadora principal.
 * Carga la lista inicial de Gen 9, extrae 120 IDs y luego obtiene los detalles en lotes.
 * Usa Promise.allSettled para robustez y maneja reintentos automáticos.
 * @returns Array con todas las cartas generadas.
 */
export async function loadAndCacheAllGen9Cards(): Promise<Card[]> {
  console.log('Iniciando obtención de Pokémon de la Generación 9...');
  const speciesList = await fetchGen9PokemonList();
  console.log(`Se preparan ${speciesList.length} especies para procesar.`);

  const cards: Card[] = [];
  const BATCH_SIZE = 10;
  const MAX_RETRIES = 3;

  /**
   * Cierra en clausura para obtener un Pokémon específico con reintentos
   */
  const fetchWithRetry = async (item: PokemonListItem, retries = 0): Promise<Card> => {
    try {
      const data = await fetchPokemonDetails(item.id);
      return buildCardFromPokemon(data);
    } catch (error) {
      if (retries < MAX_RETRIES) {
        const nextRetry = retries + 1;
        console.warn(`[Intento ${nextRetry}/${MAX_RETRIES}] Reintentando Pokémon ${item.name} (ID: ${item.id})...`);
        await delay(1000 * nextRetry); // Backoff progresivo (1s, 2s, 3s...)
        return fetchWithRetry(item, nextRetry);
      }
      throw new Error(`Fallo definitivo al obtener ${item.name} tras ${MAX_RETRIES} intentos.`);
    }
  };

  // Procesamiento por lotes para evitar golpear demasiado la PokéAPI
  let processedCount = 0;
  for (let i = 0; i < speciesList.length; i += BATCH_SIZE) {
    const batch = speciesList.slice(i, i + BATCH_SIZE);
    
    // Ejecutar todas las solicitudes del lote actual en paralelo
    const batchPromises = batch.map(item => fetchWithRetry(item));
    const results = await Promise.allSettled(batchPromises);

    // Procesar resultados del lote
    results.forEach((result, index) => {
      processedCount++;
      const currentItem = batch[index];
      
      if (result.status === 'fulfilled') {
        cards.push(result.value);
        console.log(`[${processedCount}/${speciesList.length}] Carta generada: ${currentItem.name.toUpperCase()}`);
      } else {
        console.error(`[${processedCount}/${speciesList.length}] Error procesando a ${currentItem.name}:`, result.reason);
      }
    });

    // Pausa de cortesía entre lotes
    if (i + BATCH_SIZE < speciesList.length) {
      await delay(800); 
    }
  }

  console.log(`\nCarga finalizada. Se generaron ${cards.length} cartas con éxito.`);
  return cards;
}

const pokemonService = {
  fetchGen9PokemonList,
  fetchPokemonDetails,
  buildCardFromPokemon,
  loadAndCacheAllGen9Cards,
  delay
};

export default pokemonService;
