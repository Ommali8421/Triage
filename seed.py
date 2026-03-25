import sqlite3
import json
import uuid
import random
from datetime import datetime, timedelta
import os

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'triage_records.db')

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS records (
                id TEXT PRIMARY KEY,
                timestamp TEXT,
                data TEXT
            )
        ''')
        # Clear existing records
        conn.execute('DELETE FROM records')
        conn.commit()

init_db()

names = ["Aarav", "Vivek", "Priya", "Sunita", "Rajesh", "Kavya", "Amit", "Sanjay", "Neha", "Rohan", "Meera", "Vikram"]

# We will create 3 tight clusters
# Cluster 1: Red Outbreak (5 sick patients)
# Cluster 2: Yellow Warning (3 sick patients)
# Cluster 3: Green Safe (1 sick patient)
clusters = [
    {"center": [21.1, 79.0], "total": 12, "red": 5, "yellow": 0},
    {"center": [20.7, 78.6], "total": 18, "red": 0, "yellow": 3},
    {"center": [20.9, 77.7], "total": 20, "red": 0, "yellow": 1},
]

records = []
now = datetime.now()

for c_info in clusters:
    loc = c_info["center"]
    total = c_info["total"]
    reds_left = c_info["red"]
    yellows_left = c_info["yellow"]

    for i in range(total):
        record_id = str(uuid.uuid4())
        days_ago = random.randint(0, 6)
        record_time = now - timedelta(days=days_ago, hours=random.randint(0,23))
        
        # Determine risk for this specific patient
        if reds_left > 0:
            risk = "red"
            symptoms = ["cough", "fever", "chest pain"]
            tb_flag = True
            pneu_flag = False
            reds_left -= 1
        elif yellows_left > 0:
            risk = "yellow"
            symptoms = ["cough"]
            tb_flag = False
            pneu_flag = True
            yellows_left -= 1
        else:
            risk = "green"
            symptoms = ["mild headache"] if random.random() < 0.3 else []
            tb_flag = False
            pneu_flag = False

        # Add very tight jitter (0.01 deg is ~1km) so they squarely group together in the 11km frontend logic
        lat = loc[0] + (random.random() - 0.5) * 0.02
        lng = loc[1] + (random.random() - 0.5) * 0.02

        data = {
            "id": record_id,
            "timestamp": record_time.isoformat(),
            "patient": {
                "name": random.choice(names),
                "latitude": lat,
                "longitude": lng,
                "age": random.randint(18, 70)
            },
            "riskLevel": risk,
            "symptoms": symptoms,
            "flags": {
                "tb": tb_flag,
                "pneumonia": pneu_flag,
                "anemia": False
            },
            "confidence": random.uniform(85.0, 98.0) if risk != "green" else 0.0
        }
        records.append((record_id, data["timestamp"], json.dumps(data)))

with sqlite3.connect(DB_FILE) as conn:
    conn.executemany("INSERT OR REPLACE INTO records (id, timestamp, data) VALUES (?, ?, ?)", records)
    conn.commit()

print(f"Successfully seeded triage_records.db with {len(records)} clustered records")
