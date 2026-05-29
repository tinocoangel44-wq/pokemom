# Proyecto Individual: Desarrollo de Videojuego Web de Cartas
**Documentación Técnica y Manual de Usuario**

---

## 1. Portada
**Título del Proyecto:** PokeCard YU-Duels - Duelo de Cartas Estratégico  
**Materia:** Programación Web / Desarrollo de Aplicaciones Web  
**Fecha:** Mayo 2026  

---

## 2. Introducción
El presente documento describe de manera exhaustiva el diseño, desarrollo e implementación de un videojuego web basado en cartas estratégicas de Pokémon. El proyecto integra múltiples conceptos fundamentales del desarrollo moderno, incluyendo interfaces dinámicas (SPA), persistencia de datos (tanto local como remota), sincronización en tiempo real y consumo de servicios externos (APIs). A lo largo de este escrito se expone la arquitectura del sistema, las reglas de negocio aplicadas al entorno de juego y los detalles técnicos que hacen posible la comunicación en tiempo real entre múltiples clientes.

## 3. Objetivo General
Diseñar, desarrollar y documentar una aplicación web interactiva que simule un videojuego de cartas por turnos, integrando el consumo de servicios externos (PokéAPI), lógica de motor de juego, almacenamiento de datos local (SQLite) y remoto (Supabase), permitiendo partidas individuales y multijugador en tiempo real.

## 4. Objetivos Específicos
- Desarrollar una interfaz gráfica intuitiva, responsiva y temática utilizando el framework Angular.
- Consumir e interpretar datos de la PokéAPI para generar estadísticas funcionales de ataque, defensa y salud para cada carta.
- Implementar un sistema de autenticación seguro de usuarios utilizando Supabase Auth.
- Diseñar y desplegar una arquitectura de base de datos dual: una remota para la persistencia global (Supabase) y otra local (SQLite/IndexedDB local) para la caché de cartas y configuraciones.
- Programar un motor de juego (Game Engine) capaz de manejar turnos, fases y cálculo de daño.
- Establecer un sistema de comunicación en tiempo real (P2P o Client-Server) para partidas multijugador estables y sincronizadas.

## 5. Descripción del Videojuego
El videojuego es un simulador de duelos de cartas estratégicos por turnos. Los jugadores utilizan un mazo compuesto por criaturas del universo Pokémon, cada una con estadísticas únicas (puntos de vida, ataque, defensa y habilidades). La meta principal es reducir a cero los Puntos de Vida (Life Points - LP) del oponente mediante la invocación táctica de monstruos y la ejecución de ataques directos o a criaturas enemigas. El ecosistema del juego contempla la gestión de la colección de cartas del jugador, la construcción de mazos personalizados y un historial competitivo.

## 6. Reglas del Juego
- **Inicio de la Partida:** Cada jugador comienza con 4000 Puntos de Vida (LP) y roba una mano inicial de 5 cartas provenientes de su mazo previamente seleccionado.
- **Estructura del Turno:**
  1. *Fase de Robo:* El jugador activo toma una carta de su mazo.
  2. *Fase Principal 1:* El jugador puede invocar una carta al campo de batalla. Está estrictamente limitado a **una invocación por turno** y un máximo de 5 cartas simultáneas en el campo.
  3. *Fase de Batalla:* Las cartas en el campo pueden atacar a las cartas rivales o, si el campo rival está vacío, atacar directamente a los LP del jugador enemigo.
  4. *Fase Principal 2:* Modificaciones estratégicas post-ataque.
  5. *Fase Final (End Phase):* Se declara el fin del turno y el control pasa al oponente.
- **Combate y Daño:** Al atacar una carta, se compara el poder de Ataque (ATK) del agresor contra la Defensa (DEF) o Ataque del defensor. El exceso de daño (*Overflow*) tras superar los Puntos de Vida (HP) del Pokémon derrotado se resta directamente a los LP del jugador propietario.
- **Condición de Victoria:** El duelo termina inmediatamente cuando los LP de un jugador llegan a cero (Derrota) o si el mazo se queda sin cartas (Deck Out).

## 7. Tecnologías Utilizadas
- **Frontend / Framework:** Angular (HTML5, CSS3, TypeScript).
- **Estilos y UI:** Tailwind CSS.
- **Backend as a Service (BaaS):** Supabase (PostgreSQL, Auth, Realtime).
- **Base de Datos Local:** SQLite (vía sql.js o abstracción Web SQL) para caché local.
- **Consumo de Datos:** PokéAPI.
- **Control de Versiones y Despliegue:** Git, GitHub y Vercel.

## 8. Arquitectura General del Sistema
La aplicación sigue un patrón de arquitectura basada en componentes (Single Page Application). 
- La capa de presentación es manejada por Angular, que intercepta las acciones del usuario y refleja el estado del juego (`gameState`). 
- El núcleo lógico reside en servicios inyectables (`GameEngine`, `MultiplayerService`), los cuales abstraen las reglas de negocio y los cálculos matemáticos del combate.
- La capa de datos se bifurca: el `SupabaseAuthService` y consultas directas a Supabase gestionan el historial global, las salas multijugador y los datos del usuario; paralelamente, un cliente SQLite gestiona los mazos armados, la caché de cartas descargadas (para no saturar la API externa) y las configuraciones de usuario.
- En el modo multijugador, la aplicación utiliza los canales `broadcast` de Supabase Realtime para transmitir paquetes de estado (sincronización de LP, cartas en campo y transiciones de fases).

## 9. Diagrama de Base de Datos
*(Nota: En esta sección debe insertarse el diagrama Entidad-Relación visual. A continuación se detalla textualmente su estructura)*
El modelo relacional remoto se centra en el usuario (`auth.users`), el cual tiene una relación de uno a muchos con sus `decks` (mazos) y otra relación de uno a muchos con `match_history` (registro de batallas). Localmente, el modelo aísla la tabla `cached_cards` (las cartas) y se relaciona lógicamente mediante arreglos JSON en la tabla `local_decks`.

## 10. Descripción de Tablas de Supabase
- `users` (Gestionada por Auth): Almacena las credenciales de acceso, UUID único, y metadatos del usuario (como el `username`).
- `match_history`: Registra el histórico de partidas global.
  - `id` (UUID): Llave primaria.
  - `user_id` (UUID): Referencia al jugador.
  - `fecha` (Timestamp): Fecha y hora del duelo.
  - `rival` (Texto): Nombre del adversario (puede ser IA o un jugador en red).
  - `resultado` (Texto): "Victoria" o "Derrota".
  - `duracion_turnos` (Entero): Cantidad de turnos tomados antes del desenlace.

## 11. Descripción de Tablas de SQLite (Local)
- `local_user_config`: Configuraciones de volumen, SFX y el mazo activo.
- `cached_cards`: Almacena las estadísticas procesadas desde la PokéAPI para evitar solicitudes HTTP redundantes. Incluye campos como `pokemon_id`, `name`, `type_primary`, `attack_points`, `hp_points`, etc.
- `local_decks`: Copia local de las listas de IDs que conforman los mazos del jugador.
- `pve_matches`: Historial exclusivo de partidas desconectadas contra la Inteligencia Artificial.

## 12. Explicación del Consumo de la API de Pokémon
La información base se obtiene realizando peticiones GET a `https://pokeapi.co/api/v2/pokemon/{id}`. Debido a que la API devuelve datos puros de los videojuegos tradicionales, el sistema implementa un algoritmo de transformación. Por ejemplo, estadísticas como *Base Stat* de ataque y defensa se multiplican por factores matemáticos para escalar a números propios de un juego de cartas (ej. 1200 ATK, 2500 HP). Estos datos transformados se guardan inmediatamente en la tabla SQLite `cached_cards` para su futura lectura inmediata durante los duelos.

## 13. Capturas de Pantalla
*(Nota: Insertar en esta zona capturas correspondientes al Menú Principal, Constructor de Mazos, Tablero de Juego Multijugador y Pantalla de Historial de Partidas).*

## 14. Explicación de la Modalidad contra Computadora
El motor de IA (`AIEngine`) funciona bajo un árbol de decisiones determinista e integrado al ciclo de Angular. Cuando el estado del juego dictamina que es el turno del oponente (`'ai_player'`), el motor evalúa el campo. La lógica le instruye que primero intente colocar una carta de su mano si el campo lo permite (priorizando el Pokémon con las mejores estadísticas totales). Posteriormente, cicla a través de las cartas activas y evalúa si el ataque supera a las defensas rivales; en caso afirmativo, emite la acción de atacar. Al agotar sus recursos lógicos, cede el turno al humano.

## 15. Explicación de la Modalidad en Línea
El sistema multijugador se basa en una arquitectura de canales de difusión (Broadcast) de Supabase. El flujo es el siguiente:
1. **Lobby:** El anfitrión (Host) crea un "Room" y espera conexiones. El huésped (Guest) ingresa el ID de la sala y se conecta al mismo canal WebSocket.
2. **Handshake:** Ambos jugadores comparten sus mazos, nombres de usuario y deciden el inicio del juego (lanzamiento de moneda).
3. **Full State Sync:** Para evitar la desincronización de eventos, cada vez que un jugador realiza una acción que afecta la mesa (bajar una carta, atacar, cambiar turno), se emite un payload completo (`FULL_STATE_SYNC`) que contiene el estado íntegro de su lado del tablero y la manipulación de los Puntos de Vida ajenos.

## 16. Manual de Usuario
1. **Registro / Login:** Ingresa a la aplicación, introduce tu correo y una contraseña segura para acceder a tu perfil.
2. **Construir un Mazo:** Dirígete a la sección "Mazo". Utiliza el buscador para encontrar tus Pokémon favoritos, evalúa sus estadísticas y añádelos a tu mazo de juego. Es indispensable tener un mazo formado para poder combatir.
3. **Jugar contra la IA:** Selecciona "Un Jugador". El duelo iniciará de inmediato; tu objetivo es familiarizarte con las fases (Robo, Invocación, Batalla). Haz clic en una carta de tu mano para invocarla, y haz clic en una carta del campo, luego en el objetivo rival, para atacar. No olvides presionar "Terminar Turno".
4. **Jugar en Línea:** En "Multijugador", puedes crear una sala (y compartir el código con un amigo) o unirte a una existente. La mecánica es idéntica a la IA, pero enfrentando el intelecto de otra persona.
5. **Revisar Historial:** Al culminar las batallas, visita el "Historial de Partidas" en el menú principal para monitorear tu desempeño, conocer la cantidad de turnos que tomaste y a quién te enfrentaste.

---

## 17. Problemas encontrados y soluciones aplicadas

A lo largo del ciclo de desarrollo de la aplicación web, se enfrentaron diversos retos técnicos de alta complejidad, principalmente derivados de la gestión asíncrona del estado del juego y la comunicación en la nube. A continuación, se documentan los más críticos y sus resoluciones:

### A. Complejidad en la sincronización en tiempo real mediante Supabase
**Problema:** Establecer la sala de juego y mantener ambos mazos, manos y campos correctamente instanciados entre dos clientes remotos resultaba en "carreras de condiciones" (race conditions). Inicialmente, se enviaban eventos sueltos ("carta_jugada", "ataque_realizado"), lo que provocaba que si un paquete se perdía por latencia, el estado de un jugador difería drásticamente del estado que visualizaba el otro.
**Solución:** Se abandonó el enfoque de "emisión de eventos individuales" en favor de una estrategia de sincronización de estado completo (`FULL_STATE_SYNC`). Se diseñó un servicio de red que, tras cada mutación crítica del entorno local, transmite una "fotografía" completa del tablero (arreglos de cartas, LP, tamaños de manos). El receptor compara y purga su versión del rival reemplazándola por la del payload entrante. Esto garantizó resiliencia ante pérdida de paquetes.

### B. Inconsistencias visuales: nombres, monedas y daño reflejado
**Problema:** A pesar de que los datos lógicos viajaban por Supabase, el framework (Angular) no estaba refrescando la Interfaz de Usuario (UI) apropiadamente. Los nombres del rival aparecían en blanco, la animación de la "moneda" que decide el primer turno se ejecutaba en diferentes tiempos para cada cliente, y al restar puntos de vida a un Pokémon, el texto se quedaba estático a pesar de que internamente ya había muerto.
**Solución:** El problema radicaba en el motor de detección de cambios de Angular (*ChangeDetectionStrategy*). Angular no detecta mutaciones profundas en arreglos u objetos a menos que su referencia de memoria cambie. Se refactorizó la capa de recepción de WebSockets: se aplicaron técnicas de inmutabilidad (clonación de objetos mediante *Spread Operator* `...`) al actualizar las estadísticas del daño o los identificadores del rival, forzando a Angular a volver a renderizar los componentes. Para la moneda, se estandarizó que únicamente el "Host" calculara el resultado matemático y enviara un evento estricto (`coin_flip_result`), forzando al "Guest" a reproducir la animación basándose en ese dictamen maestro.

### C. Lógica estricta de una carta por turno y trabas en la transición
**Problema:** El diseño del juego requería que los usuarios solo pudieran invocar a un Pokémon por turno, pero la validación permitía bajar la mano completa por una falla lógica. Al corregir esto e implementar una bandera booleana (`hasSummonedThisTurn`), surgió un bug crítico: el jugador presionaba el botón de "Terminar Turno", pero la interfaz se congelaba; ni la IA respondía, ni el control pasaba al rival en red.
**Solución:** Al rastrear el flujo, se descubrió que las variables de control de estado del turno (incluyendo la limitación de invocaciones y los ataques restantes de cada carta) no se estaban reiniciando al final del ciclo de vida del turno. El evento de "Terminar Turno" quedaba bloqueado por una validación residual. La solución fue reestructurar la máquina de estados dentro del `GameEngine`: se creó un método dedicado `resetTurnState()` que restablece todas las banderas restrictivas (`hasSummonedThisTurn = false`, `hasAttacked = false` en cada entidad del campo) estrictamente durante la transición a la 'Fase Final'. Esto liberó el cuello de botella lógico y permitió que el flujo de turnos iterara sin trabas.
