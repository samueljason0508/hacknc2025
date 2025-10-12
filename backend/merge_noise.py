# merge_noise.py
import argparse, glob, os
import numpy as np
import rioxarray as rxr
from rioxarray.merge import merge_arrays

def main(src_glob: str, out_path: str, cog: bool):
    files = sorted(glob.glob(src_glob))
    if not files:
        raise SystemExit(f"No rasters matched: {src_glob}")

    # Open & reproject each raster to EPSG:4326 (lon/lat)
    arrays = []
    for f in files:
        da = rxr.open_rasterio(f, masked=True)  # [band, y, x]
        if da.rio.crs is None:
            raise SystemExit(f"{f} has no CRS; please define it before merging.")
        da4326 = da.rio.reproject("EPSG:4326", nodata=da.rio.nodata)
        arrays.append(da4326)

    # Mosaic (nearest for categorical / banded noise rasters)
    merged = merge_arrays(arrays, method="nearest")

    # Ensure nodata is respected
    nodata = merged.rio.nodata
    if nodata is None:
        # Try to infer nodata (optional)
        nodata = np.nan

    # Write output
    if cog:
        merged.rio.to_raster(
            out_path,
            driver="COG",
            compress="DEFLATE",
            NUM_THREADS="ALL_CPUS",
            OVERVIEWS="AUTO",
            predictor=2
        )
    else:
        merged.rio.to_raster(
            out_path,
            compress="DEFLATE"
        )
    print(f"✅ Wrote {out_path}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="Glob of input rasters, e.g. C:\\outputs\\states\\*.tif")
    ap.add_argument("--out", required=True, help="Output GeoTIFF/COG path")
    ap.add_argument("--cog", action="store_true", help="Write as Cloud-Optimized GeoTIFF if supported")
    args = ap.parse_args()
    main(args.src, args.out, args.cog)
