import sqlite3
import uuid
import json
import os

DB_PATH = 'dbs/mindmaps.db'

def init_db():
    if not os.path.exists('dbs'):
        os.makedirs('dbs')
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS mindmaps
                 (id TEXT PRIMARY KEY, data TEXT)''')
    conn.commit()
    conn.close()

def save_map(data):
    map_id = str(uuid.uuid4())
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO mindmaps (id, data) VALUES (?, ?)", (map_id, json.dumps(data)))
    conn.commit()
    conn.close()
    return map_id

def get_map(map_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT data FROM mindmaps WHERE id=?", (map_id,))
    result = c.fetchone()
    conn.close()
    if result:
        return json.loads(result[0])
    return None
