dibujarSerpiente() {
    // 1. Actualiza la dirección actual con la siguiente dirección deseada.
    // Esto asegura que la serpiente cambie de dirección de manera fluida en el próximo paso.
    this.direccion = this.siguienteDireccion;

    // 2. Mueve cada segmento del cuerpo de la serpiente a la posición del segmento anterior.
    // Se itera desde el último segmento hasta el segundo (índice 1).
    // Esto crea el efecto de "seguimiento" donde el cuerpo arrastra el último segmento
    // a la posición del penúltimo, y así sucesivamente, hasta la cabeza.
    for (let i = this.serpiente.length - 1; i >= 1; i--) {
        this.serpiente[i].x = this.serpiente[i - 1].x;
        this.serpiente[i].y = this.serpiente[i - 1].y;
    }

    // 3. Mueve la cabeza de la serpiente (primer segmento, índice 0)
    // según la dirección actual del movimiento.
    switch (this.direccion) {
        case this.direcciones.derecha:
            this.serpiente[0].x++;
            break;
        case this.direcciones.izquierda:
            this.serpiente[0].x--;
            break;
        case this.direcciones.arriba:
            this.serpiente[0].y--;
            break;
        case this.direcciones.abajo:
            this.serpiente[0].y++;
            break;
    }

    // 4. Verifica si la nueva posición de la cabeza resulta en una colisión.
    // Se comprueban dos tipos de colisiones:
    // a) Colisión con límites del tablero, paredes u obstáculos (`this.colisionaConAlgo()`).
    // b) Colisión de la cabeza con cualquier parte de su propio cuerpo (`this.colisionaConSerpiente()`).
    if (this.colisionaConAlgo() || this.colisionaConSerpiente()) {
        console.log("¡A punto de chocar!"); // Mensaje de depuración
        return false; // Indica al bucle principal que el juego ha terminado.
    }

    // 5. Si no hay colisión, procede a dibujar cada pedazo de la serpiente en el canvas.
    // Se utiliza un bucle para dibujar cada segmento individualmente.
    for (let i = 0; i < this.serpiente.length; i++) {
        // La cabeza se dibuja en un color cian brillante para distinguirla del cuerpo.
        // El resto del cuerpo se dibuja en un azul claro.
        this.canvasCtx.fillStyle = (i === 0) ? "#00FFFF" : "#00BFFF"; // Cabeza cian, cuerpo azul claro
        this.canvasCtx.fillRect(
            this.serpiente[i].x * TAMANIO_SPRITES,
            this.serpiente[i].y * TAMANIO_SPRITES,
            TAMANIO_SPRITES,
            TAMANIO_SPRITES
        );
        // Además, se añade un borde a cada segmento para una apariencia más definida y "futurista".
        this.canvasCtx.strokeStyle = "#0077FF"; // Borde azul más oscuro
        this.canvasCtx.lineWidth = 2; // Grosor del borde
        this.canvasCtx.strokeRect(
            this.serpiente[i].x * TAMANIO_SPRITES,
            this.serpiente[i].y * TAMANIO_SPRITES,
            TAMANIO_SPRITES,
            TAMANIO_SPRITES
        );
    }
    return true; // Indica que la serpiente se movió y se dibujó correctamente.
}