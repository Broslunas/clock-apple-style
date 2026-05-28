# 🍎 Apple Flip Clock Pro — Astro Suite

¡Hemos llevado este proyecto al siguiente nivel! De un simple reloj analógico-digital en un archivo estático, ahora es una **Suite de Tiempo Completa y Modular** construida sobre **Astro**, inspirada en los altos estándares de diseño y estética de Apple (iOS, macOS y watchOS).

---

## ✨ Características Premium (Siguiente Nivel)

1. **Suite de Tiempo Multifuncional:**
   * **Reloj (Clock):** Muestra hora, fecha completa y AM/PM. Soporta formatos de 12h y 24h y alternado de segundos.
   * **Cronómetro (Stopwatch):** Precisión con tarjetas flip de centésimas de segundo y soporte para registrar vueltas (*laps*) en una tabla interactiva de scroll suave.
   * **Temporizador Pomodoro:** Modos predefinidos (25/5, 50/10, 15/3 min) con indicador de estado (Trabajo/Descanso) y anillo de progreso circular SVG.
   * **Temporizador (Timer):** Cuenta regresiva de precisión con presets rápidos y selector visual.
   * **Suite de Alarmas:** Permite programar múltiples alarmas personalizadas que se guardan y disparan alertas visuales y sonoras.

2. **Audio Físico Sintetizado (Web Audio API):**
   * **Click Mecánico Realista:** Cada cambio de número en las tarjetas flip genera un sonido acústico simulado mediante osciladores y filtros en tiempo real (evita usar archivos MP3 externos).
   * **Alarma Armónica Apple:** Al terminar el Pomodoro, el temporizador o sonar una alarma, se reproduce una alarma arpegiada en acorde de La mayor 9, simulando los tonos icónicos de iOS.
   * **Silenciador Integrado:** Interruptor rápido en el dock para silenciar todos los sonidos.

3. **Visuales 3D e Interactividad:**
   * **Flotador macOS Dock:** Menú inferior estilo dock de Mac con magnificación fluida en hover para cambiar entre modos de reloj.
   * **Efecto Parallax Tilt 3D:** En computadoras de escritorio, las tarjetas se inclinan tridimensionalmente siguiendo de manera orgánica el cursor del ratón.
   * **Reflectores de Vidrio:** Capa superior translúcida degradada en las tarjetas para simular reflejos de plástico y cristal reales.
   * **Configurador de Temas Dinámicos:** Selector para crear degradados de fondo y colores personalizados, además de 8 presets clásicos (macOS Sonoma, watchOS Ultra, Hermès Orange, Stealth Dark, Glass Minimal, etc.).

4. **Persistencia (localStorage):**
   * El estado del volumen, las alarmas guardadas, el formato (12h/24h), segundos visibles y el tema preferido se guardan en el navegador para que no se pierdan al recargar.

---

## 🚀 Estructura del Proyecto

El código está modularizado siguiendo los estándares de Astro:

```text
/
├── public/                 # Favicons y assets estáticos
├── src/
│   ├── components/         # Componentes modulares
│   │   ├── Dock.astro           # Menú inferior estilo iOS/macOS
│   │   ├── FlipCard.astro       # Tarjeta flip con transiciones 3D y lógica responsiva
│   │   └── SettingsPanel.astro  # Sidebar lateral de personalización y alarmas
│   ├── layouts/
│   │   └── Layout.astro         # Plantilla HTML base con SEO, tipografías y CSS global
│   ├── pages/
│   │   └── index.astro          # Página principal que sincroniza vistas y controladores
│   └── utils/
│       └── audio.js             # Motor de sonido en tiempo real con Web Audio API
├── package.json
└── tsconfig.json
```

---

## 🧞 Comandos y Desarrollo

Asegúrate de estar en el directorio raíz del proyecto para ejecutar los comandos:

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala las dependencias necesarias |
| `npm run dev` | Inicia el servidor de desarrollo en `http://localhost:4321` |
| `npm run build` | Compila la suite optimizada para producción en `./dist/` |
| `npm run preview` | Previsualiza localmente el build de producción |
| `.` (Tecla punto) | Atajo en la aplicación para abrir/cerrar Ajustes |
| `F11` | Alterna el modo de pantalla completa en la app |
