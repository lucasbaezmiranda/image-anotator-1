import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";

const Canvas = () => {
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [annotations, setAnnotations] = useState([]); // Anotaciones acumuladas

    // Obtener la lista de imágenes del backend
    useEffect(() => {
        api.get("/list-images/")
            .then((response) => {
                setImages(response.data.images);
            })
            .catch((error) => console.error("Error fetching images:", error));
    }, []);

    // Cargar la imagen actual en el canvas
    useEffect(() => {
        if (images.length > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            const image = new Image();

            // Cargar la imagen actual
            image.src = `http://127.0.0.1:8000/images/${images[currentImageIndex]}`;
            image.onload = () => {
                // Limpiar el canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Calcular proporciones para mantener la relación de aspecto
                const canvasAspectRatio = canvas.width / canvas.height;
                const imageAspectRatio = image.width / image.height;

                let renderWidth, renderHeight;
                if (imageAspectRatio > canvasAspectRatio) {
                    // La imagen es más ancha que el canvas
                    renderWidth = canvas.width;
                    renderHeight = canvas.width / imageAspectRatio;
                } else {
                    // La imagen es más alta que el canvas
                    renderHeight = canvas.height;
                    renderWidth = canvas.height * imageAspectRatio;
                }

                // Dibujar la imagen centrada en el canvas
                const offsetX = (canvas.width - renderWidth) / 2;
                const offsetY = (canvas.height - renderHeight) / 2;
                ctx.drawImage(image, offsetX, offsetY, renderWidth, renderHeight);
            };
        }
    }, [images, currentImageIndex]);

    // Manejar clics en el canvas (dibujar círculos)
    const handleCanvasClick = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Dibujar el círculo en el canvas
        const ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();

        // Agregar la anotación al estado
        const newAnnotation = {
            x: Math.round(x),
            y: Math.round(y),
            size: 10,
            color: "red",
            image: images[currentImageIndex], // Asociar la anotación con la imagen actual
        };
        setAnnotations((prev) => [...prev, newAnnotation]);
    };

    // Pasar a la siguiente imagen
    const nextImage = () => {
        if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        } else {
            alert("No hay más imágenes.");
        }
    };

    // Pasar a la imagen anterior
    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    // Guardar las anotaciones en el backend
    const saveAnnotations = () => {
        if (annotations.length === 0) {
            alert("No hay anotaciones para guardar.");
            return;
        }

        api.post("/annotations/bulk", annotations)
            .then(() => {
                alert("Anotaciones guardadas correctamente.");
                setAnnotations([]); // Limpiar las anotaciones locales
            })
            .catch((error) => console.error("Error saving annotations:", error));
    };

    return (
        <div>
            <h1>Image Annotation Tool</h1>
            {images.length > 0 ? (
                <div>
                    <canvas
                        ref={canvasRef}
                        width={800} // Tamaño fijo del canvas
                        height={600}
                        style={{ border: "1px solid black" }}
                        onClick={handleCanvasClick}
                    />
                    <div>
                        <button onClick={prevImage} disabled={currentImageIndex === 0}>
                            Anterior
                        </button>
                        <button onClick={nextImage} disabled={currentImageIndex === images.length - 1}>
                            Siguiente
                        </button>
                        <button onClick={saveAnnotations}>Guardar resultados</button>
                    </div>
                </div>
            ) : (
                <p>Cargando imágenes...</p>
            )}
        </div>
    );
};

export default Canvas;
