/* =====================================================================
 * historic-carousel.js
 * ---------------------------------------------------------------------
 * Carrusel de videos "Momentos Históricos" con efecto Coverflow 3D,
 * construido con Swiper.js (cargado por CDN en index.html, justo antes
 * de este archivo).
 *
 * Comportamiento (SIN autoplay):
 *   - Ningún video se reproduce automáticamente ni el carrusel avanza
 *     solo: el usuario navega con las flechas, la paginación o arrastrando.
 *   - Únicamente el video que queda CENTRADO (diapositiva activa) se
 *     muestra más grande y es el único interactivo: el usuario puede
 *     reproducir, pausar, subir/bajar o silenciar el audio, y usar
 *     pantalla completa mediante los controles nativos del navegador.
 *   - Los videos laterales son solo una vista previa (sin controles,
 *     sin clics) hasta que el usuario los desplaza al centro.
 *   - Al cambiar de diapositiva, el video que deja de estar centrado
 *     se pausa automáticamente.
 *
 * Este script es completamente independiente del resto del sitio: no
 * toca ningún otro elemento, estilo ni lógica existente.
 *
 * Para cambiar los videos, solo edita el arreglo VIDEO_URLS de abajo.
 * ===================================================================== */

(function () {
  "use strict";

  /* -------------------------------------------------------------------
   * 1. ARREGLO DE VIDEOS
   *    Cada URL apunta a un archivo .mp4 alojado en GitHub (raw).
   * ---------------------------------------------------------------- */
  var VIDEO_URLS = [
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/0-nuestra_historia_-_los_pioneros_v1%20(360p).mp4",
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/1-nuestra_historia_-_cuarteto_v1%20(720p).mp4",
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/2-nuestra_historia__don_pablo_y_ibq_v1%20(540p).mp4",
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/3-nuestra_historia_-_los_ecos_v1%20(540p).mp4",
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/4-nuestra_historia_-_guillermo_hays_v1%20(360p).mp4",
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/5-nuestra_historia__seminario_y_sean_v1%20(540p).mp4",
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/6-nuestra_historia_-_el_tren_v1%20(540p).mp4",
    "https://raw.githubusercontent.com/teacheredwincaceres-png/ImpulSOS/e6d78db231ea8bbceb1cbd09ba836656f8791f24/nuestra_historia_-_un_legado_duradero_v1%20(240p).mp4"
  ];

  /* -------------------------------------------------------------------
   * 2. REFERENCIAS AL DOM
   *    Si el contenedor no existe en la página, el script no continúa.
   * ---------------------------------------------------------------- */
  var wrapper = document.getElementById("historicSwiperWrapper");
  if (!wrapper) {
    return;
  }

  /* -------------------------------------------------------------------
   * 3. GENERACIÓN DE DIAPOSITIVAS
   *    Una <div class="swiper-slide"> por video. Cada video:
   *      - NO tiene "autoplay": nunca arranca solo.
   *      - NO tiene "muted": el usuario controla el volumen libremente
   *        (subir/bajar/silenciar) con los controles nativos.
   *      - "controls" se activa/desactiva dinámicamente vía JS: solo el
   *        video centrado (swiper-slide-active) lo tiene.
   *      - "loop": si el usuario lo reproduce, no se corta abruptamente.
   *      - "playsinline": evita que en iOS se abra a pantalla completa
   *        de forma forzada al reproducir.
   *      - preload="metadata": solo descarga lo necesario para mostrar
   *        el primer fotograma como vista previa (ahorra ancho de banda
   *        ya que ya no hay reproducción automática de todos los videos).
   * ---------------------------------------------------------------- */
  var slidesHtml = VIDEO_URLS.map(function (url, index) {
    return (
      '<div class="swiper-slide" aria-label="Momento histórico ' + (index + 1) + '">' +
        '<div class="hm-video-frame">' +
          '<video src="' + url + '" loop playsinline preload="metadata"></video>' +
        "</div>" +
      "</div>"
    );
  }).join("");

  wrapper.innerHTML = slidesHtml;

  /* -------------------------------------------------------------------
   * 4. INICIALIZACIÓN DE SWIPER (efecto Coverflow, SIN autoplay)
   * ---------------------------------------------------------------- */
  if (typeof window.Swiper === "undefined") {
    // El SDK de Swiper no cargó (por ejemplo, sin conexión al CDN):
    // se deja el contenedor con los videos apilados en fila, sin morir.
    console.error("Swiper.js no está disponible; el carrusel Coverflow no se pudo inicializar.");
    return;
  }

  var historicSwiper = new window.Swiper("#historicSwiper", {
    // --- Efecto visual: Coverflow 3D verdadero (Swiper genera la
    //     perspectiva y las transformaciones 3D automáticamente:
    //     el video central queda de frente y más grande, y los
    //     laterales se inclinan y alejan en profundidad). ---
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    watchSlidesProgress: true, // necesario para que Swiper calcule bien el 3D con slidesPerView "auto"
    coverflowEffect: {
      rotate: 42,        // inclinación pronunciada de las diapositivas laterales
      stretch: -10,       // acerca ligeramente las diapositivas laterales al centro
      depth: 260,        // profundidad 3D: cuanto más alto, más "hundidas" se ven las laterales
      modifier: 1,
      slideShadows: false
    },

    // --- Loop infinito de navegación (NO es autoplay: solo permite
    //     seguir avanzando/retrocediendo sin límite al llegar a los extremos,
    //     continuando de forma perfectamente cíclica sin cortes) ---
    loop: true,
    loopAdditionalSlides: VIDEO_URLS.length,

    // --- Movimiento extremadamente suave al navegar manualmente ---
    speed: 900,
    easing: "ease-out",

    // NOTA: sin bloque "autoplay" — el carrusel NUNCA avanza solo.

    // --- Paginación inferior (bullets clicables) ---
    pagination: {
      el: "#historicSwiper .swiper-pagination",
      clickable: true
    },

    // --- Flechas de navegación ---
    navigation: {
      nextEl: "#historicSwiper .swiper-button-next",
      prevEl: "#historicSwiper .swiper-button-prev"
    },

    // --- Responsive: espaciado entre diapositivas según ancho de pantalla ---
    breakpoints: {
      0:   { spaceBetween: 12 },
      600: { spaceBetween: 20 },
      1000:{ spaceBetween: 28 }
    }
  });

  /* -------------------------------------------------------------------
   * 5. SOLO EL VIDEO CENTRAL ES INTERACTIVO
   *    - Se le agrega el atributo "controls" únicamente al video de la
   *      diapositiva activa (la que Swiper marca con "swiper-slide-active").
   *    - A todos los demás videos se les quita "controls" y se pausan,
   *      para que nunca quede sonando un video fuera del centro.
   * ---------------------------------------------------------------- */
  function updateActiveVideo() {
    var slides = historicSwiper.slides; // incluye duplicados del loop
    for (var i = 0; i < slides.length; i++) {
      var slideEl = slides[i];
      var video = slideEl.querySelector("video");
      if (!video) continue;

      var isActive = slideEl.classList.contains("swiper-slide-active");

      if (isActive) {
        video.setAttribute("controls", "controls");
      } else {
        video.removeAttribute("controls");
        if (!video.paused) {
          video.pause();
        }
      }
    }
  }

  // Actualizar al iniciar y cada vez que cambie la diapositiva centrada.
  historicSwiper.on("init", updateActiveVideo);
  historicSwiper.on("slideChange", updateActiveVideo);
  historicSwiper.on("slideChangeTransitionEnd", updateActiveVideo);
  historicSwiper.on("loopFix", updateActiveVideo);

  // Swiper puede haberse inicializado antes de registrar los listeners:
  // se ejecuta una vez de inmediato para dejar el estado inicial correcto.
  updateActiveVideo();
})();
