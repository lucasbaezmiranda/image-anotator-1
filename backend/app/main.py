from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import os
import csv

app = FastAPI()

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia esto para producción con el dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo para las anotaciones
class Annotation(BaseModel):
    x: int
    y: int
    size: int
    color: str
    image: str  # Nombre de la imagen asociada

# Servir archivos estáticos desde la carpeta "images"
app.mount("/images", StaticFiles(directory="images"), name="images")

# Endpoint para listar todas las imágenes en la carpeta "images"
@app.get("/list-images/")
def list_images():
    image_folder = "images"
    try:
        files = os.listdir(image_folder)
        images = [file for file in files if file.lower().endswith(("png", "jpg", "jpeg"))]
        return {"images": images}
    except FileNotFoundError:
        return {"error": f"Folder '{image_folder}' not found."}

# Endpoint para guardar anotaciones en bloque
@app.post("/annotations/bulk")
def save_annotations_bulk(annotations: List[Annotation]):
    try:
        with open("annotations.csv", "w", newline="") as file:
            writer = csv.DictWriter(file, fieldnames=["x", "y", "size", "color", "image"])
            writer.writeheader()
            for annotation in annotations:
                writer.writerow(annotation.dict())
        return {"message": "Annotations saved successfully"}
    except Exception as e:
        return {"error": f"Failed to save annotations: {e}"}
