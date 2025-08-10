#!/bin/bash

# Quality setting for WebP (0–100)
QUALITY=100

# Find all PNG and JPG/JPEG images recursively
find . -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r img; do
    # Output file path with .webp extension
    webp_file="${img%.*}.webp"

    # Convert to WebP
    if cwebp -q $QUALITY "$img" -o "$webp_file" >/dev/null 2>&1; then
        echo "Converted: $img -> $webp_file"
        rm "$img"
    else
        echo "Failed to convert: $img"
    fi
done
