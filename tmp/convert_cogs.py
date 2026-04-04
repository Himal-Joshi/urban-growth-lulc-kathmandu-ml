import os
import rasterio
from rasterio.shutil import copy

def convert_to_cog(src_path):
    print(f"Converting {src_path} to COG...")
    tmp_path = src_path + ".tmp.tif"
    final_path = src_path + ".cog.tif"
    
    try:
        with rasterio.open(src_path) as src:
            profile = src.profile.copy()
            profile.update(
                driver="GTiff",
                tiled=True,
                compress="deflate",
                blockxsize=256,
                blockysize=256,
                interleave="pixel"
            )
            
            with rasterio.open(tmp_path, "w", **profile) as dst:
                for i in range(1, src.count + 1):
                    dst.write(src.read(i), i)
                
                # Build overviews
                overviews = [2, 4, 8, 16]
                dst.build_overviews(overviews, rasterio.enums.Resampling.nearest)
                dst.update_tags(ns='rio_overview', resampling='nearest')
                
        # Now copy it to a final COG to ensure IFD placement at the beginning
        with rasterio.open(tmp_path) as src:
            # copy creates a COG-optimized layout
            copy(src, final_path, copy_src_overviews=True, **profile)
            
        os.remove(tmp_path)
        os.replace(final_path, src_path)
        print(f"Done  {src_path}")
    except Exception as e:
        print(f"Failed {src_path}: {e}")
        if os.path.exists(tmp_path): os.remove(tmp_path)
        if os.path.exists(final_path): os.remove(final_path)

folders = ["public/data/Aligned", "public/data/LULC Predicted"]
for folder in folders:
    if os.path.exists(folder):
        files = [f for f in os.listdir(folder) if f.endswith(".tif") and not "tmp" in f and not "cog" in f]
        for idx, f in enumerate(files):
            print(f"[{idx+1}/{len(files)}] Processing in {folder}...")
            convert_to_cog(os.path.join(folder, f))
print("All files processed!")
