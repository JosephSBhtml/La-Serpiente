document.addEventListener("DOMContentLoaded", () => {

    // Constantes para identificar elementos en la matriz del juego
    const NADA = 0,
        PIEDRA = 1,
        MANZANA = 2,
        TAMANIO_SPRITES = 20, // Tamaño de cada celda (20 píxeles)
        PARED_IZQUIERDA = 4,
        PARED_DERECHA = 5,
        PARED_ARRIBA = 6,
        PARED_ABAJO = 7,
        OBSTACULO = 8; // Nueva constante para los obstáculos

    let juegoComenzado = false,
        $canvas = document.querySelector("#canvas");

    // Clase para representar un pedazo de la serpiente
    class PedazoSerpiente {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    // Clase principal del juego
    class Juego {
        constructor() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.bufferSonidoComerManzana = null;
            this.cargarEfectosDeSonido();

            this.teclas = {
                "39": "derecha",
                "37": "izquierda",
                "38": "arriba",
                "40": "abajo"
            };

            // La serpiente se inicializa en una posición central y con 3 pedazos
            // Las posiciones iniciales se calcularán en reiniciarJuego() para asegurar que el canvas tenga tamaño.
            this.serpiente = []; 

            this.canvas = $canvas;
            this.canvasCtx = this.canvas.getContext("2d");

            // Establecer un tamaño fijo para el canvas para un diseño consistente
            const boardWidth = 800; // Ancho del tablero en píxeles (aumentado)
            const boardHeight = 600; // Alto del tablero en píxeles (aumentado)
            this.canvas.width = boardWidth;
            this.canvas.height = boardHeight;

            this.longitudX = parseInt(this.canvas.width / TAMANIO_SPRITES);
            this.longitudY = parseInt(this.canvas.height / TAMANIO_SPRITES);

            this.matriz = this.obtenerMatrizEscenario(this.longitudY, this.longitudX);

            this.velocidadInicial = 150;
            this.velocidad = 1;
            this.incrementoVelocidad = 0.05;

            this.direcciones = {
                derecha: 1,
                izquierda: 2,
                arriba: 3,
                abajo: 4
            };
            this.siguienteDireccion = this.direcciones.derecha;
            this.direccion = this.direcciones.derecha;

            this.puntuacion = 0;

            // Manejo de eventos para el control de la serpiente (clic/toque)
            this.canvas.addEventListener("click", evento => {
                let rect = this.canvas.getBoundingClientRect();
                let x = evento.clientX - rect.left;
                let y = evento.clientY - rect.top;

                let tercioXCanvas = this.canvas.width / 3;
                let tercioYCanvas = this.canvas.height / 3;

                if (x <= tercioXCanvas && y >= tercioYCanvas && y <= tercioYCanvas * 2) {
                    if (this.direccion === this.direcciones.arriba || this.direccion === this.direcciones.abajo)
                        this.siguienteDireccion = this.direcciones.izquierda;
                } else if (
                    x >= tercioXCanvas * 2 &&
                    x <= tercioXCanvas * 3 &&
                    y >= tercioYCanvas &&
                    y <= tercioYCanvas * 2
                ) {
                    if (this.direccion === this.direcciones.arriba || this.direccion === this.direcciones.abajo)
                        this.siguienteDireccion = this.direcciones.derecha;
                } else if (
                    x >= tercioXCanvas &&
                    x <= tercioXCanvas * 2 &&
                    y >= 0 &&
                    y <= tercioYCanvas
                ) {
                    if (this.direccion === this.direcciones.derecha || this.direccion === this.direcciones.izquierda)
                        this.siguienteDireccion = this.direcciones.arriba;
                } else if (
                    x >= tercioXCanvas &&
                    x <= tercioXCanvas * 2 &&
                    y >= tercioYCanvas * 2 &&
                    y <= tercioYCanvas * 3
                ) {
                    if (this.direccion === this.direcciones.derecha || this.direccion === this.direcciones.izquierda)
                        this.siguienteDireccion = this.direcciones.abajo;
                }
            });

            // Manejo de eventos para el control de la serpiente (teclado)
            document.addEventListener("keydown", evento => {
                let direccion = this.teclas[evento.keyCode];
                if (direccion) {
                    if (
                        (this.direccion === this.direcciones.derecha || this.direccion === this.direcciones.izquierda) &&
                        (direccion === "arriba" || direccion === "abajo")
                    )
                        this.siguienteDireccion = this.direcciones[direccion];
                    else if (
                        (this.direccion === this.direcciones.arriba || this.direccion === this.direcciones.abajo) &&
                        (direccion === "derecha" || direccion === "izquierda")
                    )
                        this.siguienteDireccion = this.direcciones[direccion];
                }
            });

            this.reiniciarJuego();
        }

        // Método para colocar una manzana en una posición aleatoria y vacía
        ponerManzanaEnAlgunLugar() {
            let x, y;
            do {
                x = Math.floor(Math.random() * (this.longitudX - 2)) + 1;
                y = Math.floor(Math.random() * (this.longitudY - 2)) + 1;
            } while (this.matriz[x][y] !== NADA || this.esPosicionDeSerpiente(x, y) || this.matriz[x][y] === OBSTACULO); // Asegurarse de no colocar sobre obstáculos
            this.matriz[x][y] = MANZANA;
        }

        // Método para colocar obstáculos en posiciones aleatorias y vacías
        ponerObstaculosEnAlgunLugar(cantidad) {
            for (let i = 0; i < cantidad; i++) {
                let x, y;
                do {
                    x = Math.floor(Math.random() * (this.longitudX - 2)) + 1;
                    y = Math.floor(Math.random() * (this.longitudY - 2)) + 1;
                } while (this.matriz[x][y] !== NADA || this.esPosicionDeSerpiente(x, y) || this.matriz[x][y] === MANZANA); // Asegurarse de no colocar sobre serpiente o manzana
                this.matriz[x][y] = OBSTACULO;
            }
        }

        // Verifica si una posición dada es parte de la serpiente
        esPosicionDeSerpiente(x, y) {
            for (let i = 0; i < this.serpiente.length; i++) {
                if (this.serpiente[i].x === x && this.serpiente[i].y === y) {
                    return true;
                }
            }
            return false;
        }

        // Agrega un nuevo pedazo a la serpiente
        agregarPedazo() {
            const lastPedazo = this.serpiente[this.serpiente.length - 1];
            this.serpiente.push(new PedazoSerpiente(lastPedazo.x, lastPedazo.y));
        }

        // Dibuja la serpiente y actualiza sus posiciones
        dibujarSerpiente() {
            this.direccion = this.siguienteDireccion;
            for (let i = this.serpiente.length - 1; i >= 1; i--) {
                this.serpiente[i].x = this.serpiente[i - 1].x;
                this.serpiente[i].y = this.serpiente[i - 1].y;
            }

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

            if (this.colisionaConAlgo() || this.colisionaConSerpiente()) {
                console.log("¡A punto de chocar!");
                return false;
            }

            // Dibujar cada pedazo de la serpiente con colores y un estilo más "futurista"
            for (let i = 0; i < this.serpiente.length; i++) {
                this.canvasCtx.fillStyle = (i === 0) ? "#00FFFF" : "#00BFFF"; // Cabeza cian, cuerpo azul claro
                this.canvasCtx.fillRect(
                    this.serpiente[i].x * TAMANIO_SPRITES,
                    this.serpiente[i].y * TAMANIO_SPRITES,
                    TAMANIO_SPRITES,
                    TAMANIO_SPRITES
                );
                // Añadir un pequeño borde para definir los segmentos
                this.canvasCtx.strokeStyle = "#0077FF"; // Borde azul más oscuro
                this.canvasCtx.lineWidth = 2; // Grosor del borde
                this.canvasCtx.strokeRect(
                    this.serpiente[i].x * TAMANIO_SPRITES,
                    this.serpiente[i].y * TAMANIO_SPRITES,
                    TAMANIO_SPRITES,
                    TAMANIO_SPRITES
                );
            }
            return true;
        }

        // Reinicia el estado del juego
        reiniciarJuego() {
            juegoComenzado = true;
            // Inicializa la serpiente en una posición central
            this.serpiente = [
                new PedazoSerpiente(Math.floor(this.longitudX / 2), Math.floor(this.longitudY / 2)),
                new PedazoSerpiente(Math.floor(this.longitudX / 2) - 1, Math.floor(this.longitudY / 2)),
                new PedazoSerpiente(Math.floor(this.longitudX / 2) - 2, Math.floor(this.longitudY / 2))
            ];
            this.siguienteDireccion = this.direcciones.derecha;
            this.direccion = this.direcciones.derecha;
            this.velocidad = 1;
            this.puntuacion = 0;

            this.matriz = this.obtenerMatrizEscenario(this.longitudY, this.longitudX);
            this.ponerManzanaEnAlgunLugar();
            this.ponerObstaculosEnAlgunLugar(15); // Aumentado a 15 obstáculos para mayor desafío

            this.dibujar();
        }

        // Se llama cuando la serpiente come una manzana
        onManzanaComida() {
            this.reproducirSonidoDeManzanaComida(); // Descomentado para reproducir el sonido
            this.agregarPedazo();
            this.aumentarVelocidad();
            this.puntuacion += 10;
            this.ponerManzanaEnAlgunLugar();
        }

        // Aumenta la velocidad del juego
        aumentarVelocidad() {
            this.velocidad += this.incrementoVelocidad;
        }

        // Funciones de sonido
        cargarEfectosDeSonido() {
            var context = new AudioContext();
            let peticion = new XMLHttpRequest(),
                _this = this;
            peticion.open('GET', "assets/apple-crunch-16.wav", true);
            peticion.responseType = 'arraybuffer';

            peticion.onload = function () {
                context.decodeAudioData(peticion.response, function (buffer) {
                    _this.bufferSonidoComerManzana = buffer;
                });
            }
            peticion.send();
        }
        reproducirSonidoDeManzanaComida() {
            if (this.bufferSonidoComerManzana) {
                var context = new AudioContext();
                var source = context.createBufferSource();
                source.buffer = this.bufferSonidoComerManzana;
                source.connect(context.destination);
                source.start(0);
            } else {
                console.log("No hay sonido")
            }
        }

        // Bucle principal de dibujo del juego
        dibujar() {
            this.limpiarEscenario();
            this.dibujarMatriz();

            let sePudoDibujarLaSerpiente = this.dibujarSerpiente();

            if (sePudoDibujarLaSerpiente) {
                if (this.matriz[this.serpiente[0].x][this.serpiente[0].y] === MANZANA) {
                    this.matriz[this.serpiente[0].x][this.serpiente[0].y] = NADA;
                    this.onManzanaComida();
                }
                // Dibuja la puntuación
                this.canvasCtx.font = "18px 'Share Tech Mono'";
                this.canvasCtx.fillStyle = "#00FFFF"; // Color cian para la puntuación
                this.canvasCtx.textAlign = "left";
                this.canvasCtx.fillText(`Puntuación: ${this.puntuacion}`, TAMANIO_SPRITES, TAMANIO_SPRITES + 5);


                setTimeout(() => {
                    this.dibujar();
                }, this.velocidadInicial / this.velocidad);
            } else {
                this.mostrarGameOver();
            }
        }

        // Verifica si la serpiente colisiona con una pared o los límites del canvas
        colisionaConAlgo() {
            let head = this.serpiente[0];
            // Comprueba si la cabeza está fuera de los límites del tablero
            if (head.x < 0 || head.x >= this.longitudX || head.y < 0 || head.y >= this.longitudY) {
                return true;
            }
            // Comprueba si la cabeza está en una posición de pared o obstáculo
            return this.matriz[head.x][head.y] === PARED_ABAJO ||
                   this.matriz[head.x][head.y] === PARED_ARRIBA ||
                   this.matriz[head.x][head.y] === PARED_DERECHA ||
                   this.matriz[head.x][head.y] === PARED_IZQUIERDA ||
                   this.matriz[head.x][head.y] === OBSTACULO; // Nueva comprobación para obstáculos
        }

        // Verifica si la serpiente colisiona consigo misma
        colisionaConSerpiente() {
            let head = this.serpiente[0];
            for (let i = 1; i < this.serpiente.length; i++) {
                if (head.x === this.serpiente[i].x && head.y === this.serpiente[i].y) {
                    return true;
                }
            }
            return false;
        }

        // Muestra la pantalla de Game Over
        mostrarGameOver() {
            juegoComenzado = false;
            this.limpiarEscenario();
            this.canvasCtx.fillStyle = "#FF00FF"; // Color magenta para el texto de Game Over
            this.canvasCtx.font = "40px 'Share Tech Mono'";
            this.canvasCtx.textAlign = "center";
            this.canvasCtx.fillText("¡GAME OVER!", this.canvas.width / 2, this.canvas.height / 2 - 40);

            this.canvasCtx.font = "24px 'Share Tech Mono'";
            this.canvasCtx.fillStyle = "#00FFFF"; // Color cian para la puntuación
            this.canvasCtx.fillText(`Puntuación Final: ${this.puntuacion}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

            this.canvasCtx.font = "16px 'Share Tech Mono'";
            this.canvasCtx.fillStyle = "#9999FF"; // Color azul claro para el texto de reinicio
            this.canvasCtx.fillText("Presiona Enter o haz clic para reiniciar", this.canvas.width / 2, this.canvas.height / 2 + 60);
        }

        // Crea la matriz del escenario con paredes
        obtenerMatrizEscenario(altura, anchura) {
            let matriz = [];
            for (let x = 0; x < anchura; x++) {
                matriz.push([]);
                for (let y = 0; y < altura; y++) {
                    if (x === 0) matriz[x].push(PARED_IZQUIERDA);
                    else if (x === anchura - 1) matriz[x].push(PARED_DERECHA);
                    else if (y === 0) matriz[x].push(PARED_ARRIBA);
                    else if (y === altura - 1) matriz[x].push(PARED_ABAJO);
                    else matriz[x].push(NADA);
                }
            }
            return matriz;
        }

        // Dibuja los elementos de la matriz (paredes, manzana y obstáculos)
        dibujarMatriz() {
            for (let x = 0; x < this.matriz.length; x++) {
                for (let y = 0; y < this.matriz[x].length; y++) {
                    switch (this.matriz[x][y]) {
                        case PARED_ARRIBA:
                        case PARED_ABAJO:
                        case PARED_DERECHA:
                        case PARED_IZQUIERDA:
                            this.canvasCtx.fillStyle = "#4B0082"; // Color índigo oscuro para las paredes
                            this.canvasCtx.fillRect(
                                x * TAMANIO_SPRITES,
                                y * TAMANIO_SPRITES,
                                TAMANIO_SPRITES,
                                TAMANIO_SPRITES
                            );
                            break;
                        case MANZANA:
                            this.canvasCtx.fillStyle = "#FF00FF"; // Color magenta brillante para la manzana
                            this.canvasCtx.beginPath();
                            this.canvasCtx.arc(
                                x * TAMANIO_SPRITES + TAMANIO_SPRITES / 2,
                                y * TAMANIO_SPRITES + TAMANIO_SPRITES / 2,
                                TAMANIO_SPRITES / 2 * 0.7, // Radio un poco más pequeño
                                0,
                                Math.PI * 2
                            );
                            this.canvasCtx.fill();
                            break;
                        case OBSTACULO: // Nuevo caso para dibujar obstáculos
                            this.canvasCtx.fillStyle = "#8e44ad"; // Color púrpura para los obstáculos
                            this.canvasCtx.fillRect(
                                x * TAMANIO_SPRITES,
                                y * TAMANIO_SPRITES,
                                TAMANIO_SPRITES,
                                TAMANIO_SPRITES
                            );
                            // Opcional: añadir un borde para resaltarlos
                            this.canvasCtx.strokeStyle = "#9b59b6";
                            this.canvasCtx.lineWidth = 2;
                            this.canvasCtx.strokeRect(
                                x * TAMANIO_SPRITES,
                                y * TAMANIO_SPRITES,
                                TAMANIO_SPRITES,
                                TAMANIO_SPRITES
                            );
                            break;
                    }
                }
            }
        }

        // Limpia todo el canvas
        limpiarEscenario() {
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Configuración inicial del canvas y mensaje de inicio
    const initialBoardWidth = 800; // Ancho del tablero en píxeles (aumentado)
    const initialBoardHeight = 600; // Alto del tablero en píxeles (aumentado)
    $canvas.width = initialBoardWidth;
    $canvas.height = initialBoardHeight;

    var ctx = $canvas.getContext("2d");
    ctx.font = "20px 'Share Tech Mono'";
    ctx.fillStyle = "#00FFFF"; // Color cian para el texto inicial
    ctx.textAlign = "center";
    ctx.fillText(
        "Toca la pantalla, haz clic o presiona Enter para comenzar",
        $canvas.width / 2,
        $canvas.height / 2 - 20
    );

    ctx.font = "14px 'Share Tech Mono'";
    ctx.fillStyle = "#9999FF"; // Color azul claro para el texto secundario
    ctx.fillText(
        "Hecho por: Joseph Rivas",
        $canvas.width / 2,
        ($canvas.height / 2) + 20
    );

    // Eventos para iniciar o reiniciar el juego
    document.addEventListener("keyup", evento => {
        if (evento.keyCode === 13) {
            if (!juegoComenzado) {
                new Juego();
            }
        }
    });
    $canvas.addEventListener("click", () => {
        if (!juegoComenzado) {
            new Juego();
        }
    });
});
