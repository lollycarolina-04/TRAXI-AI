
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)


@app.get("/")
def home():
    return jsonify({
        "app": "TRAXI API",
        "status": "running",
        "message": "Welcome to TRAXI Backend"
    })


CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

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
    return jsonify({
        "success": False,
        "message": "Model AI belum tersedia. Dataset asli sedang dikumpulkan."
    }), 503


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
