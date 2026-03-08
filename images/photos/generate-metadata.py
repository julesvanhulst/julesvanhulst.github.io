"""
Génère images/photos/metadata.json à partir des données EXIF des photos.
Les champs manquants peuvent être complétés manuellement dans le JSON généré.

Installation : pip install Pillow
Usage        : python generate-metadata.py
"""

import json
import os
import time
import urllib.request
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS


def reverse_geocode(lat, lon):
    """Retourne un nom de lieu lisible via Nominatim (OpenStreetMap)."""
    url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=fr"
    req = urllib.request.Request(url, headers={"User-Agent": "photo-portfolio-metadata/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
        addr = data.get("address", {})
        city = (addr.get("city") or addr.get("town") or addr.get("village")
                or addr.get("municipality") or addr.get("county") or "")
        country = addr.get("country", "")
        return f"{city}, {country}".strip(", ") if city else country
    except Exception as e:
        print(f"(geocoding échoué : {e})", end=" ")
        return ""


def rational_to_float(v):
    try:
        return float(v)
    except TypeError:
        return float(v[0]) / float(v[1])


def parse_gps(gps_raw):
    gps = {GPSTAGS.get(k, k): v for k, v in gps_raw.items()}
    lat     = gps.get("GPSLatitude")
    lat_ref = gps.get("GPSLatitudeRef", "N")
    lon     = gps.get("GPSLongitude")
    lon_ref = gps.get("GPSLongitudeRef", "E")
    if not (lat and lon):
        return None
    lat_dd = sum(rational_to_float(lat[i]) / (60 ** i) for i in range(3))
    lon_dd = sum(rational_to_float(lon[i]) / (60 ** i) for i in range(3))
    if lat_ref == "S": lat_dd = -lat_dd
    if lon_ref == "W": lon_dd = -lon_dd
    return {"lat": round(lat_dd, 6), "lon": round(lon_dd, 6)}


def get_metadata(path):
    try:
        img = Image.open(path)
        raw = img._getexif()
        if not raw:
            return {}
    except Exception as e:
        print(f"  Erreur lecture : {e}")
        return {}

    exif    = {}
    gps_raw = None
    for tag_id, val in raw.items():
        tag = TAGS.get(tag_id, tag_id)
        if tag == "GPSInfo":
            gps_raw = val
        else:
            exif[tag] = val

    meta = {}

    # Date
    date = exif.get("DateTimeOriginal") or exif.get("DateTime")
    if date:
        meta["date"] = date[:10].replace(":", "-")

    # Appareil
    make  = str(exif.get("Make",  "")).strip().rstrip("\x00")
    model = str(exif.get("Model", "")).strip().rstrip("\x00")
    if model:
        meta["camera"] = model if model.lower().startswith(make.lower()) else f"{make} {model}".strip()

    # Ouverture
    fn = exif.get("FNumber")
    if fn is not None:
        meta["aperture"] = f"f/{rational_to_float(fn):.1f}"

    # Vitesse
    et = exif.get("ExposureTime")
    if et is not None:
        s = rational_to_float(et)
        meta["shutter"] = f"1/{round(1/s)}" if s < 1 else f"{s:.1f}s"

    # ISO
    iso = exif.get("ISOSpeedRatings")
    if iso is not None:
        meta["iso"] = int(iso)

    # Focale
    fl = exif.get("FocalLength")
    if fl is not None:
        meta["focal_length"] = f"{round(rational_to_float(fl))}mm"

    # GPS + reverse geocoding
    if gps_raw:
        gps = parse_gps(gps_raw)
        if gps:
            meta["gps"] = gps
            print("geocoding... ", end="", flush=True)
            meta["location"] = reverse_geocode(gps["lat"], gps["lon"])
            time.sleep(1)  # respecte la limite de Nominatim (1 req/s)
        else:
            meta["location"] = ""
    else:
        meta["location"] = ""

    return meta


# --- Chemins ---
script_dir    = os.path.dirname(os.path.abspath(__file__))
metadata_path = os.path.join(script_dir, "metadata.json")

# Scanne les JPG du dossier, triés par numéro (IMG_0, IMG_1, ...)
all_jpgs = sorted(
    [f for f in os.listdir(script_dir) if f.lower().endswith(".jpg")],
    key=lambda s: int(s.upper().replace("IMG_", "").replace(".JPG", ""))
        if s.upper().replace("IMG_", "").replace(".JPG", "").isdigit() else float("inf")
)

# Charge le metadata existant pour préserver les edits manuels (ex: location)
existing = {}
if os.path.exists(metadata_path):
    with open(metadata_path, encoding="utf-8") as f:
        existing = json.load(f)
    print(f"Metadata existant chargé ({len(existing)} entrées)\n")

metadata = {}
for filename in all_jpgs:
    path = os.path.join(script_dir, filename)
    print(f"{filename}... ", end="")
    if filename in existing:
        metadata[filename] = existing[filename]
        print("conservé")
    elif os.path.exists(path):
        meta = get_metadata(path)
        metadata[filename] = meta
        print(f"OK ({len(meta)} champs)")
    else:
        metadata[filename] = {}
        print("fichier introuvable")

with open(metadata_path, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=4, ensure_ascii=False)

print(f"\nTerminé — {len(metadata)} images → metadata.json")
print("Tu peux corriger le champ 'location' manuellement si besoin.")