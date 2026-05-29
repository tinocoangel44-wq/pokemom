import sqlite3
import os

# Determinar las rutas
current_dir = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(current_dir, 'cards_local.db')
schema_path = os.path.join(current_dir, 'schema.sql')

def init_db():
    try:
        print(f"Conectando a base de datos en: {db_path}")
        # Conectarse a (y crear) el archivo físico cards_local.db
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Ejecutar PRAGMA para mejorar performance
        cursor.execute('PRAGMA journal_mode=WAL;')
        
        # Leer el archivo schema.sql
        print(f"Leyendo esquema desde: {schema_path}")
        with open(schema_path, 'r', encoding='utf-8') as f:
            schema_sql = f.read()
            
        # Ejecutarlo completo
        cursor.executescript(schema_sql)
        
        # Guardar cambios
        conn.commit()
        conn.close()
        
        print("¡Éxito! Base de datos SQLite (cards_local.db) inicializada correctamente.")
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")

if __name__ == '__main__':
    init_db()
