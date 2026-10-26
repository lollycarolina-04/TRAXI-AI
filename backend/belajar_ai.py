
import pandas as pd
from sklearn.tree import DecisionTreeClassifier

# Membaca data latihan
data = pd.read_csv("traffic.csv")

# Menentukan data masukan dan label
X = data[["kecepatan", "kendaraan"]]
y = data["kondisi"]

# Membuat dan melatih model AI
model = DecisionTreeClassifier(random_state=42)
model.fit(X, y)

# Mencoba satu prediksi
data_baru = pd.DataFrame(
    [[18, 130]],
    columns=["kecepatan", "kendaraan"]
)

hasil = model.predict(data_baru)

print("=== TRAXI AI ===")
print("Kecepatan: 18 km/jam")
print("Jumlah kendaraan: 130")
print("Prediksi kondisi lalu lintas:", hasil[0])
