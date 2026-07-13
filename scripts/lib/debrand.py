"""
PARTSRO de-branding algorithm (pure numpy + Pillow).

Removes from partsro.com product photos:
  1. Bottom blue banner  "현대기아차 순정부품"  (+ dark disclaimer strip above it)
  2. PARTSRO red wordmark logo  (anywhere in the top band)

Deliberately KEEPS manufacturer logos (HYUNDAI | KIA are black; HYUNDAI MOBIS
red mark is rejected by the discriminator, so it is not touched).

Public API:
    clean_image(pil_img, template_mask) -> (pil_img_clean, report_dict)
    load_template(path)                 -> template_mask (for reuse across a batch)

The diagonal semi-transparent PARTSRO watermark is NOT handled here (needs AI
inpainting); `report["watermark_suspected"]` flags images that likely have it.
"""
from __future__ import annotations
import numpy as np
from PIL import Image

TW, TH = 160, 32  # normalised template size for NCC

def _redmask(a: np.ndarray) -> np.ndarray:
    R, G, B = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
    return (R > 150) & (G < 95) & (B < 95)

def load_template(path: str) -> np.ndarray:
    tpl = np.asarray(Image.open(path).convert("RGB"))
    tm = _redmask(tpl)
    tm_r = np.asarray(Image.fromarray((tm * 255).astype("uint8")).resize((TW, TH))) / 255.0
    return tm_r - tm_r.mean()

def _find_banner_top(a: np.ndarray) -> int:
    """Top y of the bottom blue banner, extended up through a dark disclaimer strip."""
    H, W, _ = a.shape
    R, G, B = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
    blue = (B > 90) & (B < 215) & (R < 95) & (G < 95)
    rowblue = blue.mean(axis=1)
    top = H
    for y in range(H - 1, int(H * 0.55), -1):
        if rowblue[y] > 0.30:
            top = y
        elif top < H and rowblue[y] < 0.15:
            break
    if top >= H:
        return H
    # extend up through a contiguous dark full-width strip (disclaimer line)
    lum = a[:, :, :3].mean(axis=2)
    y = top - 1
    while y > int(H * 0.55):
        row = lum[y]
        dark_frac = (row < 70).mean()
        if dark_frac > 0.5:
            top = y
            y -= 1
        else:
            break
    return top

def _find_partsro(a: np.ndarray, template_mask: np.ndarray):
    """Return (bbox, ncc, bar) if a PARTSRO wordmark is present in the top band, else None."""
    H, W, _ = a.shape
    rm = _redmask(a)
    band = rm.copy()
    band[int(H * 0.30):, :] = False           # only search the top 30%
    if band.sum() < 40:
        return None
    ys, xs = np.where(band)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    w, h = x1 - x0 + 1, y1 - y0 + 1
    aspect = w / max(h, 1)
    crop = rm[y0:y1 + 1, x0:x1 + 1]
    bar = float(crop[int(h * 0.8):, :].mean())        # solid red underline?
    cr = np.asarray(Image.fromarray((crop * 255).astype("uint8")).resize((TW, TH))) / 255.0
    cr_c = cr - cr.mean()
    denom = (np.sqrt((cr_c ** 2).sum()) * np.sqrt((template_mask ** 2).sum())) or 1.0
    ncc = float((cr_c * template_mask).sum() / denom)
    # PARTSRO signature: wide wordmark + solid underline bar
    is_partsro = (aspect > 3.5) and (bar > 0.55) and (w / W > 0.15) and (ncc > 0.25)
    if not is_partsro:
        return None
    return (int(x0), int(y0), int(x1), int(y1)), round(ncc, 3), round(bar, 2)

def _suspect_watermark(a: np.ndarray, banner_top: int) -> bool:
    """Heuristic: faint large diagonal gray text over the centre."""
    H, W, _ = a.shape
    cen = a[int(H * 0.30):min(banner_top, int(H * 0.75)), int(W * 0.1):int(W * 0.9), :3].astype(int)
    if cen.size == 0:
        return False
    gray = cen.mean(axis=2)
    sat = cen.max(axis=2) - cen.min(axis=2)
    # watermark pixels: mid-gray, low saturation, forming faint strokes
    faint = ((gray > 120) & (gray < 205) & (sat < 22))
    return 0.04 < float(faint.mean()) < 0.35

def clean_image(im: Image.Image, template_mask: np.ndarray):
    im = im.convert("RGB")
    a = np.asarray(im)
    H, W, _ = a.shape
    report = {"logo_removed": False, "banner_cropped": False, "watermark_suspected": False}

    banner_top = _find_banner_top(a)
    report["watermark_suspected"] = _suspect_watermark(a, banner_top)

    arr = a.copy()
    hit = _find_partsro(a, template_mask)
    if hit:
        (x0, y0, x1, y1), ncc, bar = hit
        pad = int(W * 0.015)
        x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
        x1, y1 = min(W, x1 + pad), min(H, y1 + pad)
        # fill with median of background just outside the box
        samp = []
        if y1 + 1 < H: samp.append(a[y1 + 1:min(y1 + 9, H), x0:x1].reshape(-1, 3))
        if x1 + 1 < W: samp.append(a[y0:y1, x1 + 1:min(x1 + 9, W)].reshape(-1, 3))
        if x0 - 9 >= 0: samp.append(a[y0:y1, max(0, x0 - 9):x0].reshape(-1, 3))
        fill = (np.median(np.concatenate(samp), axis=0) if samp else np.array([255, 255, 255]))
        arr[y0:y1, x0:x1] = fill.astype("uint8")
        report.update(logo_removed=True, logo_bbox=(x0, y0, x1, y1), logo_ncc=ncc)

    if banner_top < H:
        arr = arr[:banner_top, :, :]
        report.update(banner_cropped=True, banner_top=int(banner_top))

    return Image.fromarray(arr), report
