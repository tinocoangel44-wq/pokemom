const fs = require('fs');

async function getGen9EvoMap() {
  const map = {};
  for(let id=906; id<=1025; id++) {
    try {
      const res = await fetch('https://pokeapi.co/api/v2/pokemon-species/' + id);
      if(!res.ok) continue;
      const data = await res.json();
      if(data.evolves_from_species) {
        map[data.name] = data.evolves_from_species.name;
      }
    } catch(e) {}
  }
  
  let sqlSupabase = '';
  let sqlSqlite = '';
  for(let evo in map) {
    let base = map[evo];
    // Formatear capitalizado
    let evoCap = evo.charAt(0).toUpperCase() + evo.slice(1);
    let baseCap = base.charAt(0).toUpperCase() + base.slice(1);
    
    sqlSupabase += `UPDATE cards SET pre_evolution_name = '${baseCap}' WHERE name = '${evoCap}';\n`;
    sqlSqlite += `UPDATE cached_cards SET pre_evolution_name = '${baseCap}' WHERE name = '${evoCap}';\n`;
  }
  
  fs.writeFileSync('evo_updates.json', JSON.stringify({ supabase: sqlSupabase, sqlite: sqlSqlite, map }));
  console.log('Done mapping.');
}
getGen9EvoMap();
