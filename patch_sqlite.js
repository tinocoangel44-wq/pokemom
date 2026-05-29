const fs = require('fs');
const data = require('./evo_updates.json');
const sqliteSql = data.sqlite;

let clientCode = fs.readFileSync('src/lib/sqliteClient.ts', 'utf8');

const migrationBlock = `
    try {
      db.run("ALTER TABLE cached_cards ADD COLUMN pre_evolution_name TEXT DEFAULT NULL;");
      console.log('[SQLite] Columna pre_evolution_name añadida a cached_cards.');
      
      const updates = \`${sqliteSql}\`;
      db.run(updates);
      console.log('[SQLite] 48 filas de evoluciones actualizadas localmente.');
    } catch(e) {
      // Si la columna ya existe, ignora el error
    }
`;

clientCode = clientCode.replace(
  /try \{\n\s*db\.run\(\"ALTER TABLE cached_cards ADD COLUMN card_category/,
  migrationBlock + '\n    try {\n      db.run(\"ALTER TABLE cached_cards ADD COLUMN card_category'
);

fs.writeFileSync('src/lib/sqliteClient.ts', clientCode);
