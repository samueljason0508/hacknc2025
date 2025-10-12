# app_state.py
import os
from functools import lru_cache
from typing import List, Optional, Tuple

import numpy as np
import rasterio
from rasterio.crs import CRS
from rasterio.windows import Window
from pyproj import Transformer
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import glob

# Folder containing your state rasters (.tif)
RASTER_DIR = os.environ.get(
    "NOISE_RASTER_DIR",
    r"..\outputs\State_rasters"  # relative to backend/
)
# Glob for rasters (no need for recursive unless you have subfolders)
GLOB_PATTERNS = os.environ.get(
    "NOISE_RASTER_GLOB",
    "*.tif;*.tiff"
)

WGS84 = CRS.from_epsg(4326)

app = FastAPI(title="US Noise Sampler (per-state rasters)", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RasterInfo:
    __slots__ = ("path", "crs", "bounds", "transform", "nodata")
    def __init__(self, path: str, crs: CRS, bounds, transform, nodata):
        self.path = path
        self.crs = crs
        self.bounds = bounds  # (left, bottom, right, top)
        self.transform = transform
        self.nodata = nodata

def _expand_patterns(folder: str, patterns: str) -> List[str]:
    files: List[str] = []
    for pat in patterns.split(";"):
        pat = pat.strip()
        if not pat:
            continue
        files.extend(glob.glob(os.path.join(folder, pat)))
    # dedupe + sort
    return sorted(set(files))

def _point_in_bounds(x: float, y: float, bounds) -> bool:
    left, bottom, right, top = bounds
    return (left <= x <= right) and (bottom <= y <= top)

@lru_cache(maxsize=1)
def get_index() -> List[RasterInfo]:
    folder = os.path.abspath(RASTER_DIR)
    patterns = GLOB_PATTERNS
    paths = _expand_patterns(folder, patterns)
    if not paths:
        raise RuntimeError(f"No rasters found in {folder} for patterns: {patterns}")

    index: List[RasterInfo] = []
    for p in paths:
        try:
            ds = rasterio.open(p)
        except Exception:
            continue
        info = RasterInfo(
            path=p,
            crs=ds.crs,
            bounds=ds.bounds,
            transform=ds.transform,
            nodata=ds.nodata
        )
        ds.close()
        index.append(info)

    if not index:
        raise RuntimeError(f"Failed to open any rasters in {folder}")
    return index

def _sample_pixel(path: str, band: int, row: int, col: int) -> Optional[float]:
    with rasterio.open(path) as ds:
        win = Window(col_off=col, row_off=row, width=1, height=1)
        arr = ds.read(band, window=win, out_dtype="float64")
        if arr.size == 0:
            return None
        val = float(arr[0, 0])
        if ds.nodata is not None and val == ds.nodata:
            return None
        return val

@app.get("/api/noise")
def sample_noise(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lng: float = Query(..., ge=-180.0, le=180.0),
    band: int = Query(1, ge=1, description="1-based band index")
):
    idx = get_index()

    # Try rasters whose bounds contain the point (in their CRS)
    for r in idx:
        # transform click (WGS84) -> raster CRS
        if r.crs is None:
            continue
        if r.crs == WGS84:
            x, y = lng, lat
        else:
            transformer = Transformer.from_crs(WGS84, r.crs, always_xy=True)
            x, y = transformer.transform(lng, lat)

        if not _point_in_bounds(x, y, r.bounds):
            continue

        # Convert map coords to pixel row/col in this raster
        with rasterio.open(r.path) as ds:
            try:
                row, col = ds.index(x, y)
            except Exception:
                continue
            # guard against edges
            if not (0 <= row < ds.height and 0 <= col < ds.width):
                continue
            try:
                val = _sample_pixel(r.path, band, row, col)
            except Exception:
                continue

            return {
                "ok": True,
                "value": val,
                "band": band,
                "source": r.path,
                "crs": str(r.crs),
                "nodata": r.nodata if r.nodata is None else float(r.nodata)
            }

    # If none contained the point:
    return {
        "ok": True,
        "value": None,
        "band": band,
        "source": None,
        "message": "No raster covers this location (or hit NoData)."
    }
