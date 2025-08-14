// Configuración del juego
const DIFICULTADES = {
    facil: { min: 1, max: 10, nombre: 'Fácil' },
    medio: { min: 1, max: 50, nombre: 'Medio' },
    dificil: { min: 1, max: 100, nombre: 'Difícil' }
};

const MODALIDADES = {
    clasico: {
        nombre: 'Clásico',
        descripcion: 'Intentos ilimitados',
        intentos: {
            facil: Infinity,
            medio: Infinity,
            dificil: Infinity
        }
    },
    desafio: {
        nombre: 'Desafío',
        descripcion: 'Intentos limitados',
        intentos: {
            facil: 5,
            medio: 7,
            dificil: 10
        }
    },
    experto: {
        nombre: 'Experto',
        descripcion: 'Muy pocos intentos',
        intentos: {
            facil: 3,
            medio: 5,
            dificil: 7
        }
    }
};

// Estado del juego
class JuegoNumeroSecreto {
    constructor() {
        this.dificultad = 'facil';
        this.modalidad = 'clasico';
        this.numeroMaximo = DIFICULTADES[this.dificultad].max;
        this.numeroMinimo = DIFICULTADES[this.dificultad].min;
        this.intentosMaximos = MODALIDADES[this.modalidad].intentos[this.dificultad];
        this.reset();
        this.cargarEstadisticas();
    }

    reset() {
        this.listaNumerosSorteados = [];
        this.intentos = 0;
        this.intentosMaximos = MODALIDADES[this.modalidad].intentos[this.dificultad];
        this.numeroSecreto = this.generarNumeroSecreto();
        this.juegoTerminado = false;
        this.juegoGanado = false;
        this.puntaje = 0;
        this.actualizarProgreso();
    }

    generarNumeroSecreto() {
        // Si ya se sortearon todos los números posibles
        if (this.listaNumerosSorteados.length >= this.numeroMaximo) {
            return null; // Indicar que no hay más números disponibles
        }

        let numeroGenerado;
        do {
            numeroGenerado = Math.floor(Math.random() * this.numeroMaximo) + this.numeroMinimo;
        } while (this.listaNumerosSorteados.includes(numeroGenerado));

        this.listaNumerosSorteados.push(numeroGenerado);
        return numeroGenerado;
    }

    verificarIntento(numeroUsuario) {
        if (this.juegoTerminado) return;

        this.intentos++;
        const intentosRestantes = this.intentosMaximos - this.intentos;
        
        if (numeroUsuario === this.numeroSecreto) {
            this.juegoTerminado = true;
            this.juegoGanado = true;
            this.puntaje = this.calcularPuntaje();
            this.actualizarEstadisticas();
            return {
                resultado: 'acierto',
                mensaje: `🎉 ¡Excelente! Acertaste en ${this.intentos} ${this.intentos === 1 ? 'intento' : 'intentos'}`,
                puntaje: this.puntaje,
                intentosRestantes: intentosRestantes
            };
        } else if (intentosRestantes <= 0 && this.intentosMaximos !== Infinity) {
            // Se acabaron los intentos
            this.juegoTerminado = true;
            this.juegoGanado = false;
            this.actualizarEstadisticasDerrota();
            return {
                resultado: 'derrota',
                mensaje: `💀 ¡Se acabaron los intentos! El número era ${this.numeroSecreto}`,
                numeroSecreto: this.numeroSecreto,
                intentosRestantes: 0
            };
        } else if (numeroUsuario > this.numeroSecreto) {
            return {
                resultado: 'mayor',
                mensaje: `📉 El número secreto es menor ${intentosRestantes === Infinity ? '' : `(${intentosRestantes} intentos restantes)`}`,
                hint: this.generarHint(numeroUsuario),
                intentosRestantes: intentosRestantes
            };
        } else {
            return {
                resultado: 'menor',
                mensaje: `📈 El número secreto es mayor ${intentosRestantes === Infinity ? '' : `(${intentosRestantes} intentos restantes)`}`,
                hint: this.generarHint(numeroUsuario),
                intentosRestantes: intentosRestantes
            };
        }
    }

    generarHint(numeroUsuario) {
        const diferencia = Math.abs(numeroUsuario - this.numeroSecreto);
        const rango = this.numeroMaximo - this.numeroMinimo + 1;
        
        if (diferencia <= rango * 0.1) {
            return "🔥 ¡Muy caliente! Estás súper cerca";
        } else if (diferencia <= rango * 0.2) {
            return "♨️ Caliente, te estás acercando";
        } else if (diferencia <= rango * 0.4) {
            return "🌡️ Tibio, sigue intentando";
        } else {
            return "❄️ Frío, estás lejos";
        }
    }

    calcularPuntaje() {
        const puntajeBase = 1000;
        const bonusDificultad = {
            facil: 1,
            medio: 2,
            dificil: 3
        };

        const bonusModalidad = {
            clasico: 1,
            desafio: 1.5,
            experto: 2
        };
        
        const penalizacionIntentos = Math.max(0, (this.intentos - 1) * 50);
        const puntajeFinal = Math.max(
            (puntajeBase - penalizacionIntentos) * bonusDificultad[this.dificultad] * bonusModalidad[this.modalidad],
            100
        );
        
        return Math.round(puntajeFinal);
    }

    actualizarProgreso() {
        const progreso = (this.listaNumerosSorteados.length / this.numeroMaximo) * 100;
        document.getElementById('progress-fill').style.width = `${progreso}%`;
    }

    cambiarDificultad(nuevaDificultad) {
        this.dificultad = nuevaDificultad;
        this.numeroMaximo = DIFICULTADES[nuevaDificultad].max;
        this.numeroMinimo = DIFICULTADES[nuevaDificultad].min;
        
        // Actualizar el input
        const input = document.getElementById('valorUsuario');
        input.min = this.numeroMinimo;
        input.max = this.numeroMaximo;
        
        this.reset();
    }

    cambiarModalidad(nuevaModalidad) {
        this.modalidad = nuevaModalidad;
        this.reset();
    }

    cargarEstadisticas() {
        const stats = JSON.parse(localStorage.getItem('juegoStats') || '{}');
        this.estadisticas = {
            mejorPuntaje: stats.mejorPuntaje || 0,
            partidasGanadas: stats.partidasGanadas || 0,
            totalPartidas: stats.totalPartidas || 0,
            partidasPerdidas: stats.partidasPerdidas || 0
        };
    }

    actualizarEstadisticas() {
        this.estadisticas.partidasGanadas++;
        this.estadisticas.totalPartidas++;
        
        if (this.puntaje > this.estadisticas.mejorPuntaje) {
            this.estadisticas.mejorPuntaje = this.puntaje;
        }

        localStorage.setItem('juegoStats', JSON.stringify(this.estadisticas));
    }

    actualizarEstadisticasDerrota() {
        this.estadisticas.partidasPerdidas++;
        this.estadisticas.totalPartidas++;
        localStorage.setItem('juegoStats', JSON.stringify(this.estadisticas));
    }
}

// Instancia del juego
const juego = new JuegoNumeroSecreto();

// Funciones de UI
function actualizarUI() {
    const config = DIFICULTADES[juego.dificultad];
    const modoConfig = MODALIDADES[juego.modalidad];
    const intentosMax = modoConfig.intentos[juego.dificultad];
    
    document.getElementById('instrucciones').textContent = 
        `Adivina el número entre ${config.min} y ${config.max} - Modo: ${modoConfig.nombre}`;
    
    document.getElementById('intentos-display').textContent = juego.intentos;
    document.getElementById('puntaje-display').textContent = juego.puntaje;
    document.getElementById('mejor-puntaje').textContent = juego.estadisticas.mejorPuntaje;
    document.getElementById('partidas-ganadas').textContent = juego.estadisticas.partidasGanadas;
    
    // Actualizar intentos restantes
    const intentosRestantes = intentosMax === Infinity ? '∞' : (intentosMax - juego.intentos);
    document.getElementById('intentos-restantes').textContent = intentosRestantes;
    
    // Cambiar color si quedan pocos intentos
    const intentosRestantesEl = document.getElementById('intentos-restantes');
    const statEl = intentosRestantesEl.parentElement;
    
    statEl.className = 'stat';
    if (intentosMax !== Infinity) {
        const restantes = intentosMax - juego.intentos;
        if (restantes <= 1) {
            statEl.classList.add('intentos-danger');
        } else if (restantes <= 2) {
            statEl.classList.add('intentos-warning');
        }
    }
}

function mostrarMensaje(texto, tipo = 'info', mostrarHint = null) {
    const mensajeEl = document.getElementById('mensaje');
    const hintEl = document.getElementById('hint-container');
    
    mensajeEl.textContent = texto;
    mensajeEl.className = `mensaje ${tipo} bounce-in`;
    
    if (mostrarHint) {
        hintEl.textContent = mostrarHint;
        hintEl.style.display = 'block';
        hintEl.className = 'hint fade-in';
    } else {
        hintEl.style.display = 'none';
    }
}

function validarEntrada(valor) {
    const input = document.getElementById('valorUsuario');
    
    if (!valor || isNaN(valor)) {
        mostrarMensaje('❌ Por favor, ingresa un número válido', 'error');
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
        return false;
    }

    if (valor < juego.numeroMinimo || valor > juego.numeroMaximo) {
        mostrarMensaje(
            `❌ El número debe estar entre ${juego.numeroMinimo} y ${juego.numeroMaximo}`, 
            'error'
        );
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
        return false;
    }

    input.classList.remove('error');
    return true;
}

function verificarIntento() {
    const input = document.getElementById('valorUsuario');
    const numeroUsuario = parseInt(input.value);

    if (!validarEntrada(numeroUsuario)) {
        input.focus();
        return;
    }

    if (juego.numeroSecreto === null) {
        mostrarMensaje('🎊 ¡Has completado todos los números posibles!', 'success');
        document.getElementById('reiniciar').disabled = false;
        return;
    }

    const resultado = juego.verificarIntento(numeroUsuario);
    
    if (resultado.resultado === 'acierto') {
        input.classList.add('success');
        mostrarMensaje(resultado.mensaje, 'success');
        document.getElementById('reiniciar').disabled = false;
        document.getElementById('btn-intentar').disabled = true;
        
        // Animación de celebración
        document.querySelector('.container').style.animation = 'pulse 0.6s ease-in-out';
        setTimeout(() => {
            document.querySelector('.container').style.animation = '';
        }, 600);
        
    } else if (resultado.resultado === 'derrota') {
        input.classList.add('error');
        mostrarMensaje(resultado.mensaje, 'error');
        document.getElementById('reiniciar').disabled = false;
        document.getElementById('btn-intentar').disabled = true;
        
        // Animación de derrota
        document.querySelector('.container').style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            document.querySelector('.container').style.animation = '';
        }, 500);
        
    } else {
        mostrarMensaje(resultado.mensaje, 'error', resultado.hint);
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
    }

    juego.actualizarProgreso();
    actualizarUI();
    limpiarCaja();
}

function limpiarCaja() {
    const input = document.getElementById('valorUsuario');
    input.value = '';
    input.classList.remove('error', 'success');
    if (!juego.juegoTerminado) {
        input.focus();
    }
}

function reiniciarJuego() {
    juego.reset();
    
    document.getElementById('reiniciar').disabled = true;
    document.getElementById('btn-intentar').disabled = false;
    
    mostrarMensaje('🎯 ¡Nuevo juego iniciado!', 'info');
    
    actualizarUI();
    limpiarCaja();
    
    document.querySelector('.container').classList.add('fade-in');
    setTimeout(() => {
        document.querySelector('.container').classList.remove('fade-in');
    }, 500);
}

function cambiarDificultad(dificultad) {
    // Actualizar botones
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-difficulty="${dificultad}"]`).classList.add('active');
    
    // Cambiar dificultad en el juego
    juego.cambiarDificultad(dificultad);
    
    mostrarMensaje(`🎮 Dificultad: ${DIFICULTADES[dificultad].nombre}`, 'info');
    actualizarUI();
    limpiarCaja();
}

function cambiarModalidad(modalidad) {
    // Actualizar botones
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${modalidad}"]`).classList.add('active');
    
    // Cambiar modalidad en el juego
    juego.cambiarModalidad(modalidad);
    
    const modoConfig = MODALIDADES[modalidad];
    const intentosMax = modoConfig.intentos[juego.dificultad];
    const intentosTexto = intentosMax === Infinity ? 'sin límite' : `${intentosMax} intentos`;
    
    mostrarMensaje(`🎮 Modo: ${modoConfig.nombre} (${intentosTexto})`, 'info');
    actualizarUI();
    limpiarCaja();
}

function manejarSubmit(event) {
    event.preventDefault();
    verificarIntento();
    return false;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    actualizarUI();
    mostrarMensaje('🎯 ¡Adivina el número secreto!', 'info');
    document.getElementById('valorUsuario').focus();

    // Permitir Enter para jugar
    document.getElementById('valorUsuario').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !juego.juegoTerminado) {
            verificarIntento();
        }
    });
});


