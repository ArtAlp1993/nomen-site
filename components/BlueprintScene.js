"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// «Живой блюпринт» уровня референса future-state: световая радужка из тысяч
// тонких волокон, расходящихся из тёмного центра. Синие тела нитей, белые
// светящиеся кончики, глубина по Z, bloom. Сцена живёт сама (медленное
// вращение, дыхание), цвет мягко подкрашивается под активную категорию.
// Вся геометрия — один LineSegments + один Points: дёшево и быстро.

const BG = "#05040f";
const WHITE_TIP = new THREE.Color("#eaf6ff");

// Палитра тел волокон: глубокий синий/фиолет + редкие бирюзовые акценты.
const FIBER_COLORS = [
  new THREE.Color("#2b3bff"),
  new THREE.Color("#4a3df0"),
  new THREE.Color("#6c4ff6"),
  new THREE.Color("#2b6bff"),
  new THREE.Color("#33e6e0"),
];
// Веса: бирюза — редкий акцент, как искры в референсе.
const COLOR_WEIGHTS = [0.3, 0.25, 0.2, 0.17, 0.08];

const FIBERS = 1450;
const SEGS = 14;

// Детерминированный псевдослучайный шум (без Math.random — воспроизводимо).
function rnd(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pickColor(i) {
  let t = rnd(i, 9.17);
  for (let k = 0; k < COLOR_WEIGHTS.length; k++) {
    if (t < COLOR_WEIGHTS[k]) return FIBER_COLORS[k];
    t -= COLOR_WEIGHTS[k];
  }
  return FIBER_COLORS[0];
}

// Строим все волокна одним буфером: пары вершин для LineSegments + отдельный
// буфер точек-кончиков для Points.
function buildFibers() {
  const linePos = new Float32Array(FIBERS * SEGS * 2 * 3);
  const lineCol = new Float32Array(FIBERS * SEGS * 2 * 3);
  const tipPos = new Float32Array(FIBERS * 3);
  const tipCol = new Float32Array(FIBERS * 3);

  const pt = new THREE.Vector3();
  const prev = new THREE.Vector3();
  const col = new THREE.Color();

  let L = 0;
  for (let i = 0; i < FIBERS; i++) {
    const ang0 = (i / FIBERS) * Math.PI * 2 + (rnd(i, 1) - 0.5) * 0.06;
    const rIn = 0.72 + rnd(i, 2) * 0.45; // старт у зрачка
    const rOut = 2.35 + rnd(i, 3) * 0.9; // разлёт наружу, кромка ровнее
    const twist = (rnd(i, 4) - 0.5) * 0.5; // лёгкий спиральный увод
    const zAmp = (rnd(i, 5) - 0.5) * 0.9; // объём по глубине
    const body = pickColor(i);
    const dim = 0.55 + rnd(i, 7) * 0.45; // яркость конкретной нити

    for (let s = 0; s <= SEGS; s++) {
      const t = s / SEGS;
      const r = THREE.MathUtils.lerp(rIn, rOut, Math.pow(t, 0.92));
      const a =
        ang0 + twist * t * t + Math.sin(t * 6.5 + i * 0.37) * 0.02; // лёгкая рябь
      pt.set(
        Math.cos(a) * r,
        Math.sin(a) * r,
        Math.sin(t * Math.PI) * zAmp * 0.42 + (rnd(i, 8) - 0.5) * 0.06
      );

      // Цвет вершины: тёмный у корня → тело → белый кончик.
      const bright = (0.18 + t * 0.95) * dim;
      col.copy(body).multiplyScalar(bright);
      if (t > 0.8) {
        col.lerp(WHITE_TIP, ((t - 0.8) / 0.2) * 0.85);
      }

      if (s > 0) {
        linePos[L * 6 + 0] = prev.x;
        linePos[L * 6 + 1] = prev.y;
        linePos[L * 6 + 2] = prev.z;
        linePos[L * 6 + 3] = pt.x;
        linePos[L * 6 + 4] = pt.y;
        linePos[L * 6 + 5] = pt.z;
        // Цвет пары: чуть темнее на входе сегмента, ярче на выходе.
        lineCol[L * 6 + 0] = col.r * 0.92;
        lineCol[L * 6 + 1] = col.g * 0.92;
        lineCol[L * 6 + 2] = col.b * 0.92;
        lineCol[L * 6 + 3] = col.r;
        lineCol[L * 6 + 4] = col.g;
        lineCol[L * 6 + 5] = col.b;
        L++;
      }
      prev.copy(pt);
    }

    // Светящийся кончик.
    tipPos[i * 3 + 0] = prev.x;
    tipPos[i * 3 + 1] = prev.y;
    tipPos[i * 3 + 2] = prev.z;
    const tipBright = 0.75 + rnd(i, 11) * 0.25;
    tipCol[i * 3 + 0] = WHITE_TIP.r * tipBright;
    tipCol[i * 3 + 1] = WHITE_TIP.g * tipBright;
    tipCol[i * 3 + 2] = WHITE_TIP.b * tipBright;
  }

  return { linePos, lineCol, tipPos, tipCol };
}

// Плавности для «вау»-сжатия зрачка.
const easeInCubic = (p) => p * p * p;
const easeOutBack = (p) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

function FiberIris({ accent, reduce }) {
  const group = useRef();
  const lineMat = useRef();
  const tipMat = useRef();
  const pupil = useRef(); // группа зрачка (диск + кромка)
  const ringMat = useRef();
  // Внезапное «смыкание» зрачка: резко сжался (~0.12с) → упруго вернулся
  // (~0.7с, с лёгким перелётом). Живёт в refs — без React-рендеров.
  const blink = useRef({ next: 6, phase: null, t0: 0 });
  const accentColor = useMemo(() => new THREE.Color(accent || "#ffffff"), [accent]);
  const tintTarget = useMemo(() => new THREE.Color(), []);

  const { lineGeom, tipGeom } = useMemo(() => {
    const { linePos, lineCol, tipPos, tipCol } = buildFibers();
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lg.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(tipPos, 3));
    tg.setAttribute("color", new THREE.BufferAttribute(tipCol, 3));
    return { lineGeom: lg, tipGeom: tg };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current && !reduce) {
      group.current.rotation.z += delta * 0.05;
      group.current.rotation.x = Math.sin(t * 0.28) * 0.09;
      group.current.rotation.y = Math.cos(t * 0.21) * 0.07;
      const s = 1 + Math.sin(t * 0.85) * 0.02;
      group.current.scale.setScalar(s);
    }
    // Мягкая подкраска всей радужки под активную категорию.
    tintTarget.set("#ffffff").lerp(accentColor, 0.38);
    if (lineMat.current) lineMat.current.color.lerp(tintTarget, 0.045);
    if (tipMat.current) tipMat.current.color.lerp(tintTarget, 0.045);

    // Зрачок: редкое внезапное смыкание. Сжатие резкое, возврат упругий с
    // перелётом (easeOutBack); кромка в момент сжатия вспыхивает.
    if (pupil.current && !reduce) {
      const b = blink.current;
      let scale = 1;
      if (!b.phase && t >= b.next) {
        b.phase = "in";
        b.t0 = t;
      }
      if (b.phase === "in") {
        const p = Math.min((t - b.t0) / 0.12, 1);
        scale = 1 - 0.58 * easeInCubic(p); // смыкается до 42%
        if (p >= 1) {
          b.phase = "out";
          b.t0 = t;
        }
      } else if (b.phase === "out") {
        const p = Math.min((t - b.t0) / 0.7, 1);
        scale = 0.42 + 0.58 * easeOutBack(p);
        if (p >= 1) {
          b.phase = null;
          b.next = t + 7 + Math.random() * 7; // следующее — через 7–14 сек
        }
      }
      pupil.current.scale.setScalar(scale);
      if (ringMat.current) {
        ringMat.current.opacity = 0.35 + (1 - Math.min(scale, 1)) * 0.85;
      }
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeom} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          vertexColors
          transparent
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <points geometry={tipGeom} frustumCulled={false}>
        <pointsMaterial
          ref={tipMat}
          vertexColors
          size={0.055}
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* Тёмный «зрачок» с тонкой светящейся кромкой; группа пульсирует —
          редкое внезапное смыкание с упругим возвратом (см. useFrame). */}
      <group ref={pupil}>
        <mesh renderOrder={2}>
          <circleGeometry args={[0.66, 48]} />
          <meshBasicMaterial color={BG} />
        </mesh>
        <mesh renderOrder={3}>
          <ringGeometry args={[0.64, 0.7, 64]} />
          <meshBasicMaterial
            ref={ringMat}
            color="#3b57ff"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

// fov камеры — вертикальный: на узких (портретных) контейнерах горизонтальный
// обзор сжимается и радужка перестаёт влезать по бокам. Отъезжаем камерой
// пропорционально соотношению сторон, чтобы сцена целиком вписывалась в кадр.
function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const z = aspect < 1 ? Math.min(8.8 / aspect, 15) : 8.8;
    camera.position.set(0, 0, z);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function BlueprintScene({ accent }) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8.8], fov: 42 }}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => e.preventDefault(),
          false
        );
      }}
    >
      <color attach="background" args={[BG]} />

      <ResponsiveCamera />
      <FiberIris accent={accent} reduce={reduce} />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.16}
          luminanceSmoothing={0.75}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
