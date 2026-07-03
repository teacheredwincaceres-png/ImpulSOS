/* =====================================================================
 * audiobook.js
 * ---------------------------------------------------------------------
 * Lógica completa del reproductor "AUDIO LIBRO" (barra lateral izquierda,
 * dentro de .col-author). Reemplaza el antiguo reproductor simple
 * ("Lectura en voz alta") por una experiencia tipo app moderna de
 * música/audiolibros:
 *
 *   - Menú de capítulos generado automáticamente a partir del arreglo
 *     "audios" (no se escribe cada elemento a mano).
 *   - Al hacer clic en un capítulo: cambia el título, cambia la duración
 *     mostrada, carga el audio, empieza a reproducirse automáticamente,
 *     resalta el capítulo activo y detiene cualquier reproducción previa
 *     (se reutiliza un único elemento <audio>, así que al cambiar su
 *     "src" la reproducción anterior se detiene de forma natural).
 *   - Controles: reproducir/pausa, siguiente, anterior, barra de
 *     progreso, tiempo actual, duración total, volumen, velocidad
 *     (0.75x/1x/1.25x/1.5x), repetir y descargar.
 *
 * Este archivo es independiente del resto del sitio: no toca ningún
 * otro elemento, estilo ni lógica existente. Solo mejora la sección
 * del Audiolibro.
 * ===================================================================== */

(function () {
  "use strict";

  /* -------------------------------------------------------------------
   * 1. ARREGLO DE AUDIOS (capítulos del audiolibro)
   *    Para agregar/quitar capítulos, solo se edita este arreglo: el
   *    menú y el reproductor se generan automáticamente a partir de él.
   * ---------------------------------------------------------------- */
  var audios = [
    {
      titulo: "Prólogo",
      duracion: "03:42",
      url: "https://teacheredwincaceres-png.github.io/ImpulSOS/audio/1-%20Prologo.mp3"
    },
    {
      titulo: "Sección 1",
      duracion: "12:18",
      url: "https://teacheredwincaceres-png.github.io/ImpulSOS/audio/2%20-%20Secion%201.mp3"
    },
    {
      titulo: "Sección 2",
      duracion: "09:51",
      url: "https://teacheredwincaceres-png.github.io/ImpulSOS/audio/3%20Secion%201.5-2.mp3"
    },
    {
      titulo: "Sección 3 y 4",
      duracion: "15:06",
      url: "https://teacheredwincaceres-png.github.io/ImpulSOS/audio/4-seccion%203%20y%204.mp3"
    }
  ];

  /* -------------------------------------------------------------------
   * 2. REFERENCIAS AL DOM
   *    Si el reproductor no existe en la página, el script no continúa.
   * ---------------------------------------------------------------- */
  var listEl = document.getElementById("audiobookList");
  if (!listEl) {
    return;
  }

  var audio = document.getElementById("abAudio");
  var nowPlayingEl = document.getElementById("abNowPlaying");
  var trackTitleEl = document.getElementById("abTrackTitle");
  var trackSubEl = document.getElementById("abTrackSub");

  var seek = document.getElementById("abSeek");
  var currentTimeEl = document.getElementById("abCurrentTime");
  var durationEl = document.getElementById("abDuration");

  var playPauseBtn = document.getElementById("abPlayPause");
  var prevBtn = document.getElementById("abPrev");
  var nextBtn = document.getElementById("abNext");

  var repeatBtn = document.getElementById("abRepeat");
  var volumeSlider = document.getElementById("abVolume");
  var volIcon = document.getElementById("abVolIcon");
  var speedSelect = document.getElementById("abSpeed");
  var downloadLink = document.getElementById("abDownload");

  var currentIndex = -1; // -1 = ningún capítulo cargado todavía

  /* -------------------------------------------------------------------
   * 3. UTILIDADES
   * ---------------------------------------------------------------- */

  // Formatea segundos a "mm:ss".
  function fmtTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "00:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  // Elige el icono de volumen según el nivel actual / silenciado.
  function volumeIconFor(vol, muted) {
    if (muted || vol === 0) return "🔇";
    if (vol < 0.5) return "🔉";
    return "🔊";
  }

  /* -------------------------------------------------------------------
   * 4. GENERACIÓN AUTOMÁTICA DEL MENÚ DE CAPÍTULOS
   *    Se recorre el arreglo "audios" con forEach: nada se escribe a mano.
   * ---------------------------------------------------------------- */
  function buildChapterList() {
    listEl.innerHTML = "";

    audios.forEach(function (track, index) {
      var li = document.createElement("li");
      li.className = "ab-item";
      li.setAttribute("data-index", String(index));
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");

      li.innerHTML =
        '<div class="ab-item-main">' +
          '<div class="ab-item-title">🎧 ' + track.titulo + "</div>" +
          '<div class="ab-item-duration">⏱ ' + track.duracion + "</div>" +
        "</div>" +
        '<span class="ab-item-playing-icon">🎵</span>';

      // Clic: cargar y reproducir automáticamente ese capítulo.
      li.addEventListener("click", function () {
        loadChapter(index, true);
      });

      // Accesibilidad: también se puede seleccionar con teclado (Enter/Espacio).
      li.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          loadChapter(index, true);
        }
      });

      listEl.appendChild(li);
    });
  }

  // Marca visualmente el capítulo activo (barra lateral + color) y
  // desplaza el menú suavemente hasta él si hiciera falta.
  function highlightActiveChapter(index) {
    var items = listEl.querySelectorAll(".ab-item");
    items.forEach(function (item, i) {
      item.classList.toggle("active", i === index);
    });

    var activeItem = listEl.querySelector(".ab-item.active");
    if (activeItem && activeItem.scrollIntoView) {
      activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /* -------------------------------------------------------------------
   * 5. CARGA Y REPRODUCCIÓN DE UN CAPÍTULO
   * ---------------------------------------------------------------- */
  function loadChapter(index, autoplay) {
    // Navegación circular: después del último capítulo vuelve al primero
    // y viceversa (para los botones "siguiente"/"anterior").
    if (index < 0) index = audios.length - 1;
    if (index >= audios.length) index = 0;

    currentIndex = index;
    var track = audios[index];

    // Al asignar un nuevo "src" al mismo <audio>, cualquier reproducción
    // anterior se detiene automáticamente: nunca suenan dos capítulos a la vez.
    audio.pause();
    audio.src = track.url;
    audio.playbackRate = parseFloat(speedSelect.value);

    // ✔ cambia el título ✔ cambia la duración mostrada
    trackTitleEl.textContent = track.titulo;
    trackSubEl.textContent = "Duración: " + track.duracion;
    durationEl.textContent = track.duracion; // se ajusta con loadedmetadata si el archivo real difiere

    currentTimeEl.textContent = "00:00";
    seek.value = 0;

    // Botón de descarga apuntando siempre al capítulo actual.
    downloadLink.href = track.url;
    downloadLink.setAttribute("download", track.titulo + ".mp3");

    // ✔ resalta el capítulo seleccionado ✔ desplaza el menú si hace falta
    highlightActiveChapter(index);

    // Pequeña animación de entrada al cambiar de capítulo.
    nowPlayingEl.classList.remove("ab-anim");
    void nowPlayingEl.offsetWidth; // fuerza reflow para poder re-disparar la animación
    nowPlayingEl.classList.add("ab-anim");

    // ✔ comienza la reproducción automáticamente
    if (autoplay) {
      var playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {
          // Reproducción bloqueada por el navegador (poco común tras un
          // clic real del usuario): se ignora silenciosamente.
        });
      }
    }
  }

  /* -------------------------------------------------------------------
   * 6. CONTROLES PRINCIPALES: reproducir/pausa, siguiente, anterior
   * ---------------------------------------------------------------- */
  function togglePlayPause() {
    if (currentIndex === -1) {
      // Si aún no se ha elegido capítulo, el botón central reproduce el primero.
      loadChapter(0, true);
      return;
    }
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  playPauseBtn.addEventListener("click", togglePlayPause);
  nextBtn.addEventListener("click", function () {
    loadChapter(currentIndex === -1 ? 0 : currentIndex + 1, true);
  });
  prevBtn.addEventListener("click", function () {
    loadChapter(currentIndex === -1 ? 0 : currentIndex - 1, true);
  });

  // Sincroniza el icono del botón central con el estado real del audio.
  audio.addEventListener("play", function () {
    playPauseBtn.textContent = "⏸";
    playPauseBtn.setAttribute("aria-label", "Pausar");
  });
  audio.addEventListener("pause", function () {
    playPauseBtn.textContent = "▶";
    playPauseBtn.setAttribute("aria-label", "Reproducir");
  });

  // Al terminar un capítulo, si no está en modo "repetir", avanza solo al siguiente.
  audio.addEventListener("ended", function () {
    if (!audio.loop) {
      loadChapter(currentIndex + 1, true);
    }
  });

  /* -------------------------------------------------------------------
   * 7. BARRA DE PROGRESO, TIEMPO ACTUAL Y DURACIÓN TOTAL
   * ---------------------------------------------------------------- */
  audio.addEventListener("loadedmetadata", function () {
    if (isFinite(audio.duration)) {
      durationEl.textContent = fmtTime(audio.duration);
    }
  });

  audio.addEventListener("timeupdate", function () {
    if (audio.duration) {
      seek.value = (audio.currentTime / audio.duration) * 100;
    }
    currentTimeEl.textContent = fmtTime(audio.currentTime);
  });

  seek.addEventListener("input", function () {
    if (audio.duration) {
      audio.currentTime = (seek.value / 100) * audio.duration;
    }
  });

  /* -------------------------------------------------------------------
   * 8. VOLUMEN (subir / bajar / silenciar)
   * ---------------------------------------------------------------- */
  volumeSlider.addEventListener("input", function () {
    audio.volume = volumeSlider.value / 100;
    audio.muted = false;
    volIcon.textContent = volumeIconFor(audio.volume, audio.muted);
  });

  // Clic en el icono de volumen: silenciar / restaurar sonido.
  volIcon.addEventListener("click", function () {
    audio.muted = !audio.muted;
    volIcon.textContent = volumeIconFor(audio.volume, audio.muted);
  });

  /* -------------------------------------------------------------------
   * 9. VELOCIDAD DE REPRODUCCIÓN
   * ---------------------------------------------------------------- */
  speedSelect.addEventListener("change", function () {
    audio.playbackRate = parseFloat(speedSelect.value);
  });

  /* -------------------------------------------------------------------
   * 10. REPETIR CAPÍTULO
   * ---------------------------------------------------------------- */
  repeatBtn.addEventListener("click", function () {
    audio.loop = !audio.loop;
    repeatBtn.classList.toggle("active", audio.loop);
  });

  /* -------------------------------------------------------------------
   * 11. INICIALIZACIÓN
   * ---------------------------------------------------------------- */
  buildChapterList();
  audio.volume = volumeSlider.value / 100;
})();
