
import os
import time
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
import psycopg2
from dotenv import load_dotenv

load_dotenv()

TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")


LOCATIONS = [
    {
        "name": "Batam Centre",
        "latitude": 1.1019397397273298,
        "longitude": 104.03852537287854,
    },
    {
        "name": "Batamindo",
        "latitude": 1.0681798721393116,
        "longitude": 104.02307316689026,
    },
    {
        "name": "Bukit Daeng",
        "latitude": 1.0534946133067,
        "longitude": 104.00973722381086,
    },
    {
        "name": "Jembatan Sei Ladi",
        "latitude": 1.1113056409390076,
        "longitude": 104.01090933935437,
    },
]

TOMTOM_URL = (
    "https://api.tomtom.com/traffic/services/"
    "4/flowSegmentData/absolute/10/json"
)

INTERVAL = 900  # 15 menit

def collect_traffic():
    if not TOMTOM_API_KEY:
        print("TOMTOM_API_KEY belum tersedia di .env")
        return

    for location in LOCATIONS:
        name = location["name"]
        latitude = location["latitude"]
        longitude = location["longitude"]

        print(f"\nMengambil data: {name}")

        params = {
            "key": TOMTOM_API_KEY,
            "point": f"{latitude},{longitude}",
        }

        try:
            response = requests.get(
                TOMTOM_URL,
                params=params,
                timeout=20
            )
            response.raise_for_status()

            result = response.json()["flowSegmentData"]

            timestamp = datetime.now(
                ZoneInfo("Asia/Jakarta")
            ).replace(tzinfo=None)

            with psycopg2.connect(
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT"),
                dbname=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
            ) as conn:

                with conn.cursor() as cursor:
                    cursor.execute(
                        """
                        INSERT INTO traffic_observations (
                            timestamp,
                            location,
                            latitude,
                            longitude,
                            current_speed,
                            free_flow_speed,
                            current_travel_time,
                            free_flow_travel_time,
                            confidence,
                            road_closure
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            timestamp,
                            name,
                            latitude,
                            longitude,
                            result.get("currentSpeed"),
                            result.get("freeFlowSpeed"),
                            result.get("currentTravelTime"),
                            result.get("freeFlowTravelTime"),
                            result.get("confidence"),
                            result.get("roadClosure"),
                        )
                    )

            print("Data berhasil disimpan!")
            print(f"Waktu: {timestamp}")
            print(f"Lokasi: {name}")
            print(f"Kecepatan: {result.get('currentSpeed')} km/jam")
            print(f"Kecepatan normal: {result.get('freeFlowSpeed')} km/jam")
            print(f"Confidence: {result.get('confidence')}")

        except requests.RequestException as error:
            print(f"Gagal mengambil data {name}: {error}")

        except (psycopg2.Error, KeyError, ValueError) as error:
            print(f"Gagal memproses atau menyimpan data {name}: {error}")

if __name__ == "__main__":
    print("TRAXI Traffic Collector dimulai.")
    print("Interval pengambilan data: 15 menit.")

    while True:
        collect_traffic()
        print("Menunggu 15 menit untuk pengambilan berikutnya...")
        time.sleep(INTERVAL)
