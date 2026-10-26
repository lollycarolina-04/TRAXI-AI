
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# Membaca data latihan AI
data = pd.read_csv("traffic.csv")

# Menentukan input dan hasil yang dipelajari
X = data[["kecepatan", "kendaraan"]]
y = data["kondisi"]

# Melatih model AI
model = DecisionTreeClassifier(random_state=42)
model.fit(X, y)

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
        columns=["kecepatan", "kendaraan"]
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
