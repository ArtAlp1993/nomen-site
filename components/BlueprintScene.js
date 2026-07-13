"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { DEFAULT_CONFIG } from "@/lib/ballFormula";

// «Живой блюпринт» уровня референса future-state: световая радужка из тысяч
// тонких волокон, расходящихся из тёмного центра. Синие тела нитей, белые
// светящиеся кончики, глубина по Z, bloom. Сцена живёт сама (медленное
// вращение, дыхание), цвет мягко подкрашивается под активную категорию.
// Вся геометрия — один LineSegments + один Points: дёшево и быстро.
//
// Все параметры вынесены в DEFAULT_CONFIG: страница-лаборатория /lab передаёт
// свой config и «лепит» шарик вживую; без config сцена ведёт себя ровно как
// раньше (дефолты = прежние константы).

const BG = "#05040f";
const WHITE_TIP = new THREE.Color("#eaf6ff");

// DEFAULT_CONFIG теперь живёт в lib/ballFormula.js (единый источник, свод 4.3).
// Ре-экспортим его отсюда — старые импорты `@/components/BlueprintScene` целы.
export { DEFAULT_CONFIG };

// Веса цветов: последний в палитре — редкий акцент, как искры в референсе.
const COLOR_WEIGHTS = [0.3, 0.25, 0.2, 0.17, 0.08];

const SEGS = 14;

// Детерминированный псевдослучайный шум (без Math.random — воспроизводимо).
function rnd(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pickColor(i, palette) {
  const weights =
    palette.length === COLOR_WEIGHTS.length
      ? COLOR_WEIGHTS
      : palette.map(() => 1 / palette.length);
  let t = rnd(i, 9.17);
  for (let k = 0; k < weights.length; k++) {
    if (t < weights[k]) return palette[k];
    t -= weights[k];
  }
  return palette[0];
}

// Строим все волокна одним буфером: пары вершин для LineSegments + отдельный
// буфер точек-кончиков для Points.
function buildFibers(cfg) {
  const FIBERS = Math.max(50, Math.round(cfg.fibers));
  const palette = cfg.colors.map((c) => new THREE.Color(c));
  const rInBase = cfg.pupil + 0.06; // волокна стартуют у кромки зрачка

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
    const rIn = rInBase + rnd(i, 2) * 0.45; // старт у зрачка
    const rOut = cfg.spread + rnd(i, 3) * cfg.spreadVar; // разлёт наружу
    const twist = (rnd(i, 4) - 0.5) * cfg.twist; // лёгкий спиральный увод
    const zAmp = (rnd(i, 5) - 0.5) * cfg.depth; // объём по глубине
    const body = pickColor(i, palette);
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

function FiberIris({ accent, reduce, cfg }) {
  const group = useRef();
  const lineMat = useRef();
  const tipMat = useRef();
  const accentColor = useMemo(() => new THREE.Color(accent || "#ffffff"), [accent]);
  const tintTarget = useMemo(() => new THREE.Color(), []);

  // Геометрия пересобирается только при смене параметров ФОРМЫ/цветов;
  // движение и свет геометрию не трогают.
  const geomKey = `${cfg.fibers}|${cfg.pupil}|${cfg.spread}|${cfg.spreadVar}|${cfg.twist}|${cfg.depth}|${cfg.colors.join(",")}`;
  const { lineGeom, tipGeom } = useMemo(() => {
    const { linePos, lineCol, tipPos, tipCol } = buildFibers(cfg);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lg.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(tipPos, 3));
    tg.setAttribute("color", new THREE.BufferAttribute(tipCol, 3));
    return { lineGeom: lg, tipGeom: tg };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geomKey]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      if (!reduce) {
        group.current.rotation.z += delta * cfg.rotSpeed;
        group.current.rotation.x = Math.sin(t * 0.28) * 0.09 * cfg.tilt;
        group.current.rotation.y = Math.cos(t * 0.21) * 0.07 * cfg.tilt;
      }
      // Лепка: дыхание × растяжение по осям × общий размер.
      const s = reduce ? 1 : 1 + Math.sin(t * 0.85) * cfg.breathe;
      group.current.scale.set(
        s * cfg.scaleX * cfg.zoom,
        s * cfg.scaleY * cfg.zoom,
        s * cfg.scaleZ * cfg.zoom
      );
    }
    // Мягкая подкраска всей радужки под активную категорию.
    tintTarget.set("#ffffff").lerp(accentColor, 0.38);
    if (lineMat.current) lineMat.current.color.lerp(tintTarget, 0.045);
    if (tipMat.current) tipMat.current.color.lerp(tintTarget, 0.045);
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeom} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMat}
          vertexColors
          transparent
          opacity={cfg.opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      <points geometry={tipGeom} frustumCulled={false}>
        <pointsMaterial
          ref={tipMat}
          vertexColors
          size={cfg.tipSize}
          sizeAttenuation
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* Тёмный «зрачок» с тонкой светящейся кромкой */}
      <mesh renderOrder={2}>
        <circleGeometry args={[cfg.pupil, 48]} />
        <meshBasicMaterial color={BG} />
      </mesh>
      <mesh renderOrder={3}>
        <ringGeometry args={[Math.max(cfg.pupil - 0.02, 0.01), cfg.pupil + 0.04, 64]} />
        <meshBasicMaterial
          color="#3b57ff"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
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

export default function BlueprintScene({ accent, config }) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return (
    <Canvas
      dpr={[1, 1.5]}
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
      <FiberIris accent={accent} reduce={reduce} cfg={cfg} />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={cfg.bloom}
          luminanceThreshold={0.16}
          luminanceSmoothing={0.75}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
