"""Generates the Stavebien audio (word "o", definition "d", example sentence "s") with Kokoro-82M.

Kokoro-82M (hexgrad/Kokoro-82M, Apache-2.0) is an open text-to-speech model that runs locally on CPU.
Voice: af_heart (American English, female). No account, key or paid service is involved.
Files that already exist are skipped, so the script can be rerun after adding words.

  pip install kokoro-onnx soundfile lameenc
  python scripts/spill/lag-stavelyd.py            # all missing clips, 3 worker processes
  python scripts/spill/lag-stavelyd.py --maks 20  # try the first 20 missing clips
  python scripts/spill/lag-stavelyd.py --ord rhythm --ord colonel --tving   # regenerate single words

The model (~350 MB, kokoro-v1.0.onnx + voices-v1.0.bin) is downloaded once into %TEMP%/stavelyd/modell
(override with STAVELYD_MODELL). Word list, file ids and spoken text come from the site code through
scripts/spill/lag-stavelyd-liste.mjs, so they never drift apart.

Output: public/spill/stavebien/lyd/<id>-<o|d|s>.mp3 (mono, 24 kHz, 40 kbps) and the manifest
features/spill/data/stavebien/lyd.json (the page reads it because public/ is not in the server bundle).
Duration outliers are listed at the end (word clips are expected to be 0.4-2.5 s).
"""

import argparse
import json
import multiprocessing as mp
import os
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

ROT = Path(__file__).resolve().parents[2]
MAPPE = ROT / "public" / "spill" / "stavebien" / "lyd"
MANIFEST = ROT / "features" / "spill" / "data" / "stavebien" / "lyd.json"
MODELL = Path(os.environ.get("STAVELYD_MODELL", Path(tempfile.gettempdir()) / "stavelyd" / "modell"))
FILER = {
    "kokoro-v1.0.onnx": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    "voices-v1.0.bin": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
}

STEMME = "af_heart"
# Slow and clear, like a spelling bee host: the bare word a little slower than running text.
HASTIGHET = {"ord": 0.82, "definisjon": 0.92, "setning": 0.92}
KBPS = 40
SR = 24000

# espeak-ng (the phonemizer behind Kokoro) gets these wrong; IPA in Kokoro's phoneme set.
FONEMER = {
    "chiaroscuro": "kiˌɑːɹəskˈʊɹoʊ",
    "bureau": "bjˈʊɹoʊ",
    "bureaucracy": "bjʊɹˈɑːkɹəsi",
    "mercurial": "mɚkjˈʊɹiəl",
    "bildungsroman": "bˈɪldʊŋzɹoʊmˌɑːn",
    "bougainvillea": "bˌuːɡənvˈɪliə",
    "diphtheria": "dɪfθˈɪɹiə",
    "inchoate": "ɪnkˈoʊɪt",
    "kinesthetic": "kˌɪnəsθˈɛɾɪk",
    "leitmotif": "lˈaɪtmoʊtˌiːf",
    "nonpareil": "nˌɑːnpɚˈɛl",
    "picayune": "pˌɪkiˈuːn",
    "pyrrhic": "pˈɪɹɪk",
    "amanuensis": "ɐmˌænjuːˈɛnsɪs",
    "apotheosis": "ɐpˌɑːθiˈoʊsɪs",
    "bacchanal": "bˌækənˈæl",
    "bricolage": "bɹˌiːkoʊlˈɑːʒ",
    "elegiac": "ˌɛlɪdʒˈaɪək",
    "imbroglio": "ɪmbɹˈoʊljoʊ",
    "rapprochement": "ɹˌæpɹɔʃmˈɑːn",
    "dachshund": "dˈɑːksˌhʊnd",
    "vichyssoise": "vˌɪʃiswˈɑːz",
    "denouement": "deɪnuːmˈɑːn",
    "gnocchi": "nˈjɑːki",
    "dilettante": "dˌɪlətˈɑːnti",
    "emaciated": "ɪmˈeɪʃiˌeɪɾɪd",
    "synecdoche": "sɪnˈɛkdəki",
    "vituperative": "vaɪtˈuːpɚɹətˌɪv",
    "insouciance": "ɪnsˈuːsiɑːns",
    "appoggiatura": "ɐpˌɑːdʒəˈtʊɹə",
    "chimerical": "kaɪmˈɛɹɪkəl",
    "daguerreotype": "dəɡˈɛɹoʊtˌaɪp",
    "restaurateur": "ɹˌɛstɚɹətˈɜː",
    "entrepreneur": "ˌɑːntɹəpɹənˈɜː",
    "chauffeur": "ʃˈoʊfɚ",
    "connoisseur": "kˌɑːnəsˈɜː",
    "though": "ðˈoʊ",
}


def hent_modell():
    MODELL.mkdir(parents=True, exist_ok=True)
    for navn, url in FILER.items():
        fil = MODELL / navn
        if not fil.exists():
            print(f"Laster ned {navn} …", flush=True)
            urllib.request.urlretrieve(url, fil)
    return MODELL / "kokoro-v1.0.onnx", MODELL / "voices-v1.0.bin"


def hent_liste():
    ut = subprocess.run(
        ["node", str(ROT / "scripts" / "spill" / "lag-stavelyd-liste.mjs")],
        cwd=ROT, capture_output=True, check=True, encoding="utf-8",
    )
    return json.loads(ut.stdout)


def fonemer(kokoro, tekst, ord_):
    """Phonemes for a text; if the word has an override, only that word's phonemes are swapped in."""
    fon = FONEMER.get(ord_)
    if fon is None:
        return None
    if tekst.lower() == ord_:
        return fon
    m = re.search(rf"\b{re.escape(ord_)}\b", tekst, re.IGNORECASE)
    if not m:
        return None
    foer, etter = tekst[: m.start()], tekst[m.end():]
    deler = [kokoro.tokenizer.phonemize(d, "en-us").strip() if d.strip(" ,.;:\"'") else d.strip() for d in (foer, etter)]
    return " ".join(x for x in (deler[0], fon, deler[1]) if x)


_k = None


def start_arbeider(modell, stemmer, n):
    global _k
    import onnxruntime as ort
    from kokoro_onnx import Kokoro

    opts = ort.SessionOptions()
    opts.intra_op_num_threads = max(1, (os.cpu_count() or 4) // n)
    _k = Kokoro.from_session(ort.InferenceSession(str(modell), sess_options=opts, providers=["CPUExecutionProvider"]), str(stemmer))


def lag_lyd(post):
    import lameenc
    import numpy as np

    tekst, del_, ord_ = post["tekst"], post["del"], post["ord"]
    fon = fonemer(_k, tekst, ord_)
    if fon:
        s, sr = _k.create(fon, voice=STEMME, speed=HASTIGHET[del_], lang="en-us", is_phonemes=True)
    else:
        s, sr = _k.create(tekst, voice=STEMME, speed=HASTIGHET[del_], lang="en-us")
    s = np.asarray(s, dtype=np.float32)
    # Trim silence, keep a short breath at both ends.
    aktiv = np.flatnonzero(np.abs(s) > 0.012 * max(1e-6, float(np.abs(s).max())))
    if aktiv.size == 0:
        return post["fil"], 0.0, b""
    s = s[max(0, aktiv[0] - int(0.08 * sr)): aktiv[-1] + int(0.20 * sr)]
    # Even loudness across clips: RMS to about -20 dBFS, peak never above 0.95.
    rms = float(np.sqrt(np.mean(s ** 2)))
    s = s * min(0.1 / max(rms, 1e-6), 0.95 / max(float(np.abs(s).max()), 1e-6))
    enk = lameenc.Encoder()
    enk.set_bit_rate(KBPS)
    enk.set_in_sample_rate(sr)
    enk.set_channels(1)
    enk.set_quality(2)
    mp3 = enk.encode((s * 32767).astype("<i2").tobytes()) + enk.flush()
    return post["fil"], len(s) / sr, bytes(mp3)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--maks", type=int, default=0, help="stop after N new files")
    p.add_argument("--ord", action="append", default=[], help="only this word (repeatable)")
    p.add_argument("--tving", action="store_true", help="regenerate even if the file exists")
    p.add_argument("--arbeidere", type=int, default=3, help="worker processes")
    a = p.parse_args()

    modell, stemmer = hent_modell()
    MAPPE.mkdir(parents=True, exist_ok=True)
    liste = [x for x in hent_liste() if not a.ord or x["ord"] in a.ord]
    todo = [x for x in liste if a.tving or not (MAPPE / x["fil"]).exists()]
    if a.maks:
        todo = todo[: a.maks]
    print(f"{len(liste)} klipp totalt, {len(todo)} å lage ({len(liste) - len(todo)} finnes).", flush=True)

    varighet = {}
    if todo:
        n = max(1, a.arbeidere)
        with mp.get_context("spawn").Pool(n, initializer=start_arbeider, initargs=(str(modell), str(stemmer), n)) as pool:
            for i, (fil, dur, mp3) in enumerate(pool.imap_unordered(lag_lyd, todo, chunksize=4), 1):
                if not mp3:
                    print(f"TOM LYD: {fil}", flush=True)
                    continue
                (MAPPE / fil).write_bytes(mp3)
                varighet[fil] = round(dur, 2)
                if i % 50 == 0:
                    print(f"{i}/{len(todo)} …", flush=True)

    filer = sorted(f.name for f in MAPPE.glob("*.mp3"))
    MANIFEST.write_text(json.dumps(filer) + "\n", encoding="utf-8")
    total = sum((MAPPE / f).stat().st_size for f in filer)
    print(f"Ferdig. Manifest: {len(filer)} filer, {total / 1e6:.1f} MB.")

    # Sanity check on duration (new clips only).
    skrev = {x["fil"]: x for x in todo}
    avvik = [(f, d) for f, d in varighet.items() if skrev[f]["del"] == "ord" and not 0.4 <= d <= 2.5]
    avvik += [(f, d) for f, d in varighet.items() if skrev[f]["del"] != "ord" and d < 0.8]
    for f, d in sorted(avvik):
        print(f"Varighet utenfor forventet: {f} ({skrev[f]['ord']}, {skrev[f]['del']}): {d} s")
    if varighet:
        (MODELL.parent / "varighet.json").write_text(json.dumps(varighet), encoding="utf-8")


if __name__ == "__main__":
    main()
