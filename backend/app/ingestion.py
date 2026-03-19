import os
import requests

def download_sample_data():
    """
    Placeholder to simulate data ingestion from mPower, PC-GITA, etc.
    """
    data_dir = "data/raw"
    os.makedirs(f"{data_dir}/audio", exist_ok=True)
    os.makedirs(f"{data_dir}/images", exist_ok=True)
    
    print("Ingestion pipeline initialized. Ready to download from:")
    print("- mPower (Audio)")
    print("- PC-GITA (Audio)")
    print("- HandPD (Images)")
    print("- PaHaW (Handwriting)")

if __name__ == "__main__":
    download_sample_data()
