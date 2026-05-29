import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initDatabase, areCardsCached, cacheCards, execute, saveDatabase } from './lib/sqliteClient';
// Asume que existe un servicio para obtener las cartas de la API
// @ts-ignore
import { loadAndCacheAllGen9Cards } from './services/pokemonService'; 

async function bootstrapApp() {
  console.log('[App] Inicializando aplicación...');
  
  await initDatabase();
  console.log('[App] SQLite listo.');

  if (!areCardsCached()) {
    console.log('[App] Descargando cartas de PokéAPI...');
    // Si pokemonService.js no existe aún, crea un mock o deja el comentario para implementarlo luego
    if (typeof loadAndCacheAllGen9Cards === 'function') {
       const cards = await loadAndCacheAllGen9Cards();
       cacheCards(cards);
       console.log('[App] 120 cartas cargadas y cacheadas.');
    } else {
       console.warn('[App] loadAndCacheAllGen9Cards no implementado aún o no exportado.');
    }
  } else {
    console.log('[App] Cartas cargadas desde cache local.');
    // Actualización solicitada: Duplicar ataque de cartas ya cacheadas
    if (!localStorage.getItem('attack_doubled')) {
      try {
        console.log('[SQLite] Ejecutando actualización local de attack_points x 2...');
        execute('UPDATE cached_cards SET attack_points = attack_points * 2;');
        saveDatabase();
        localStorage.setItem('attack_doubled', 'true');
        console.log('[SQLite] Ataque duplicado exitosamente en BD local.');
      } catch (err) {
        console.error('[SQLite] Error al actualizar attack_points:', err);
      }
    }
  }
  
  // A partir de aquí debe continuar el código normal de montaje
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
}

bootstrapApp().catch(console.error);
