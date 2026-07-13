#!/usr/bin/env python3
"""
Clean PARTSRO branding off catalog photos in Supabase Storage.

Algorithm lives in scripts/lib/debrand.py:
  - crops the bottom blue "현대기아차 순정부품" banner (+ dark disclaimer strip)
  - removes the red PARTSRO wordmark logo (any position in the top band)
  - keeps manufacturer logos (HYUNDAI | KIA, HYUNDAI MOBIS)

Reads image URLs from parts_products.image_storage_url (the Storage copies made
by migrate-images-to-storage-v2.ts). Resumable via a local progress log.

Usage:
  # SAFE default — dry run: writes cleaned copies to ./_debrand_preview/, touches nothing
  python3 scripts/clean-partsro-images.py --limit 200

  # APPLY — overwrite the images in place in Storage (originals stay in image_url)
  python3 scripts/clean-partsro-images.py --apply

Env (from .env):  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Flags:
  --apply             overwrite in Storage (default: dry-run to local folder)
  --limit N           process at most N images (0 = all)
  --offset N          skip first N rows
  --preview-dir DIR   dry-run output dir (default ./_debrand_preview)
  --concurrency N     parallel workers (default 12; task is network-bound)
"""
import os, sys, json, argparse, time, ssl, threading, urllib.request, urllib.error, io
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
from PIL import Image
from debrand import clean_image, load_template

try:
    import certifi
    _SSL = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL = ssl._create_unverified_context()

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "parts-images"
PROGRESS = os.path.join(os.path.dirname(__file__), ".debrand-done.log")
TEMPLATE = os.path.join(os.path.dirname(__file__), "lib", "partsro_logo.png")

def _req(method, path, data=None, headers=None, host=None):
    h = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    if headers: h.update(headers)
    r = urllib.request.Request((host or URL) + path, data=data, method=method, headers=h)
    return urllib.request.urlopen(r, timeout=30, context=_SSL)

def list_targets(limit, offset):
    """Yield (id, storage_path, public_url) for rows that have a storage copy."""
    got = 0; frm = offset
    base = f"{URL}/storage/v1/object/public/{BUCKET}/"
    while True:
        page = 1000
        q = (f"/rest/v1/parts_products?select=id,image_storage_url"
             f"&image_storage_url=not.is.null&order=id&limit={page}&offset={frm}")
        rows = json.loads(_req("GET", q).read())
        if not rows: break
        for r in rows:
            u = r["image_storage_url"]
            if not u.startswith(base):  # only our storage copies
                continue
            yield r["id"], u[len(base):], u
            got += 1
            if limit and got >= limit: return
        frm += page
        if len(rows) < page: break

def download(public_url):
    with urllib.request.urlopen(public_url, timeout=30, context=_SSL) as resp:
        return Image.open(io.BytesIO(resp.read()))

def upload(path, img):
    buf = io.BytesIO(); img.convert("RGB").save(buf, "JPEG", quality=88)
    _req("PUT", f"/storage/v1/object/{BUCKET}/{path}", data=buf.getvalue(),
         headers={"Content-Type": "image/jpeg", "x-upsert": "true"})

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--offset", type=int, default=0)
    ap.add_argument("--preview-dir", default="./_debrand_preview")
    ap.add_argument("--concurrency", type=int, default=12)
    a = ap.parse_args()

    tpl = load_template(TEMPLATE)
    done = set()
    if os.path.exists(PROGRESS):
        done = set(open(PROGRESS).read().split())
    if not a.apply:
        os.makedirs(a.preview_dir, exist_ok=True)

    lock = threading.Lock()
    prog_fh = open(PROGRESS, "a") if a.apply else None
    c = {"logo": 0, "banner": 0, "wm": 0, "skip": 0, "fail": 0, "total": 0}

    def work(item):
        pid, path, pub = item
        with lock:
            if path in done:            # resume, or duplicate path within this run
                c["skip"] += 1; c["total"] += 1; return
            done.add(path)
        try:
            im = download(pub)
            out, rep = clean_image(im, tpl)
            if not (rep["logo_removed"] or rep["banner_cropped"]):
                acted = False
            elif a.apply:
                upload(path, out); acted = True
            else:
                out.save(os.path.join(a.preview_dir, path.replace("/", "__")), "JPEG", quality=88)
                acted = True
            with lock:
                if not acted: c["skip"] += 1
                elif prog_fh: prog_fh.write(path + "\n"); prog_fh.flush()
                c["logo"] += rep["logo_removed"]; c["banner"] += rep["banner_cropped"]
                c["wm"] += rep["watermark_suspected"]
        except Exception as e:
            with lock: c["fail"] += 1
            print(f"  ! {pid} {path}: {e}")
        with lock:
            c["total"] += 1
            if c["total"] % 200 == 0:
                print(f"  {c['total']} done | logo {c['logo']} banner {c['banner']} "
                      f"wm~{c['wm']} skip {c['skip']} fail {c['fail']}")

    with ThreadPoolExecutor(max_workers=a.concurrency) as ex:
        list(ex.map(work, list_targets(a.limit, a.offset)))
    if prog_fh: prog_fh.close()

    n_logo, n_banner, n_wm, n_skip, n_fail, total = (
        c["logo"], c["banner"], c["wm"], c["skip"], c["fail"], c["total"])
    mode = "APPLIED to Storage" if a.apply else f"DRY-RUN → {a.preview_dir}"
    print(f"\n{mode}\n  processed {total} | logo removed {n_logo} | banner cropped {n_banner} "
          f"| watermark-suspected {n_wm} | skipped {n_skip} | failed {n_fail}")

if __name__ == "__main__":
    main()
