// The live sky. One full-screen fragment shader turns the still mountain
// photo into a cinemagraph: clouds above the ridgeline and the mist in the
// valley drift and billow, the warm light breathes, and the rock and snow
// never move. The two background easter eggs live here too: the blocky
// "pooled" load is the u_pixel uniform, and feature-map mode is a real 3×3
// Sobel convolution of the moving image.

export const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Ridgeline of background.jpg, traced by eye: the image-space height
// (0 = top, 1 = bottom) of the mountain silhouette at x = 0, 0.05, …, 1.
// Above it is sky and cloud; below it is rock, snow and valley.
export const RIDGE = [
  0.507, 0.5, 0.49, 0.48, 0.48, 0.5, 0.475, 0.445, 0.435, 0.445, 0.44, 0.45,
  0.46, 0.484, 0.49, 0.51, 0.51, 0.495, 0.5, 0.525, 0.56,
];

export const FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;   // canvas size in device pixels
uniform vec2 u_imageSize;    // background.jpg size in pixels
uniform float u_time;        // seconds since start; frozen for reduced motion
uniform float u_pixel;       // block size of the pooled load; 1 is sharp
uniform float u_feature;     // 1 shows the Sobel feature map
uniform float u_zoom;        // slow drift, 1.00 to 1.01
uniform float u_showMask;    // debug: tint the moving regions red
uniform vec4 u_ridge[6];      // RIDGE packed four to a vector (21 used)
uniform vec4 u_paths[16];     // 2 descents × 16 steps, two points per vector, image space
uniform float u_pathDrawn;    // segments drawn so far on the first descent (fractional)
uniform vec3 u_grade;         // time-of-day colour grade for the visitor's local hour
uniform float u_night;        // 0 by day, 1 at night: stars come out

const float CONTOURS_PER_UNIT = 5.5;
const float PATH_STAGGER = 4.0;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += amp * noise(p);
    p = p * 2.03 + vec2(17.0, 9.0);
    amp *= 0.5;
  }
  return sum;
}

// The ridge and path arrays are packed into vec4s: phone GPUs allow few
// fragment uniform vectors, and every array element costs a whole vector.
// GLSL ES 1.0 only indexes uniform arrays by loop indices and constants, so
// the array reads are macros expanded inside the loops, and the helpers only
// pick a component out of a vector they are handed.
float pick4(vec4 v, int c) {
  return c == 0 ? v.x : c == 1 ? v.y : c == 2 ? v.z : v.w;
}

vec2 pick2(vec4 v, int c) {
  return c == 0 ? v.xy : v.zw;
}

#define RIDGE_VALUE(k) pick4(u_ridge[(k) / 4], (k) - ((k) / 4) * 4)
#define PATH_POINT(j) pick2(u_paths[(j) / 2], (j) - ((j) / 2) * 2)

// Linear interpolation of the traced ridgeline at image x.
float ridgeAt(float x) {
  float r = u_ridge[0].x;
  for (int k = 0; k < 20; k++) {
    float x0 = float(k) / 20.0;
    if (x >= x0 && x <= x0 + 0.05) {
      r = mix(RIDGE_VALUE(k), RIDGE_VALUE(k + 1), (x - x0) * 20.0);
    }
  }
  return r;
}

float luminance(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// Screen position (0..1, y down) to image coordinates, cropping like
// background-size: cover, then zooming about the centre.
vec2 coverUv(vec2 screen) {
  float screenAspect = u_resolution.x / u_resolution.y;
  float imageAspect = u_imageSize.x / u_imageSize.y;
  vec2 scale = screenAspect > imageAspect
    ? vec2(1.0, imageAspect / screenAspect)
    : vec2(screenAspect / imageAspect, 1.0);
  return (screen - 0.5) * scale / u_zoom + 0.5;
}

// How much a point in the image is allowed to move: 1 in the sky above the
// ridgeline (fading out just above it, so snow edges never smear), 1 in the
// bright valley mist, and a little in the warm haze along the bottom.
float motionMask(vec2 uv, vec3 still) {
  float ridge = ridgeAt(clamp(uv.x, 0.0, 1.0));
  float sky = 1.0 - smoothstep(ridge - 0.035, ridge - 0.006, uv.y);
  float mist = smoothstep(0.63, 0.68, uv.y) * smoothstep(0.42, 0.66, luminance(still));
  float haze = smoothstep(0.84, 0.96, uv.y) * 0.75;
  return clamp(max(sky, max(mist, haze)), 0.0, 1.0);
}

// The rock as a loss surface. Height falls with distance below the traced
// ridgeline and rises with the (blurred) brightness of snow and lit rock, so
// contours bend around snowfields and gullies. terrain.ts computes the same
// function on the CPU to run gradient descent down it.
float blurredLuminance(vec2 uv) {
  vec2 o = vec2(0.02, 0.03);
  return (luminance(texture2D(u_image, uv).rgb) * 2.0
        + luminance(texture2D(u_image, uv + vec2(o.x, 0.0)).rgb)
        + luminance(texture2D(u_image, uv - vec2(o.x, 0.0)).rgb)
        + luminance(texture2D(u_image, uv + vec2(0.0, o.y)).rgb)
        + luminance(texture2D(u_image, uv - vec2(0.0, o.y)).rgb)) / 6.0;
}

float height(vec2 uv) {
  return -(uv.y - ridgeAt(clamp(uv.x, 0.0, 1.0))) * 3.0 + blurredLuminance(uv) * 2.0;
}

// Distance in image pixels from p to the segment a–b.
float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = (p - a) * u_imageSize;
  vec2 ba = (b - a) * u_imageSize;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

// Topographic contours and the descent path, drawn only on rock. Clouds and
// mist are composited afterwards, so they drift over the lines.
vec3 topography(vec2 uv, vec3 color, float rock) {
  if (rock <= 0.001) return color;
  float px = 1.0 / u_imageSize.x;
  float h = height(uv);
  float c = h * CONTOURS_PER_UNIT;
  // c changes by w per image pixel; a line is drawn where c is within about
  // one pixel of a whole number.
  float w = (abs(height(uv + vec2(px, 0.0)) - h) + abs(height(uv + vec2(0.0, px)) - h)) * CONTOURS_PER_UNIT;
  float f = abs(fract(c + 0.5) - 0.5);
  float line = 1.0 - smoothstep(w * 0.6, w * 1.6 + 1e-4, f);
  color = mix(color, vec3(1.0), line * 0.2 * rock);

  // Two descents, one each side of the name, like training runs from
  // different random starts; the second begins PATH_STAGGER segments after
  // the first and is drawn a little fainter.
  vec3 accent = vec3(0.949, 0.604, 0.29);
  for (int i = 0; i < 2; i++) {
    float drawn = u_pathDrawn - float(i) * PATH_STAGGER;
    float strength = i == 0 ? 0.95 : 0.7;
    float d = 1e5;
    float dot_ = 1e5;
    for (int s = 0; s < 15; s++) {
      float k = float(s);
      if (k < drawn) {
        vec2 a = PATH_POINT(i * 16 + s);
        vec2 b = mix(a, PATH_POINT(i * 16 + s + 1), clamp(drawn - k, 0.0, 1.0));
        d = min(d, segmentDistance(uv, a, b));
        dot_ = min(dot_, length((uv - a) * u_imageSize));
      }
    }
    color = mix(color, accent, (1.0 - smoothstep(1.0, 2.2, d)) * strength * rock);
    color = mix(color, accent, (1.0 - smoothstep(2.5, 4.0, dot_)) * strength * rock);
  }
  return color;
}

vec3 liveColor(vec2 uv) {
  float t = u_time;
  vec3 still = texture2D(u_image, uv).rgb;
  float m = motionMask(uv, still);

  // Two levels of domain-warped noise make a slowly folding flow field.
  vec2 q = uv * vec2(3.2, 5.0);
  vec2 flow = vec2(
    fbm(q + vec2(t * 0.032, t * 0.006)),
    fbm(q + vec2(5.2, 1.3) - vec2(t * 0.021, -t * 0.004)));
  vec2 warp = vec2(
    fbm(q + 2.6 * flow + vec2(t * 0.018, 0.0)),
    fbm(q + 2.6 * flow + vec2(3.1, 7.4) - vec2(0.0, t * 0.012)));
  vec2 offset = (warp - 0.5) * vec2(0.022, 0.012) * m;
  vec3 color = texture2D(u_image, uv + offset).rgb;

  // The topography sits on the rock; where the sky or mist moves, the cloud
  // texture replaces it, so the weather passes over the lines.
  float ridge = ridgeAt(clamp(uv.x, 0.0, 1.0));
  float rock = smoothstep(ridge - 0.004, ridge + 0.012, uv.y) * (1.0 - m) * (1.0 - smoothstep(0.86, 0.93, uv.y));
  color = topography(uv, color, rock);

  // A faint layer of mist sliding across the moving regions.
  float fog = fbm(uv * vec2(3.5, 7.0) + flow * 1.4 + vec2(-t * 0.026, t * 0.003));
  color += m * smoothstep(0.48, 0.9, fog) * 0.09 * vec3(1.0, 0.97, 0.94);

  // The sunset light breathes very slightly where the image is warm.
  float warm = smoothstep(0.08, 0.32, color.r - color.b);
  color *= 1.0 + warm * 0.05 * sin(t * 0.22 + fbm(uv * 2.0 + t * 0.015) * 6.2831);

  // Time of day: the whole scene is graded for the visitor's local hour, and
  // at night a few stars twinkle in the clear sky above the cloud bank.
  color *= u_grade;
  float clearSky = (1.0 - smoothstep(ridge - 0.035, ridge - 0.006, uv.y)) * (1.0 - smoothstep(0.22, 0.34, uv.y));
  vec2 cell = floor(uv * u_imageSize / 3.0);
  float star = step(0.9972, hash(cell)) * (0.55 + 0.45 * sin(t * 1.7 + hash(cell + 7.0) * 6.2831));
  color += vec3(0.9, 0.93, 1.0) * star * clearSky * u_night * (1.0 - smoothstep(0.45, 0.8, fog));

  return mix(color, vec3(1.0, 0.15, 0.1), u_showMask * m * 0.6);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  if (u_pixel > 1.0) {
    frag = (floor(frag / u_pixel) + 0.5) * u_pixel;
  }
  vec2 uv = coverUv(frag / u_resolution);

  if (u_feature < 0.5) {
    vec2 screen = frag / u_resolution - 0.5;
    float vignette = 1.0 - smoothstep(0.35, 0.95, length(screen * vec2(1.0, 0.85))) * 0.45;
    float dither = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(liveColor(uv) * vignette + dither, 1.0);
    return;
  }

  // Feature-map mode: the two 3×3 Sobel kernels convolved over the live
  // image's luminance, one device pixel apart, magnitude sqrt(Gx² + Gy²).
  vec2 texel = (coverUv((frag + vec2(1.0, 1.0)) / u_resolution) - uv);
  float tl = luminance(liveColor(uv + vec2(-texel.x, -texel.y)));
  float tc = luminance(liveColor(uv + vec2(0.0, -texel.y)));
  float tr = luminance(liveColor(uv + vec2(texel.x, -texel.y)));
  float ml = luminance(liveColor(uv + vec2(-texel.x, 0.0)));
  float mr = luminance(liveColor(uv + vec2(texel.x, 0.0)));
  float bl = luminance(liveColor(uv + vec2(-texel.x, texel.y)));
  float bc = luminance(liveColor(uv + vec2(0.0, texel.y)));
  float br = luminance(liveColor(uv + vec2(texel.x, texel.y)));
  float gx = -tl + tr - 2.0 * ml + 2.0 * mr - bl + br;
  float gy = -tl - 2.0 * tc - tr + bl + 2.0 * bc + br;
  float magnitude = clamp(sqrt(gx * gx + gy * gy) * 2.4, 0.0, 1.0);
  gl_FragColor = vec4(vec3(magnitude), 1.0);
}
`;
