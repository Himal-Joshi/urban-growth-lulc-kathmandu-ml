import rasterio
import os
import sys

def check_cog(filepath):
    with rasterio.open(filepath) as src:
        is_tiled = src.is_tiled
        has_overviews = any(src.overviews(i) for i in src.indexes)
        return is_tiled and has_overviews

aligned_dir = "public/data/Aligned"
predicted_dir = "public/data/LULC Predicted"

for folder in [aligned_dir, predicted_dir]:
    if os.path.exists(folder):
        files = [f for f in os.listdir(folder) if f.endswith('.tif')]
        if files:
            first_file = os.path.join(folder, files[0])
            print(f"Checking {first_file}: Tiled+Overviews={check_cog(first_file)}")
