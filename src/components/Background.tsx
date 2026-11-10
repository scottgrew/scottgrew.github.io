"use client";

import { useEffect, useRef, useState } from "react";
import { SKY_RESOLVING, introSeen, onSkip, signal } from "./intro";
import { BAKE_SHADER, RIDGE, SKY_SHADER, VERTEX_SHADER } from "./skyShader";
import { descendMountain, packRidge } from "./terrain";
import styles from "./Background.module.css";

const IMAGE_SRC = "/media/background.jpg";

const KONAMI = [
  "arrowup", "arrowup", "arrowdown", "arrowdown",
  "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a",
];

// Opening: the sky resolves from coarse "max-pooled" blocks to the sharp
// image, one block size every STEP_MS; at HAND_OFF_STEP (about 0.6 s) the
// column starts building. The Konami feature map replays the same resolve.
const POOL_BLOCKS = [64, 48, 32, 16, 8, 4, 2, 1];
const STEP_MS = 125;
const HAND_OFF_STEP = 5;

// Speed. The clouds move slowly, so the sky is drawn at most 30 times a
// second, and 15 behind the darkened project pages. It renders at CSS-pixel
// resolution (soft cloud gains nothing from high-DPI), stepping down through
// QUALITY when frames arrive late on a slow machine. The feature map samples
// the scene nine times per pixel, so it runs at half resolution.
const HOME_FRAME_MS = 1000 / 30;
const PAGE_FRAME_MS = 1000 / 15;
const QUALITY = [1, 0.8, 0.65];
const SLOW_FRAME_MS = 40; // average frame interval that counts as struggling
// A gap this long between frames is a hidden tab, a sleep or a stalled page,
// not slow rendering, so the measurement restarts instead of counting it.
const STALL_MS = 500;
const SLOW_SAMPLES_TO_STEP = 2; // consecutive slow samples before quality drops
const FEATURE_RESOLUTION = 0.5;
const DRIFT_PERIOD_S = 30;

// The sky's colour grade through the day, by the visitor's local hour:
// [hour, red, green, blue, night]. The photo was shot at dusk, so it shows
// as shot only around sunset; by day it is lifted and cooled toward daylight,
// at dawn it is cool, and at night it is deep blue with stars. Linear in between.
const DAY = [
  [0, 0.5, 0.58, 0.85, 1],
  [5, 0.55, 0.62, 0.85, 0.9],
  [6.5, 0.9, 0.95, 1.12, 0],
  [9, 1.15, 1.27, 1.5, 0],
  [15.5, 1.15, 1.27, 1.5, 0],
  [17.5, 1, 1, 1, 0],
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
  const params = new URLSearchParams(window.location.search);
  const forced = Number(params.get("hour"));
  if (params.has("hour") && Number.isFinite(forced) && forced >= 0 && forced < 24) return forced;
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function createProgram(gl: WebGLRenderingContext, fragment: string) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("createShader failed");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
    }
    return shader;
  };
  const program = gl.createProgram();
  if (!program) throw new Error("createProgram failed");
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
  }
  return program;
}

// Points a program's a_position at the shared full-screen triangle.
function bindTriangle(gl: WebGLRenderingContext, program: WebGLProgram, buffer: WebGLBuffer | null) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const position = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
}

function linearTexture(gl: WebGLRenderingContext) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export function Background() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const perfRef = useRef<HTMLParagraphElement>(null);
  const [feature, setFeature] = useState(false);
  const [showPerf, setShowPerf] = useState(false);
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
    const fallBack = () => {
      setRenderer("still");
      signal(SKY_RESOLVING);
    };
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) {
      fallBack();
      return;
    }

    let bake: WebGLProgram;
    let sky: WebGLProgram;
    try {
      bake = createProgram(gl, BAKE_SHADER);
      sky = createProgram(gl, SKY_SHADER);
    } catch (error) {
      console.warn("Live sky unavailable, showing the still photo.", error);
      fallBack();
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const at = (name: string) => gl.getUniformLocation(sky, name);
    const u = {
      scene: at("u_scene"),
      resolution: at("u_resolution"),
      imageSize: at("u_imageSize"),
      time: at("u_time"),
      pixel: at("u_pixel"),
      feature: at("u_feature"),
      zoom: at("u_zoom"),
      showMask: at("u_showMask"),
      grade: at("u_grade"),
      night: at("u_night"),
    };

    const params = new URLSearchParams(window.location.search);
    if (params.has("perf")) window.setTimeout(() => setShowPerf(true), 0);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let finished = reducedMotion || introSeen();
    let poolStep = finished ? POOL_BLOCKS.length - 1 : 0;
    const stopSkip = onSkip(() => {
      finished = true;
      poolStep = POOL_BLOCKS.length - 1;
    });

    let ready = false;
    let disposed = false;
    let frame = 0;
    let start = 0;
    let lastDraw = 0;
    let quality = 0;
    let scale = 1;
    // Frame-interval sampling for the adaptive quality and the ?perf readout.
    let sampleStart = 0;
    let sampleFrames = 0;
    let slowSamples = 0;
    let poolTimer = 0;

    const applyTimeOfDay = () => {
      gl.useProgram(sky);
      const { grade, night } = skyAtHour(visitorHour());
      gl.uniform3f(u.grade, grade[0], grade[1], grade[2]);
      gl.uniform1f(u.night, night);
    };

    // Sized from the wrapper, which is 100lvh tall, so phone toolbars sliding
    // in and out never resize the canvas mid-scroll.
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      scale = QUALITY[quality] * (featureRef.current ? FEATURE_RESOLUTION : 1);
      const width = Math.max(1, Math.round(rect.width * scale));
      const height = Math.max(1, Math.round(rect.height * scale));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.useProgram(sky);
      gl.uniform2f(u.resolution, width, height);
    };

    const render = (now: number) => {
      const seconds = reducedMotion ? 0 : (now - start) / 1000;
      const drift = reducedMotion ? 0 : 0.5 - 0.5 * Math.cos((2 * Math.PI * seconds) / DRIFT_PERIOD_S);
      gl.useProgram(sky);
      gl.uniform1f(u.time, seconds);
      gl.uniform1f(u.zoom, 1 + 0.01 * drift);
      gl.uniform1f(u.pixel, POOL_BLOCKS[poolStep] * scale);
      gl.uniform1f(u.feature, featureRef.current ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (disposed) return;
      frame = requestAnimationFrame(loop);
      if (!start) start = now;
      const budget = document.body.dataset.view === "page" ? PAGE_FRAME_MS : HOME_FRAME_MS;
      if (now - lastDraw < budget - 2) return;
      if (now - lastDraw > STALL_MS) {
        sampleStart = 0;
        sampleFrames = 0;
      }
      lastDraw = now;
      render(now);

      // Every two seconds: report, and step quality down if frames have run
      // slow for two samples in a row, so one hitch never costs resolution.
      sampleFrames += 1;
      if (!sampleStart) sampleStart = now;
      if (now - sampleStart >= 2000) {
        const interval = (now - sampleStart) / sampleFrames;
        if (perfRef.current) {
          perfRef.current.textContent = `${(1000 / interval).toFixed(0)} fps · ${interval.toFixed(1)} ms · ${canvas.width}×${canvas.height}`;
        }
        slowSamples = interval > Math.max(SLOW_FRAME_MS, budget * 1.4) ? slowSamples + 1 : 0;
        if (slowSamples >= SLOW_SAMPLES_TO_STEP && quality < QUALITY.length - 1) {
          quality += 1;
          slowSamples = 0;
          resize();
        }
        sampleStart = now;
        sampleFrames = 0;
      }
    };

    // Changing a canvas's size wipes it, so a resize draws straight away:
    // waiting for the next capped frame would flash an empty canvas.
    const redraw = () => {
      if (!ready) return;
      resize();
      if (!start) start = performance.now();
      render(performance.now());
    };
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(redraw);
    };

    // The pooled resolve: coarse squares down to the sharp image. On the
    // opening it hands off to the column part-way through.
    const pool = (handOff: boolean) => {
      if (reducedMotion) return;
      window.clearTimeout(poolTimer); // a new resolve replaces one in progress
      poolStep = 0;
      const advance = () => {
        if (disposed || poolStep >= POOL_BLOCKS.length - 1) return;
        poolStep += 1;
        if (handOff && poolStep === HAND_OFF_STEP) signal(SKY_RESOLVING);
        poolTimer = window.setTimeout(advance, STEP_MS);
      };
      poolTimer = window.setTimeout(advance, STEP_MS);
    };

    // Bakes the static landscape once: photo, contours and descent path in
    // RGB, the motion mask in alpha, at the photo's own resolution.
    const bakeScene = (image: HTMLImageElement) => {
      const photo = linearTexture(gl);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

      gl.activeTexture(gl.TEXTURE1);
      const scene = linearTexture(gl);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.naturalWidth, image.naturalHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const target = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, scene, 0);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("bake target incomplete");

      gl.useProgram(bake);
      bindTriangle(gl, bake, buffer);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, photo);
      gl.uniform1i(gl.getUniformLocation(bake, "u_image"), 0);
      gl.uniform2f(gl.getUniformLocation(bake, "u_imageSize"), image.naturalWidth, image.naturalHeight);
      gl.uniform4fv(gl.getUniformLocation(bake, "u_ridge"), packRidge(RIDGE));
      gl.uniform4fv(gl.getUniformLocation(bake, "u_paths"), descendMountain(image));
      gl.viewport(0, 0, image.naturalWidth, image.naturalHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(target);
      gl.deleteTexture(photo);
      gl.deleteProgram(bake);

      gl.useProgram(sky);
      bindTriangle(gl, sky, buffer);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, scene);
      gl.uniform1i(u.scene, 1);
      gl.uniform2f(u.imageSize, image.naturalWidth, image.naturalHeight);
      gl.uniform1f(u.showMask, window.location.hash === "#sky-mask" ? 1 : 0);
    };

    const image = new Image();
    image.onload = () => {
      if (disposed) return;
      try {
        bakeScene(image);
      } catch (error) {
        console.warn("Live sky unavailable, showing the still photo.", error);
        fallBack();
        return;
      }
      applyTimeOfDay();
      ready = true;
      canvas.width = 0; // force the first resize to size and upload
      resize();
      setRenderer("webgl");
      if (reducedMotion) render(performance.now());
      else frame = requestAnimationFrame(loop);
      if (finished) signal(SKY_RESOLVING);
      else pool(true);
    };
    image.onerror = fallBack;
    image.src = IMAGE_SRC;
    const clock = window.setInterval(() => {
      if (ready) applyTimeOfDay();
    }, 60_000);

    // If the GPU drops the context (a driver reset, a long sleep), stop and
    // show the still photo rather than a black canvas.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      disposed = true;
      cancelAnimationFrame(frame);
      setRenderer("still");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    // Konami code toggles the feature map, resolving it from pooled blocks.
    // A wrong key restarts the sequence, or counts as its first step when it
    // is itself the first key.
    let progress = 0;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
      if (progress < KONAMI.length) return;
      progress = 0;
      featureRef.current = !featureRef.current;
      setFeature(featureRef.current);
      redraw();
      if (featureRef.current) pool(false);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(resizeFrame);
      window.clearTimeout(poolTimer);
      stopSkip();
      window.clearInterval(clock);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("resize", onResize);
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
      {feature ? <p className={styles.featureLabel}>conv1 · sobel 3×3 · 2 kernels</p> : null}
      {showPerf ? <p ref={perfRef} className={styles.perf}>measuring…</p> : null}
    </div>
  );
}
