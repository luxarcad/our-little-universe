
const random = (min, max) =>
  Math.random() * (max - min) + min;

const TEXTS = {
  love: "TE AMO",
  sun: "MI SOL",
  moon: "MI LUNA",
  star: "MI ESTRELLA",
};

// Convierte letras en posiciones para partículas.
function createText(text, count) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 380;

  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });

  const size = text.length > 9 ? 138 : 185;

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, 600, 190, 1120);

  const image = ctx.getImageData(0, 0, 1200, 380);
  const candidates = [];

  for (let y = 0; y < 380; y += 4) {
    for (let x = 0; x < 1200; x += 4) {
      const alpha = image.data[(y * 1200 + x) * 4 + 3];

      if (alpha > 100) {
        candidates.push([x, y]);
      }
    }
  }

  const result = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const point =
      candidates[Math.floor(Math.random() * candidates.length)] ||
      [600, 190];

    result[i * 3] = (point[0] - 600) / 85;
    result[i * 3 + 1] = (190 - point[1]) / 85;
    result[i * 3 + 2] = random(-0.25, 0.25);
  }

  return result;
}

// Crea las formas geométricas y orgánicas.
function createGeometry(type, count) {
  const result = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0;
    let y = 0;
    let z = random(-0.35, 0.35);

    if (type === "heart") {
      const t = random(0, Math.PI * 2);
      const fill = Math.sqrt(Math.random());

      x = (16 * Math.sin(t) ** 3 / 4) * fill;
      y = (
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t)
      ) / 4 * fill;
    }

    if (type === "sun") {
      if (Math.random() < 0.68) {
        const angle = random(0, Math.PI * 2);
        const radius = 2.5 * Math.sqrt(Math.random());

        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      } else {
        const ray = Math.floor(random(0, 12));
        const radius = random(2.7, 4.6);
        const spread = (4.6 - radius) / 4.6;
        const angle =
          ray * Math.PI / 6 +
          random(-0.24, 0.24) * spread;

        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }
    }

    if (type === "moon") {
      // Disco exterior menos un disco desplazado.
      let valid = false;

      while (!valid) {
        x = random(-3.8, 3.8);
        y = random(-3.8, 3.8);

        const outer = x * x + y * y <= 3.8 ** 2;
        const inner = (x - 1.45) ** 2 + y * y < 3.4 ** 2;

        valid = outer && !inner;
      }

      x += 1.15;
      z = random(-0.18, 0.18);
    }

    if (type === "star") {
      // Estrella de cinco puntas rellena.
      const side = Math.floor(random(0, 10));

      const angleA = -Math.PI / 2 + side * Math.PI / 5;
      const angleB = angleA + Math.PI / 5;

      const radiusA = side % 2 === 0 ? 4.5 : 2.0;
      const radiusB = side % 2 === 0 ? 2.0 : 4.5;

      const t = Math.random();
      const fill = Math.sqrt(Math.random());

      x = (
        Math.cos(angleA) * radiusA * (1 - t) +
        Math.cos(angleB) * radiusB * t
      ) * fill;

      y = (
        Math.sin(angleA) * radiusA * (1 - t) +
        Math.sin(angleB) * radiusB * t
      ) * fill;
    }

    if (type === "flower") {
      if (Math.random() < 0.15) {
        const angle = random(0, Math.PI * 2);
        const radius = 0.55 * Math.sqrt(Math.random());

        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
        z = 0.4;
      } else {
        const petal = Math.floor(random(0, 6));
        const angle = petal * Math.PI / 3;
        const t = Math.random();

        const length = 0.35 + 4.0 * t;
        const width =
          random(-1, 1) * 1.3 * Math.sin(Math.PI * t);

        x = length * Math.cos(angle) -
            width * Math.sin(angle);

        y = length * Math.sin(angle) +
            width * Math.cos(angle);

        z = 0.5 * Math.sin(Math.PI * t);
      }
    }

    result[i * 3] = x;
    result[i * 3 + 1] = y;
    result[i * 3 + 2] = z;
  }

  return result;
}

export function generateShape(type, count) {
  // Las frases también son formas.
  if (type === "love") {
    return createText(TEXTS.love, count);
  }

  if (type === "flower") {
    return createGeometry("flower", count);
  }

  return createGeometry(type, count);
}

// Útil para crear escenas adicionales.
export function generateText(text, count) {
  return createText(text.toUpperCase(), count);
}
