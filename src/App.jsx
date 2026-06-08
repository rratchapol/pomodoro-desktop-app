import React, { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";

const CYCLE_LIMIT = 4;

const MODES = {
  pomodoro: {
    label: "focus",
    minutes: 25,
    accent: "#7b5be8"
  },
  short: {
    label: "short",
    minutes: 5,
    accent: "#34b89a"
  },
  long: {
    label: "long",
    minutes: 15,
    accent: "#ef7da7"
  }
};

const THEMES = ["morning", "noon", "evening", "night"];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function PixelDragon() {
  return (
    <span className="pixel-dragon" aria-label="pixel dragon" role="img">
      <span className="dragon-wing dragon-wing-left" />
      <span className="dragon-wing dragon-wing-right" />
      <span className="dragon-horn dragon-horn-left" />
      <span className="dragon-horn dragon-horn-right" />
      <span className="dragon-head" />
      <span className="dragon-snout" />
      <span className="dragon-face" />
      <span className="dragon-body" />
      <span className="dragon-belly" />
      <span className="dragon-tail" />
      <span className="dragon-leg dragon-leg-left" />
      <span className="dragon-leg dragon-leg-right" />
    </span>
  );
}

export default function App() {
  const [mode, setMode] = useState("pomodoro");
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedFocusCycles, setCompletedFocusCycles] = useState(0);
  const [alertLeft, setAlertLeft] = useState(0);
  const [nextMode, setNextMode] = useState(null);
  const audioContextRef = useRef(null);
  const activeMode = MODES[mode];
  const totalSeconds = activeMode.minutes * 60;
  const isAlerting = alertLeft > 0;
  const displaySeconds = isAlerting ? alertLeft : timeLeft;
  const progress = isAlerting ? 1 : 1 - timeLeft / totalSeconds;
  const theme = THEMES[Math.min(completedFocusCycles, THEMES.length - 1)];

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      if (alertLeft > 0) {
        setAlertLeft((current) => {
          if (current <= 1) {
            setMode(nextMode || "pomodoro");
            setTimeLeft(MODES[nextMode || "pomodoro"].minutes * 60);
            setNextMode(null);
            return 0;
          }

          return current - 1;
        });
        return;
      }

      setTimeLeft((current) => {
        if (current <= 1) {
          if (mode === "pomodoro") {
            const nextCompletedCycles = completedFocusCycles + 1;
            setCompletedFocusCycles(nextCompletedCycles);

            if (nextCompletedCycles >= CYCLE_LIMIT) {
              setAlertLeft(10);
              setNextMode("long");
              return 0;
            }

            setAlertLeft(5);
            setNextMode("short");
            return 0;
          }

          if (mode === "long") {
            setAlertLeft(10);
            setNextMode("pomodoro");
            setCompletedFocusCycles(0);
            return 0;
          }

          setAlertLeft(5);
          setNextMode("pomodoro");
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [alertLeft, completedFocusCycles, isRunning, mode, nextMode]);

  useEffect(() => {
    if (!isRunning || alertLeft <= 0) {
      return undefined;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return undefined;
    }

    const context = audioContextRef.current || new AudioContext();
    audioContextRef.current = context;
    context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = alertLeft > 5 ? 660 : 880;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();

    const pulseId = window.setInterval(() => {
      oscillator.frequency.value = oscillator.frequency.value === 660 ? 880 : 660;
    }, 220);

    return () => {
      window.clearInterval(pulseId);
      oscillator.stop();
    };
  }, [alertLeft, isRunning]);

  function unlockAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    audioContextRef.current.resume();
  }

  function toggleRunning() {
    unlockAudio();
    setIsRunning((current) => !current);
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setTimeLeft(MODES[nextMode].minutes * 60);
    setAlertLeft(0);
    setNextMode(null);
    setIsRunning(false);
  }

  function resetTimer() {
    setTimeLeft(totalSeconds);
    setAlertLeft(0);
    setNextMode(null);
    setIsRunning(false);
  }

  return (
    <main className={`app theme-${theme}`} style={{ "--accent": activeMode.accent }}>
      <div className="sky">
        <span className="cloud cloud-1" />
        <span className="cloud cloud-2" />
        <span className="cloud cloud-3" />
        <span className="sun-break" />
      </div>
      <div className="landscape">
        <span className="ridge ridge-back" />
        <span className="ridge ridge-front" />
        <span className="field field-1" />
        <span className="field field-2" />
        <span className="river" />
        <span className="path" />
      </div>

      <section className="hero">
        <div className="title-block">
          <div className="logo-row">
            <PixelDragon />
            <span>drake</span>
          </div>
          <h1>
            Focus
            <br />
            Timer
          </h1>
          <p>{theme}</p>
        </div>

        <div className="timer-panel" aria-label="Pomodoro timer">
          <div className="tool-row">
            <button type="button" aria-label={isRunning ? "Pause timer" : "Start timer"} onClick={toggleRunning}>
              {isRunning ? <Pause size={17} /> : <Play size={17} />}
            </button>
            <button type="button" aria-label="Reset timer" onClick={resetTimer}>
              <RotateCcw size={17} />
            </button>
            <button type="button" aria-label="Sound">
              <Volume2 size={17} />
            </button>
          </div>

          <div className="timer-orbit" style={{ "--progress": `${progress * 360}deg` }}>
            <div className="timer-face">
              <span>{isAlerting ? "switching" : activeMode.label}</span>
              <strong>{formatTime(displaySeconds)}</strong>
            </div>
            <div className={isRunning ? "dragon-runner running" : "dragon-runner"}>
              <PixelDragon />
            </div>
          </div>

          <div className="cycle-card">
            <span>cycle: </span>
            <strong>{completedFocusCycles}/4</strong>
            {[1, 2, 3, 4].map((step) => (
              <i key={step} className={step <= completedFocusCycles ? "fruit active" : "fruit"} />
            ))}
          </div>

          <div className="mode-row">
            {Object.entries(MODES).map(([key, option]) => (
              <button
                key={key}
                className={mode === key ? "active" : ""}
                onClick={() => selectMode(key)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
