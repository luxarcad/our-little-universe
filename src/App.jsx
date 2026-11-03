
import { useEffect, useRef, useState } from "react";

import ParticleUniverse from "./components/ParticleUniverse";
import useAudioAnalyser from "./hooks/useAudioAnalyser";

import "./App.css";

const SCENES = [
  {
    id: "love",
    group: "love",
    label: "Te amo",
    message: "No existe universo donde no te elegiría.",
  },
  {
    id: "sun-text",
    group: "sun",
    label: "Mi sol",
    message: "Porque haces brillar incluso mis días grises.",
  },
  {
    id: "sun",
    group: "sun",
    label: "Mi sol",
    message: "La luz más bonita siempre viene de ti.",
  },
  {
    id: "moon-text",
    group: "moon",
    label: "Mi luna",
    message: "Incluso en la oscuridad, encuentro tu luz.",
  },
  {
    id: "moon",
    group: "moon",
    label: "Mi luna",
    message: "Quisiera acompañarte en todas tus noches.",
  },
  {
    id: "star-text",
    group: "star",
    label: "Mi estrella",
    message: "Entre millones de estrellas, encontré la mía.",
  },
  {
    id: "star",
    group: "star",
    label: "Mi estrella",
    message: "Y desde entonces, mi cielo es diferente.",
  },
  {
    id: "flower",
    group: "flower",
    label: "Flor lunar",
    message: "Hay flores que solo florecen bajo la luna. Tú haces florecer mi universo.",
  },
];

const NAVIGATION = [
  { label: "Te amo", group: "love", index: 0 },
  { label: "Mi sol", group: "sun", index: 1 },
  { label: "Mi luna", group: "moon", index: 3 },
  { label: "Mi estrella", group: "star", index: 5 },
  { label: "Flor lunar", group: "flower", index: 7 },
];

export default function App() {
  const [entered, setEntered] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);

  const fileInputRef = useRef(null);

  const {
    audioRef,
    isPlaying,
    trackName,
    error,
    toggleMusic,
    selectFile,
    readAudio,
  } = useAudioAnalyser();

  const currentScene = SCENES[sceneIndex];

  // Recorremos el universo automáticamente.
  useEffect(() => {
    if (!entered) return;

    const interval = setInterval(() => {
      setSceneIndex((current) =>
        (current + 1) % SCENES.length
      );
    }, 8500);

    return () => clearInterval(interval);
  }, [entered]);

  const nextScene = () => {
    setSceneIndex((current) =>
      (current + 1) % SCENES.length
    );
  };

  const previousScene = () => {
    setSceneIndex((current) =>
      (current - 1 + SCENES.length) % SCENES.length
    );
  };

  const handleMusicFile = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      selectFile(file);
    }

    event.target.value = "";
  };

  return (
    <div className="experience">
      <ParticleUniverse
        scene={currentScene.id}
        readAudio={readAudio}
      />

      <div className="ambient-glow" />

      <header className="topbar">
        <div className="brand">
          <span className="brand-symbol">✦</span>
          <span>OUR LITTLE UNIVERSE</span>
        </div>

        <span className="topbar-note">
          UN REGALO PARA TI
        </span>
      </header>

      <main className="content">
        <section className="introduction">
          <p className="eyebrow">
            UNA HISTORIA ESCRITA EN LAS ESTRELLAS
          </p>

          <h1>
            Mi universo
            <em> eres tú.</em>
          </h1>

          <p className="introduction-description">
            Hay personas que llegan a nuestra vida y
            convierten lo ordinario en algo infinito.
          </p>
        </section>

        <section
          className="scene-caption"
          aria-live="polite"
        >
          <span className="scene-number">
            {String(sceneIndex + 1).padStart(2, "0")}
            {" / "}
            {String(SCENES.length).padStart(2, "0")}
          </span>

          <h2>{currentScene.label}</h2>

          <p>{currentScene.message}</p>
        </section>
      </main>

      <footer className="controls">
        <nav
          className="scene-tabs"
          aria-label="Explorar el universo"
        >
          {NAVIGATION.map((item) => (
            <button
              key={item.group}
              type="button"
              className={
                currentScene.group === item.group
                  ? "scene-tab active"
                  : "scene-tab"
              }
              aria-pressed={
                currentScene.group === item.group
              }
              onClick={() => setSceneIndex(item.index)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="control-bottom">
          <div className="scene-arrows">
            <button
              className="circle-button"
              onClick={previousScene}
              aria-label="Escena anterior"
            >
              ←
            </button>

            <button
              className="circle-button"
              onClick={nextScene}
              aria-label="Siguiente escena"
            >
              →
            </button>
          </div>

          <span className="interaction-hint">
            Mueve el cursor y toca las estrellas
          </span>

          <div className="music-controls">
            <button
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
              title="Seleccionar otra canción"
            >
              ♫ +
            </button>

            <button
              className="music-button"
              onClick={toggleMusic}
              aria-label={
                isPlaying
                  ? "Pausar música"
                  : "Reproducir música"
              }
            >
              <span
                className={
                  isPlaying
                    ? "music-icon playing"
                    : "music-icon"
                }
              >
                {isPlaying ? "Ⅱ" : "▶"}
              </span>

              <span className="music-text">
                <strong>
                  {isPlaying
                    ? "Reproduciendo"
                    : "Escuchar nuestra canción"}
                </strong>

                <small>{trackName}</small>
              </span>
            </button>
          </div>
        </div>

        {error && (
          <p className="audio-error" role="alert">
            {error}
          </p>
        )}
      </footer>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}music/our-song.mp3`}
        preload="none"
        loop
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={handleMusicFile}
      />

      {!entered && (
        <div className="welcome-screen">
          <div className="welcome-content">
            <span className="welcome-star">✧</span>

            <p>ALGO QUE QUERÍA DECIRTE</p>

            <h2>
              El universo es inmenso,
              <em> pero mi lugar favorito es contigo.</em>
            </h2>

            <button
              className="enter-button"
              onClick={() => setEntered(true)}
            >
              Descubre nuestro universo
              <span>✦</span>
            </button>

            <small>
              Una pequeña experiencia hecha con amor
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
