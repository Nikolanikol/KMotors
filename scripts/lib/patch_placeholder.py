"""
Patch the white-box hole (+ leftover blue frame) left by PARTSRO logo removal
on "no photo" placeholder images, using the shared collage background.

Placeholder collages are pixel-identical per size, so a median "plate" built
from many placeholders gives a clean background. We paste that background only
where the current image is near-white/near-blue but the plate is collage detail
— i.e. exactly the box/frame artifact. The centred part-number (dark) is never
touched, and real product photos are rejected by `is_placeholder`.

Public API:
    load_plates(dir)                 -> {(w,h): np.ndarray}
    is_placeholder(im, plates)       -> bool
    patch(im, plates)                -> (PIL.Image, changed_px)   # or (im, 0)
"""
from __future__ import annotations
import os, glob
import numpy as np
from PIL import Image

PLATE_ASPECT = 1000 / 780  # cropped placeholder aspect (~1.282)

def load_plates(lib_dir: str) -> dict[tuple[int, int], np.ndarray]:
    plates = {}
    for f in glob.glob(os.path.join(lib_dir, "collage_plate_*.png")):
        wh = os.path.basename(f).replace("collage_plate_", "").replace(".png", "")
        w, h = (int(x) for x in wh.split("x"))
        plates[(w, h)] = np.asarray(Image.open(f).convert("RGB")).astype(int)
    return plates

def _plate_for(size, plates):
    if size in plates:
        return plates[size]
    # canonical plate resized to the requested size (same collage design)
    canon = plates[(1000, 780)] if (1000, 780) in plates else next(iter(plates.values()))
    return np.asarray(Image.fromarray(canon.astype("uint8")).resize(size)).astype(int)

def is_placeholder(im: Image.Image, plates: dict) -> bool:
    w, h = im.size
    if abs((w / h) - PLATE_ASPECT) > 0.03:      # wrong aspect → not a cropped placeholder
        return False
    g = np.asarray(im.convert("L").resize((256, 200))).astype(float)
    plate = _plate_for(im.size, plates)
    pg = np.asarray(Image.fromarray(plate.astype("uint8")).convert("L").resize((256, 200))).astype(float)
    # match in the bottom parts-area band (no number, no logo box there)
    diff = np.abs(g[150:200] - pg[150:200]).mean()
    return diff < 20

def patch(im: Image.Image, plates: dict):
    a = np.asarray(im.convert("RGB")).astype(int)
    H, W, _ = a.shape
    plate = _plate_for((W, H), plates)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    pR, pG, pB = plate[:, :, 0], plate[:, :, 1], plate[:, :, 2]
    near_white = (R > 236) & (G > 236) & (B > 236)
    near_blue  = (B > 80) & (B < 205) & (R < 95) & (G < 95)
    plate_detail = ~((pR > 236) & (pG > 236) & (pB > 236))
    mask = (near_white | near_blue) & plate_detail
    changed = int(mask.sum())
    if changed == 0:
        return im, 0
    out = a.copy()
    out[mask] = plate[mask]
    return Image.fromarray(out.astype("uint8")), changed
