
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from flask import Flask, jsonify, request
from flask_cors import CORS
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

app = Flask(__name__)
# Membaca data dummy untuk latihan AI
BASE_DIR = Path(__file__).resolve().parent
data = pd.read_csv(BASE_DIR / "dummy_data_traxi.csv")

# Menentukan fitur input dan target prediksi
X = data[
    [
        "kecepatan_rata_rata_kmh",
        "jumlah_kendaraan_per_jam"
    ]
]

y = data["kondisi_kemacetan"]

# Membagi data: 80% latihan dan 20% pengujian
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Melatih model menggunakan data latihan saja
model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

# Menguji model dengan data yang belum dipakai saat latihan
y_pred = model.predict(X_test)

print("\n=== EVALUASI AI TRAXI ===")
print(f"Total data: {len(data)}")
print(f"Data latihan: {len(X_train)}")
print(f"Data pengujian: {len(X_test)}")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2%}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, zero_division=0))

print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# Latih ulang model dengan seluruh data untuk digunakan oleh API
model.fit(X, y)

print("\nAI TRAXI siap digunakan oleh API.")
print(f"Kategori kemacetan: {sorted(y.unique())}")

print("AI TRAXI berhasil dilatih menggunakan data dummy.")
print(f"Jumlah data latihan: {len(data)}")
print(f"Kategori kemacetan: {sorted(y.unique())}")

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "app": "TRAXI API",
        "message": "Backend is running"
    })

@app.post("/api/predict")
def predict_traffic():
    data = request.get_json(silent=True) or {}

    try:
        kecepatan = float(data["kecepatan"])
        kendaraan = int(data["kendaraan"])

        if not 0 <= kecepatan <= 200 or kendaraan < 0:
            raise ValueError

    except (KeyError, TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Kecepatan harus 0–200 dan jumlah kendaraan tidak boleh negatif"
        }), 400

    input_ai = pd.DataFrame(
    [[kecepatan, kendaraan]],
    columns=[
        "kecepatan_rata_rata_kmh",
        "jumlah_kendaraan_per_jam"
    ]
)

    hasil = model.predict(input_ai)[0]

    return jsonify({
        "success": True,
        "input": {
            "kecepatan": kecepatan,
            "kendaraan": kendaraan
        },
        "prediksi": hasil
    })

@app.get("/api/test-connection")
def test_connection():
    return jsonify({
        "success": True,
        "message": "Frontend dan backend TRAXI siap dihubungkan"
    })


@app.post("/api/route")
def create_route():
    data = request.get_json(silent=True) or {}

    origin = data.get("origin", "").strip()
    destination = data.get("destination", "").strip()

    if not origin or not destination:
        return jsonify({
            "success": False,
            "message": "Lokasi awal dan tujuan wajib diisi"
        }), 400

    return jsonify({
        "success": True,
        "message": "Data rute berhasil diterima TRAXI",
        "route": {
            "origin": origin,
            "destination": destination
        }
    })

@app.get("/api/weather")
def get_weather():
    import requests

    url = "https://api.open-meteo.com/v1/forecast"

    params = {
        "latitude": 1.1599296,
        "longitude": 104.05363,
        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "rain,"
            "weather_code,"
            "wind_speed_10m"
        ),
        "hourly": "precipitation_probability,precipitation",
        "timezone": "Asia/Jakarta",
        "forecast_days": 1,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        weather = response.json()

        return jsonify({
            "success": True,
            "lokasi": "Batam",
            "cuaca": weather["current"],
            "prakiraan_per_jam": weather["hourly"],
        })

    except requests.RequestException as error:
        app.logger.error("Gagal mengambil cuaca: %s", error)
        return jsonify({
            "success": False,
            "message": "Gagal mengambil data cuaca Open-Meteo",
        }), 502

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
