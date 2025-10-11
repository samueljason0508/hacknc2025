#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
MappingAlg.py — US Population Density → Raster → Voronoi (+ stats)
Outputs go to: <project_root>/outputs/
Run directly or via npm script.

Examples (PowerShell-safe):
  python "backend/Voronoi Algorithm/MappingAlg.py"
  python "backend/Voronoi Algorithm/MappingAlg.py" --pix 5000 --target_pop_per_seed 800000

Tip: set CENSUS_API_KEY in your environment to make ACS downloads more reliable.
"""

import os, sys, argparse, warnings
from typing import List, Tuple, Dict

import numpy as np
import pandas as pd
import geopandas as gpd
import censusdata as cd
import us

from shapely.ops import unary_union
from pyproj import CRS

import rasterio
from rasterio.features import rasterize
from rasterio.transform import from_origin

import rioxarray as rxr
from rasterstats import zonal_stats
from geovoronoi import voronoi_regions_from_coords

EQ_AREA_CRS = "EPSG:5070"   # NAD83 / Conus Albers
WGS84 = "EPSG:4326"
TIGER_URL = "https://www2.census.gov/geo/tiger/TIGER2022/BG/tl_2022_us_bg.zip"

def project_root() -> str:
    # project root = directory that contains package.json or .git if we can find it, else cwd parent
    here = os.path.abspath(os.path.dirname(__file__))
    cur = os.path.abspath(os.path.join(here, "..", ".."))
    # if someone moved files, still fall back
    return cur

def outputs_dir() -> str:
    out = os.path.join(project_root(), "outputs")
    os.makedirs(out, exist_ok=True)
    return out

def cli():
    p = argparse.ArgumentParser(description="Build US pop-density raster + Voronoi; writes to ./outputs")
    p.add_argument("--year", type=int, default=2022, help="ACS 5-year vintage (default: 2022)")
    p.add_argument("--pix", type=int, default=10000, help="Raster pixel size meters (default: 10000 = 10km)")
    p.add_argument("--tiger_url", default=TIGER_URL, help="TIGER Block Group zip URL")
    p.add_argument("--make_voronoi", action="store_true", default=True, help="Also build Voronoi + stats (default: on)")
    p.add_argument("--target_pop_per_seed", type=int, default=1_000_000, help="People per seed (default: 1,000,000)")
    p.add_argument("--seed_floor", type=int, default=80, help="Minimum number of seeds (default: 80)")
    p.add_argument("--random_state", type=int, default=42, help="Random seed")
    p.add_argument("--no_all_touched", action="store_true", help="Rasterize with all_touched=False")
    return p.parse_args()

def read_tiger(url: str) -> gpd.GeoDataFrame:
    print(f"[1/6] Reading TIGER block groups…")
    gdf = gpd.read_file(url)
    gdf = gdf.to_crs(EQ_AREA_CRS)
    if "ALAND" in gdf.columns:
        gdf["land_m2"] = gdf["ALAND"].astype(float)
    else:
        gdf["land_m2"] = gdf.geometry.area
    gdf["land_km2"] = gdf["land_m2"] / 1e6
    print(f"   loaded {len(gdf):,} block groups")
    return gdf

def read_acs(year: int) -> pd.DataFrame:
    print(f"[2/6] Downloading ACS {year} B01003_001E (total population) for all states…")
    dfs: List[pd.DataFrame] = []
    for st in us.states.STATES:
        try:
            df = cd.download("acs/acs5", year,
                             cd.censusgeo([("state", st.fips), ("county","*"), ("tract","*"), ("block group","*")]),
                             ["B01003_001E"])
            df = df.rename(columns={"B01003_001E":"total_pop"}).reset_index()
            df["GEOID"] = df["index"].apply(lambda g: g.geo[0][1]+g.geo[1][1]+g.geo[2][1]+g.geo[3][1])
            dfs.append(df[["GEOID","total_pop"]])
            print(f"   {st.name:>12}: {len(df):6d}")
        except Exception as e:
            warnings.warn(f"ACS failed for {st.name}: {e}")
    out = pd.concat(dfs, ignore_index=True)
    print(f"   merged ACS rows: {len(out):,}")
    return out

def merge(bg: gpd.GeoDataFrame, acs: pd.DataFrame) -> gpd.GeoDataFrame:
    print(f"[3/6] Merging ACS onto TIGER…")
    g = bg.merge(acs, on="GEOID", how="left")
    g["total_pop"] = g["total_pop"].fillna(0)
    g["pop_density"] = (g["total_pop"] / g["land_km2"].replace({0: np.nan})).fillna(0.0)
    return g

def rasterize_density(bg: gpd.GeoDataFrame, pix: int, out_tif: str, all_touched=True) -> Tuple[str, Dict]:
    print(f"[4/6] Rasterizing pop_density at {pix} m → {out_tif}")
    xmin, ymin, xmax, ymax = bg.total_bounds
    width  = int(np.ceil((xmax - xmin) / pix))
    height = int(np.ceil((ymax - ymin) / pix))
    transform = from_origin(xmin, ymax, pix, pix)
    shapes = [(geom, float(val)) for geom, val in zip(bg.geometry, bg["pop_density"])]
    arr = rasterize(shapes, out_shape=(height, width), transform=transform,
                    fill=0.0, all_touched=all_touched, dtype="float32")
    profile = {"driver":"GTiff","height":height,"width":width,"count":1,"dtype":"float32",
               "crs":EQ_AREA_CRS,"transform":transform,"compress":"LZW"}
    with rasterio.open(out_tif, "w", **profile) as dst:
        dst.write(arr, 1)
    print(f"   wrote {out_tif}  [{width}×{height}]")
    return out_tif, profile

def build_voronoi(bg: gpd.GeoDataFrame, target_pop_per_seed: int, seed_floor: int, random_state: int):
    from geovoronoi import voronoi_regions_from_coords
    print(f"[5/6] Seeding (~1 per {target_pop_per_seed} ppl)…")
    poppos = bg[bg["total_pop"] > 0].copy()
    k = max(seed_floor, int(float(bg["total_pop"].sum()) // target_pop_per_seed))
    sel = poppos.sample(n=k, weights="total_pop", random_state=random_state)
    coords = np.array([[geom.centroid.x, geom.centroid.y] for geom in sel.geometry])

    print(f"[6/6] Building Voronoi regions…")
    boundary = unary_union(bg.geometry)
    regions, _ = voronoi_regions_from_coords(coords, boundary)
    gdf = gpd.GeoDataFrame(
        {"seed_x":[coords[i][0] for i in regions.keys()],
         "seed_y":[coords[i][1] for i in regions.keys()]},
        geometry=[regions[i] for i in regions.keys()],
        crs=EQ_AREA_CRS
    )
    return gdf

def add_zonal_stats(vrn: gpd.GeoDataFrame, raster_path: str, pix: int) -> gpd.GeoDataFrame:
    print("   Computing zonal stats over the pop-density raster…")
    stats = zonal_stats(vrn, raster_path, stats=["mean","median","min","max"], nodata=0.0)
    vrn = vrn.join(pd.DataFrame(stats))
    vrn["area_km2"] = vrn.geometry.area / 1e6
    da = rxr.open_rasterio(raster_path).squeeze()
    pix_area_km2 = (pix/1000.0)**2
    pops = []
    for geom in vrn.geometry:
        sub = da.rio.clip([geom.__geo_interface__], vrn.crs, drop=False, invert=False).values
        pops.append(float(np.nan_to_num(sub).sum() * pix_area_km2))
    vrn["pop_est"] = pops
    return vrn

def main():
    warnings.filterwarnings("ignore", category=UserWarning)
    args = cli()
    outdir = outputs_dir()
    out_tif = os.path.join(outdir, f"pop_density_{args.pix//1000}km_conus.tif")
    out_geo = os.path.join(outdir, "voronoi_conus.geojson")

    bg = read_tiger(args.tiger_url)
    acs = read_acs(args.year)
    bg = merge(bg, acs)
    rasterize_density(bg, pix=args.pix, out_tif=out_tif, all_touched=(not args.no_all_touched))

    if args.make_voronoi:
        vrn = build_voronoi(bg, args.target_pop_per_seed, args.seed_floor, args.random_state)
        vrn = add_zonal_stats(vrn, raster_path=out_tif, pix=args.pix)
        vrn.to_crs(WGS84).to_file(out_geo, driver="GeoJSON")
        print(f"   wrote {out_geo}")

    print("Done.")

if __name__ == "__main__":
    main()
