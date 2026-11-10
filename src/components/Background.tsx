"use client";

import { useEffect, useRef, useState } from "react";
import { descendMountain, PATH_SEGMENTS, PATH_STAGGER, packRidge } from "./terrain";
import { FRAGMENT_SHADER, RIDGE, VERTEX_SHADER } from "./skyShader";
import styles from "./Background.module.css";

const IMAGE_SRC = "/media/background.jpg";

const KONAMI = [
  "arrowup", "arrowup", "arrowdown", "arrowdown",
  "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a",
];

// Pooled load: block sizes in CSS pixels, each held for STEP_MS, from coarse
// "max-pooled" squares down to the sharp image.
const POOL_BLOCKS = [64, 48, 32, 16, 8, 4, 2, 1];
const STEP_MS = 160;

// Device-pixel cap keeps the shader cheap on large high-DPI screens; the
// feature map samples the scene nine times per pixel, so it runs at half that.
const MAX_DPR = 1.5;
const FEATURE_RESOLUTION = 0.5;
const DRIFT_PERIOD_S = 30;

// The sky's colour grade through the day, by the visitor's local hour:
// [hour, red, green, blue, night]. Cool at dawn, the photo as shot by day,
// golden toward sunset, deep blue with stars at night; linear in between.
const DAY = [
  [0, 0.5, 0.58, 0.85, 1],
  [5, 0.55, 0.62, 0.85, 0.9],
  [6.5, 0.9, 0.93, 1.05, 0],
  [9, 1, 1, 1, 0],
  [16, 1, 1, 1, 0],
  [18, 1.1, 1, 0.86, 0],
  [19.5, 0.85, 0.78, 0.86, 0.25],
  [21, 0.5, 0.58, 0.85, 1],
  [24, 0.5, 0.58, 0.85, 1],
];

function skyAtHour(hour: number) {
  const i = Math.max(0, DAY.findIndex((row) => row[0] > hour) - 1);
  const [h0, ...a] = DAY[i];
  const [h1, ...b] = DAY[i + 1];
  const f = (hour - h0) / (h1 - h0);
  const mix = a.map((value, k) => value + (b[k] - value) * f);
  return { grade: [mix[0], mix[1], mix[2]] as const, night: mix[3] };
}

// The visitor's local hour; ?hour=21 previews any time of day.
function visitorHour() {
  const forced = Number(new URLSearchParams(window.location.search).get("hour"));
  if (Number.isFinite(forced) && forced >= 0 && forced < 24 && window.location.search.includes("hour=")) return forced;
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

// The gradient-descent path starts drawing once the sky is sharp.
const PATH_DELAY_S = 1.8;
const PATH_DRAW_S = 4;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("createShader failed");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("createProgram failed");
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
  }
  return program;
}

export function Background() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [feature, setFeature] = useState(false);
  const featureRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    // Which renderer is live is recorded on the element itself; the CSS shows
    // the still photo for "still" and fades the canvas in for "webgl".
    const setRenderer = (renderer: "webgl" | "still") => {
      wrap.dataset.renderer = renderer;
    };
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) {
      setRenderer("still");
      return;
    }

    let program: WebGLProgram;
    try {
      program = createProgram(gl);
    } catch (error) {
      console.warn("Live sky unavailable, showing the still photo.", error);
      setRenderer("still");
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the whole screen.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const at = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      resolution: at("u_resolution"),
      imageSize: at("u_imageSize"),
      time: at("u_time"),
      pixel: at("u_pixel"),
      feature: at("u_feature"),
      zoom: at("u_zoom"),
      showMask: at("u_showMask"),
      ridge: at("u_ridge"),
      paths: at("u_paths"),
      pathDrawn: at("u_pathDrawn"),
      grade: at("u_grade"),
      night: at("u_night"),
    };
    gl.uniform4fv(u.ridge, packRidge(RIDGE));
    gl.uniform1f(u.showMask, window.location.hash === "#sky-mask" ? 1 : 0);
    const applyTimeOfDay = () => {
      const { grade, night } = skyAtHour(visitorHour());
      gl.uniform3f(u.grade, grade[0], grade[1], grade[2]);
      gl.uniform1f(u.night, night);
    };
    applyTimeOfDay();
    const clock = window.setInterval(applyTimeOfDay, 60_000);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1;
    let frame = 0;
    let disposed = false;
    let start = 0;
    let poolStep = reducedMotion ? POOL_BLOCKS.length - 1 : 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR) *
        (featureRef.current ? FEATURE_RESOLUTION : 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.resolution, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      if (disposed) return;
      if (!start) start = now;
      const seconds = reducedMotion ? 0 : (now - start) / 1000;
      const drift = reducedMotion ? 0 : 0.5 - 0.5 * Math.cos((2 * Math.PI * seconds) / DRIFT_PERIOD_S);
      gl.uniform1f(u.time, seconds);
      gl.uniform1f(u.zoom, 1 + 0.01 * drift);
      gl.uniform1f(u.pixel, POOL_BLOCKS[poolStep] * dpr);
      gl.uniform1f(u.feature, featureRef.current ? 1 : 0);
      const drawn = reducedMotion ? 1 : Math.min(1, Math.max(0, (seconds - PATH_DELAY_S) / PATH_DRAW_S));
      gl.uniform1f(u.pathDrawn, drawn * (PATH_SEGMENTS + PATH_STAGGER));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };
    const redraw = () => {
      resize();
      if (reducedMotion) draw(performance.now());
    };

    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform2f(u.imageSize, image.naturalWidth, image.naturalHeight);
      gl.uniform4fv(u.paths, descendMountain(image));
      resize();
      setRenderer("webgl");
      frame = requestAnimationFrame(draw);
      const advance = () => {
        if (disposed || poolStep >= POOL_BLOCKS.length - 1) return;
        poolStep += 1;
        window.setTimeout(advance, STEP_MS);
      };
      window.setTimeout(advance, STEP_MS);
    };
    image.onerror = () => setRenderer("still");
    image.src = IMAGE_SRC;

    // Konami code toggles the feature map. A wrong key restarts the sequence,
    // or counts as its first step when it is itself the first key.
    let progress = 0;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
      if (progress < KONAMI.length) return;
      progress = 0;
      featureRef.current = !featureRef.current;
      setFeature(featureRef.current);
      redraw();
    };

    window.addEventListener("resize", redraw);
    window.addEventListener("keydown", onKey);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearInterval(clock);
      window.removeEventListener("resize", redraw);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`bg-root ${styles.wrap}`}
      data-renderer="pending"
      data-feature={feature ? "on" : "off"}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      {feature ? (
        <p className={styles.featureLabel}>conv1 · sobel 3×3 · 2 kernels</p>
      ) : null}
    </div>
  );
}
