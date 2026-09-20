"""
Convertit des images en JPEG et les ajoute à images/photos/ en continuant la
numérotation IMG_N.jpg. Lance ensuite generate-metadata.py pour mettre à jour
metadata.json.

Le côté le plus long est ramené à 2000 px et le ratio est conservé : une image
en 4/3 donne donc exactement 2000x1500, une image aux proportions différentes
garde les siennes. Pas d'agrandissement. L'orientation EXIF est appliquée puis
neutralisée, l'EXIF et le profil ICC sont conservés.

Les exports retouchés perdent souvent leur EXIF. Deux rattrapages automatiques :
  - si le fichier contient un bloc XMP, l'EXIF en est reconstruit ;
  - si --exif-de est fourni, l'EXIF est repris du fichier original de même
    numéro (IMG_3450.png <- IMG_3450.dng). HEIC, DNG, JPEG et PNG sont lus.

Installation : pip install Pillow pillow-heif
Usage        : python convert-images.py <dossier> [--exif-de <dossier_originaux>]
               python convert-images.py <dossier> --simulation
"""

import argparse
import os
import re
import sys
from fractions import Fraction

from PIL import Image, ImageOps
from PIL.TiffImagePlugin import IFDRational

sys.stdout.reconfigure(encoding="utf-8")

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    print("(pillow-heif absent : les fichiers HEIC seront ignorés)")

QUALITY = 75
MAX_COTE = 2000          # côté le plus long, en pixels
EXTS = (".heic", ".heif", ".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dng", ".webp", ".bmp")

ORIENTATION = 274
EXIF_IFD, GPS_IFD, INTEROP_IFD = 0x8769, 0x8825, 0xA005

# Tags repris d'un fichier original. Liste blanche volontaire : l'IFD0 d'un DNG
# contient des tags structurels TIFF qui n'ont aucun sens dans un JPEG.
IFD0_TAGS = (271, 272, 305, 306, 315, 33432)
SUB_TAGS = (0x9003, 0x9004, 0x9291, 0x9292,
            0x829A, 0x829D, 0x8827, 0x920A, 0xA405,
            0x9207, 0x9209, 0x8822, 0xA434, 0xA433)

script_dir = os.path.dirname(os.path.abspath(__file__))


# --- EXIF ---------------------------------------------------------------

def _rat(v):
    """'14/5' ou '2.8' -> IFDRational."""
    f = Fraction(v) if "/" in str(v) else Fraction(str(v)).limit_denominator(100000)
    return IFDRational(f.numerator, f.denominator)


def _xmp_gps(v):
    """'51,10.851500N' -> ((degrés, minutes, secondes), 'N')."""
    m = re.match(r"^(\d+),([\d.]+)([NSEW])$", v.strip())
    if not m:
        return None
    return (IFDRational(int(m.group(1)), 1), _rat(m.group(2)), IFDRational(0, 1)), m.group(3)


def exif_from_xmp(raw):
    """Reconstruit un bloc EXIF à partir d'un XMP (export sans EXIF)."""
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8", "ignore")
    attrs = dict(re.findall(r'([\w]+:[\w]+)="([^"]*)"', raw))
    iso = re.search(r"<exif:ISOSpeedRatings>.*?<rdf:li>(\d+)</rdf:li>", raw, re.S)

    exif = Image.Exif()
    sub, gps = {}, {}

    if "tiff:Make" in attrs:
        exif[271] = attrs["tiff:Make"]
    if "tiff:Model" in attrs:
        exif[272] = attrs["tiff:Model"]

    date = (attrs.get("exif:DateTimeOriginal") or attrs.get("photoshop:DateCreated")
            or attrs.get("xmp:CreateDate"))
    if date:
        d = date[:19].replace("-", ":", 2).replace("T", " ")
        sub[0x9003] = d
        exif[306] = d

    if "exif:FNumber" in attrs:
        sub[0x829D] = _rat(attrs["exif:FNumber"])
    if "exif:ExposureTime" in attrs:
        sub[0x829A] = _rat(attrs["exif:ExposureTime"])
    if "exif:FocalLength" in attrs:
        sub[0x920A] = _rat(attrs["exif:FocalLength"])
    if iso:
        sub[0x8827] = int(iso.group(1))

    for key, tag, reftag, dflt in (("exif:GPSLatitude", 2, 1, "N"),
                                   ("exif:GPSLongitude", 4, 3, "E")):
        if key in attrs:
            parsed = _xmp_gps(attrs[key])
            if parsed:
                gps[tag], gps[reftag] = parsed[0], parsed[1] or dflt

    if sub:
        exif.get_ifd(EXIF_IFD).update(sub)
    if gps:
        exif.get_ifd(GPS_IFD).update(gps)
    return exif if (sub or gps or 271 in exif) else None


def load_exif(im):
    """EXIF de l'image, complété par le XMP s'il n'y a pas d'EXIF exploitable."""
    exif = im.getexif()
    for ifd in (EXIF_IFD, GPS_IFD, INTEROP_IFD):
        try:
            exif.get_ifd(ifd)
        except Exception:
            pass
    if not exif.get_ifd(EXIF_IFD) and 271 not in exif:
        xmp = im.info.get("xmp") or im.info.get("XML:com.adobe.xmp")
        if xmp:
            rebuilt = exif_from_xmp(xmp)
            if rebuilt is not None:
                return rebuilt, "XMP"
        return exif, "aucun"
    return exif, "EXIF"


def transplant(source_exif):
    """Ne garde d'un EXIF source que les tags pertinents pour un JPEG."""
    exif = Image.Exif()
    src_sub = source_exif.get_ifd(EXIF_IFD)
    src_gps = source_exif.get_ifd(GPS_IFD)

    for t in IFD0_TAGS:
        if t in source_exif:
            exif[t] = source_exif[t]
    sub = {t: src_sub[t] for t in SUB_TAGS if t in src_sub}
    if sub:
        exif.get_ifd(EXIF_IFD).update(sub)
    if src_gps:
        exif.get_ifd(GPS_IFD).update(dict(src_gps))
    return exif


# --- Image --------------------------------------------------------------

def flatten(im):
    """Retire le canal alpha. Recadre la marge transparente quand elle forme un
    rectangle (cas des exports Affinity), sinon aplatit sur blanc en repli."""
    if im.mode == "P":
        im = im.convert("RGBA") if "transparency" in im.info else im.convert("RGB")
    if im.mode not in ("RGBA", "LA"):
        return im if im.mode == "RGB" else im.convert("RGB")

    alpha = im.split()[-1]
    if alpha.getextrema()[0] == 255:
        return im.convert("RGB")

    bbox = alpha.point(lambda p: 255 if p >= 250 else 0).getbbox()
    if bbox:
        cand = im.crop(bbox)
        if cand.split()[-1].getextrema()[0] >= 250:
            if bbox != (0, 0, im.width, im.height):
                print(f"   marge transparente recadrée : {im.width}x{im.height} "
                      f"-> {cand.width}x{cand.height}")
            return cand.convert("RGB")

    print("   semi-transparence : aplatissement sur blanc")
    im = im.convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    return bg


def redimensionne(im):
    """Ramène le côté le plus long à MAX_COTE en conservant le ratio.
    Une image 4/3 donne donc exactement 2000x1500. Jamais d'agrandissement."""
    w, h = im.size
    if max(w, h) <= MAX_COTE:
        return im
    s = MAX_COTE / max(w, h)
    return im.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)


def convert(src_path, dest_path, exif_source=None):
    im = Image.open(src_path)
    im = ImageOps.exif_transpose(im)
    icc = im.info.get("icc_profile")

    if exif_source is not None:
        exif, origine = transplant(exif_source), "original"
    else:
        exif, origine = load_exif(im)

    exif[ORIENTATION] = 1

    before = im.size
    im = flatten(im)
    im = redimensionne(im)

    sub = exif.get_ifd(EXIF_IFD)
    if sub:
        sub[0xA002], sub[0xA003] = im.size

    im.save(dest_path, "JPEG", quality=QUALITY, subsampling=0,
            optimize=True, exif=exif.tobytes(), icc_profile=icc)
    return before, im.size, origine


# --- Programme ----------------------------------------------------------

def numero(name):
    m = re.search(r"(\d{3,})", os.path.splitext(os.path.basename(name))[0])
    return m.group(1) if m else None


def prochain_index():
    nums = [int(f[4:-4]) for f in os.listdir(script_dir)
            if f.lower().endswith(".jpg") and f[4:-4].isdigit()]
    return max(nums) + 1 if nums else 0


def main():
    p = argparse.ArgumentParser(description="Convertit des images et les ajoute à images/photos/.")
    p.add_argument("dossier", help="dossier contenant les images à convertir")
    p.add_argument("--exif-de", metavar="DOSSIER",
                   help="dossier des fichiers originaux, pour récupérer l'EXIF perdu à la retouche")
    p.add_argument("--simulation", action="store_true", help="n'écrit rien, affiche seulement le plan")
    args = p.parse_args()

    fichiers = sorted(f for f in os.listdir(args.dossier) if f.lower().endswith(EXTS))
    if not fichiers:
        sys.exit(f"Aucune image dans {args.dossier}")

    originaux = {}
    if args.exif_de:
        for f in os.listdir(args.exif_de):
            n = numero(f)
            if n:
                originaux.setdefault(n, os.path.join(args.exif_de, f))

    debut = prochain_index()
    print(f"{len(fichiers)} image(s) -> IMG_{debut}.jpg ... IMG_{debut + len(fichiers) - 1}.jpg\n")

    for i, name in enumerate(fichiers):
        cible = f"IMG_{debut + i}.jpg"
        if args.simulation:
            print(f"{name:24s} -> {cible}")
            continue

        exif_source = None
        n = numero(name)
        if n and n in originaux:
            src_exif, kind = load_exif(Image.open(originaux[n]))
            if kind != "aucun":
                exif_source = src_exif

        before, after, origine = convert(os.path.join(args.dossier, name),
                                         os.path.join(script_dir, cible), exif_source)
        kb = os.path.getsize(os.path.join(script_dir, cible)) // 1024
        print(f"{name:24s} -> {cible:12s} {before[0]}x{before[1]} -> "
              f"{after[0]}x{after[1]}  {kb} Ko  [exif: {origine}]")

    if args.simulation:
        print("\nSimulation : aucun fichier écrit.")
    else:
        print(f"\nTerminé. Lance maintenant : python generate-metadata.py")


if __name__ == "__main__":
    main()
