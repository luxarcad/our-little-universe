import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

export default function useAudioAnalyser() {
    const audioRef = useRef(null);
    const contextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const binsRef = useRef(null);
    const objectUrlRef = useRef(null);

    const energyRef = useRef({
        level: 0,
        bass: 0,
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [trackName,setTrackName] = useState("Nuestra canción");
    const [error, setError] = useState("");

    const initAudio = useCallback(async () => {
        const audio = audioRef.current;
        if(!audio) return;

        if (!contextRef.current) {
            const AudioContextClass = 
                window.AudioContext || window.webkitAudioContext;

            if (!AudioContextClass) {
                throw new Error("Tu navegador no soporta Web Audio.");
            }

            const context = new AudioContextClass();
            const analyser = context.createAnalyser();

            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.82;

            const source = context.createMediaElementSource(audio);

            source.connect(analyser);
            analyser.connect(context.destination);

            contextRef.current = context;
            analyserRef.current = analyser;
            sourceRef.current = source;

            binsRef.current = new Uint8Array(
                analyser.frequencyBinCount
            );
        }

        await contextRef.current.resume();
    }, []);

    const toggleMusic = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audio.paused) {
            audio.pause();
            return;
        }

        try {
            setError("");
            await initAudio();
            await audio.play();
        } catch (err) {
            console.error("Error de reproducción:", err);
            setError(
                "No se pudo reproducir. Agrega nuestra canción o selecciona un archivo"
            );
        }
    }, [initAudio]);

    const selectFile = useCallback((file) => {
        if (!file || !audioRef.current) return;

        if (
            !file.type.startsWith("audio/") &&
            !/\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)
        ) {
            setError("Selecciona un archivo de audio válido");
            return;
        }

        audioRef.current.pause();

        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }

        const url = URL.createObjectURL(file);
        objectUrlRef.current = url;

        audioRef.current.src = url;
        audioRef.current.load();

        setTrackName(file.name.replace(/\.[^.]+$/, ""));
        setError("");
    }, []);

    const readAudio = useCallback(() => {
        const analyser = analyserRef.current;
        const audio = audioRef.current;
        const energy = energyRef.current;

        if (!analyser || !audio || audio.paused) {
            energy.level *= 0.94;
            energy.bass *= 0.94;
            return energy;
        }

        const data = binsRef.current;
        analyser.getByteFrequencyData(data);

        let total = 0;
        let bass = 0;

        for (let i = 0; i < data.length; i++) {
            total += data[i];

            if (i >= 1 && i <= 14) {
                bass += data[i];
            }
        }

        const generalLevel = total / data.length / 255;
        const bassLevel = bass / 14 / 255;

        energy.level += (generalLevel - energy.level) * 0.15;
        energy.bass += (bassLevel - energy.bass) * 0.22;

        return energy;
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onError = () => {
            setError("No se encontró o no se pudo leer la canción.");
        };

        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", onPause);
        audio.addEventListener("error", onError);

        return () => {
            audio.pause();

            audio.removeEventListener("play", onPlay);
            audio.removeEventListener("pause", onPause);
            audio.removeEventListener("error", onError);

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
            }

            contextRef.current?.close();
        };
    }, []);

    return {
        audioRef,
        isPlaying,
        trackName,
        error,
        toggleMusic,
        selectFile,
        readAudio,
    };
}