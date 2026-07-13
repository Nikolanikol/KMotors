#!/usr/bin/env python3
"""
Fill the white-box hole (+ leftover blue frame) that logo removal left on
"no photo" placeholder images, using the shared collage background.

Only placeholders with an actual artifact are rewritten; real product photos
and already-clean placeholders are skipped. Algorithm in
scripts/lib/patch_placeholder.py; plates in scripts/lib/collage_plate_*.png.

Usage:
  # SAFE default — dry run to ./_holefix_preview/, touches nothing
  python3 scripts/fix-placeholder-holes.py --limit 300

  # APPLY — overwrite placeholders in Storage in place
  python3 scripts/fix-placeholder-holes.py --apply

Flags: --apply  --limit N  --offset N  --preview-dir DIR  --concurrency N  --min-px N
"""
import os, sys, json, argparse, ssl, threading, io, urllib.request
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "lib"))
from PIL import Image
from patch_placeholder import load_plates, is_placeholder, patch

try:
    import certifi; _SSL = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL = ssl._create_unverified_context()

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "parts-images"
LIB = os.path.join(os.path.dirname(__file__), "lib")
PROGRESS = os.path.join(os.path.dirname(__file__), ".placeholder-holefix-done.log")

def _req(method, path, data=None, headers=None):
    h = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
    if headers: h.update(headers)
    r = urllib.request.Request(URL + path, data=data, method=method, headers=h)
    return urllib.request.urlopen(r, timeout=30, context=_SSL)

def list_targets(limit, offset):
    got, frm = 0, offset
    base = f"{URL}/storage/v1/object/public/{BUCKET}/"
    while True:
        q = (f"/rest/v1/parts_products?select=id,image_storage_url"
             f"&image_storage_url=not.is.null&order=id&limit=1000&offset={frm}")
        rows = json.loads(_req("GET", q).read())
        if not rows: break
        for r in rows:
            u = r["image_storage_url"]
            if not u.startswith(base): continue
            yield r["id"], u[len(base):], u
            got += 1
            if limit and got >= limit: return
        frm += 1000
        if len(rows) < 1000: break

def download(pub):
    with urllib.request.urlopen(pub, timeout=30, context=_SSL) as resp:
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
    ap.add_argument("--preview-dir", default="./_holefix_preview")
    ap.add_argument("--concurrency", type=int, default=12)
    ap.add_argument("--min-px", type=int, default=3000,
                    help="min changed pixels to count as a real hole")
    a = ap.parse_args()

    plates = load_plates(LIB)
    done = set(open(PROGRESS).read().split()) if os.path.exists(PROGRESS) else set()
    if not a.apply:
        os.makedirs(a.preview_dir, exist_ok=True)

    lock = threading.Lock()
    prog = open(PROGRESS, "a") if a.apply else None
    c = {"total": 0, "fixed": 0, "not_ph": 0, "clean": 0, "fail": 0}

    def work(item):
        pid, path, pub = item
        with lock:
            if path in done: c["total"] += 1; return
            done.add(path)
        try:
            im = download(pub)
            if not is_placeholder(im, plates):
                with lock: c["not_ph"] += 1
            else:
                out, changed = patch(im, plates)
                if changed < a.min_px:
                    with lock: c["clean"] += 1
                elif a.apply:
                    upload(path, out)
                    with lock:
                        c["fixed"] += 1
                        if prog: prog.write(path + "\n"); prog.flush()
                else:
                    out.save(os.path.join(a.preview_dir, path.replace("/", "__")), "JPEG", quality=88)
                    with lock: c["fixed"] += 1
        except Exception as e:
            with lock: c["fail"] += 1
            print(f"  ! {pid} {path}: {e}")
        with lock:
            c["total"] += 1
            if c["total"] % 500 == 0:
                print(f"  {c['total']} | fixed {c['fixed']} not-placeholder {c['not_ph']} "
                      f"clean {c['clean']} fail {c['fail']}")

    with ThreadPoolExecutor(max_workers=a.concurrency) as ex:
        list(ex.map(work, list_targets(a.limit, a.offset)))
    if prog: prog.close()

    mode = "APPLIED to Storage" if a.apply else f"DRY-RUN → {a.preview_dir}"
    print(f"\n{mode}\n  processed {c['total']} | holes fixed {c['fixed']} | "
          f"real photos {c['not_ph']} | placeholders already clean {c['clean']} | failed {c['fail']}")

if __name__ == "__main__":
    main()
