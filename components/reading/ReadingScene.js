"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Сцена страницы /reading: клиент («энергетическая сущность» из световых
// волокон, цвет по полу) висит в центре экрана, а вокруг — энергетическая
// труба-туннель. Скролл страницы «везёт» сущность вниз по трубе: волокна
// туннеля текут мимо. У точек контакта с пунктами сущность вспыхивает
// цветом категории и вбирает сноп искр. Та же технология, что «шарик»
// (BlueprintScene): LineSegments + Points, additive blending, bloom.

const BG = "#05040f";
const WHITE_TIP = new THREE.Color("#eaf6ff");

// Палитры сущности по полу (f/m) и нейтральная (fallback).
const ENTITY_PALETTES = {
  f: ["#ff4fa3", "#f472b6", "#c04ff6", "#ff85c2", "#ffd6ec"],
  m: ["#2b6bff", "#38bdf8", "#4a3df0", "#5aa9ff", "#cfeaff"],
  n: ["#2b3bff", "#4a3df0", "#6c4ff6", "#2b6bff", "#33e6e0"],
};
const ENTITY_WEIGHTS = [0.3, 0.25, 0.2, 0.17, 0.08];

// Детерминированный шум — как в BlueprintScene (воспроизводимо, без Math.random).
function rnd(i, salt) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pickColor(i, palette) {
  let t = rnd(i, 9.17);
  for (let k = 0; k < ENTITY_WEIGHTS.length; k++) {
    if (t < ENTITY_WEIGHTS[k]) return palette[k];
    t -= ENTITY_WEIGHTS[k];
  }
  return palette[0];
}

// ── Сущность: компактный сгусток волокон (микро-версия радужки) ──

const E_FIBERS = 520;
const E_SEGS = 10;

function buildEntity(palette) {
  const colors = palette.map((c) => new THREE.Color(c));
  const linePos = new Float32Array(E_FIBERS * E_SEGS * 2 * 3);
  const lineCol = new Float32Array(E_FIBERS * E_SEGS * 2 * 3);
  const tipPos = new Float32Array(E_FIBERS * 3);
  const tipCol = new Float32Array(E_FIBERS * 3);
  const pt = new THREE.Vector3();
  const prev = new THREE.Vector3();
  const col = new THREE.Color();

  let L = 0;
  for (let i = 0; i < E_FIBERS; i++) {
    // Волокна расходятся из ядра во все стороны (сфера, не диск).
    const u = rnd(i, 1) * 2 - 1;
    const phi = rnd(i, 2) * Math.PI * 2;
    const sinT = Math.sqrt(1 - u * u);
    const dir = new THREE.Vector3(sinT * Math.cos(phi), sinT * Math.sin(phi), u);
    const rOut = 0.55 + rnd(i, 3) * 0.5;
    const bend = (rnd(i, 4) - 0.5) * 0.8;
    const body = pickColor(i, colors);
    const dim = 0.5 + rnd(i, 7) * 0.5;

    for (let s = 0; s <= E_SEGS; s++) {
      const t = s / E_SEGS;
      const r = 0.06 + Math.pow(t, 0.85) * rOut;
      pt.copy(dir).multiplyScalar(r);
      // Лёгкий спиральный увод кончиков — «живой» сгусток, не ёж.
      pt.x += Math.sin(t * 3.1 + i * 0.7) * bend * t * 0.22;
      pt.y += Math.cos(t * 2.7 + i * 0.5) * bend * t * 0.22;
      const bright = (0.2 + t * 0.95) * dim;
      col.copy(body).multiplyScalar(bright);
      if (t > 0.75) col.lerp(WHITE_TIP, ((t - 0.75) / 0.25) * 0.9);
      if (s > 0) {
        linePos.set([prev.x, prev.y, prev.z, pt.x, pt.y, pt.z], L * 6);
        lineCol.set(
          [col.r * 0.9, col.g * 0.9, col.b * 0.9, col.r, col.g, col.b],
          L * 6
        );
        L++;
      }
      prev.copy(pt);
    }
    tipPos.set([prev.x, prev.y, prev.z], i * 3);
    const tb = 0.7 + rnd(i, 11) * 0.3;
    tipCol.set([WHITE_TIP.r * tb, WHITE_TIP.g * tb, WHITE_TIP.b * tb], i * 3);
  }
  return { linePos, lineCol, tipPos, tipCol };
}

// ── Туннель: продольные волокна трубы, текущие мимо камеры ──

const T_FIBERS = 260;
const T_SEGS = 26;
const T_LEN = 42; // длина видимого участка трубы по Z

function buildTunnel() {
  const palette = ["#2b3bff", "#4a3df0", "#6c4ff6", "#2b6bff", "#33e6e0"].map(
    (c) => new THREE.Color(c)
  );
  const linePos = new Float32Array(T_FIBERS * T_SEGS * 2 * 3);
  const lineCol = new Float32Array(T_FIBERS * T_SEGS * 2 * 3);
  const pt = new THREE.Vector3();
  const prev = new THREE.Vector3();
  const col = new THREE.Color();

  let L = 0;
  for (let i = 0; i < T_FIBERS; i++) {
    const ang0 = rnd(i, 21) * Math.PI * 2;
    const radius = 2.6 + rnd(i, 22) * 1.7;
    const twist = 0.35 + rnd(i, 23) * 0.5; // спиральная закрутка трубы
    const z0 = -rnd(i, 24) * T_LEN;
    const body = pickColor(i, palette);
    const dim = 0.35 + rnd(i, 25) * 0.6;

    for (let s = 0; s <= T_SEGS; s++) {
      const t = s / T_SEGS;
      const z = z0 - t * (T_LEN * (0.35 + rnd(i, 26) * 0.3));
      const a = ang0 + z * twist * 0.14;
      const wob = 1 + Math.sin(z * 0.7 + i) * 0.05;
      pt.set(Math.cos(a) * radius * wob, Math.sin(a) * radius * wob, z);
      // Ярче в середине нити, темнее на концах — линия «дышит» глубиной.
      const bright = (0.25 + Math.sin(t * Math.PI) * 0.75) * dim;
      col.copy(body).multiplyScalar(bright);
      if (s > 0) {
        linePos.set([prev.x, prev.y, prev.z, pt.x, pt.y, pt.z], L * 6);
        lineCol.set(
          [col.r * 0.92, col.g * 0.92, col.b * 0.92, col.r, col.g, col.b],
          L * 6
        );
        L++;
      }
      prev.copy(pt);
    }
  }
  return { linePos, lineCol };
}

// ── Искры контакта: сноп частиц, разлетающийся от сущности ──

const SPARKS = 110;

function Sparks({ stateRef }) {
  const matRef = useRef();
  const seeds = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, i) => {
        const u = rnd(i, 31) * 2 - 1;
        const phi = rnd(i, 32) * Math.PI * 2;
        const sinT = Math.sqrt(1 - u * u);
        return {
          dir: new THREE.Vector3(sinT * Math.cos(phi), sinT * Math.sin(phi), u),
          speed: 1.6 + rnd(i, 33) * 2.4,
        };
      }),
    []
  );
  const pointsRef = useRef(null);
  const positions = useMemo(() => new Float32Array(SPARKS * 3), []);

  useFrame((_, delta) => {
    // Вся мутация — через рефы (three-объекты), как в остальной сцене.
    const attr = pointsRef.current?.geometry?.attributes?.position;
    if (!matRef.current || !attr) return;
    if (stateRef.current.sparkLife <= 0) {
      matRef.current.opacity = 0;
      return;
    }
    stateRef.current.sparkLife = Math.max(0, stateRef.current.sparkLife - delta);
    const age = 1.1 - stateRef.current.sparkLife; // 0 → 1.1s
    for (let i = 0; i < SPARKS; i++) {
      const d = seeds[i].dir;
      const r = 0.35 + age * seeds[i].speed;
      attr.setXYZ(i, d.x * r, d.y * r, d.z * r * 0.6);
    }
    attr.needsUpdate = true;
    matRef.current.opacity = Math.max(0, stateRef.current.sparkLife / 1.1) * 0.9;
    matRef.current.color.copy(stateRef.current.sparkColor);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.028}
        sizeAttenuation
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function SceneBody({ gender, reduce, stateRef }) {
  const entityGroup = useRef();
  const tunnelGroup = useRef();
  const entityLineMat = useRef();
  const entityTipMat = useRef();
  const tunnelMat = useRef();
  const tintTarget = useMemo(() => new THREE.Color(), []);

  const paletteKey = ENTITY_PALETTES[gender] ? gender : "n";
  const { entityGeom, entityTips } = useMemo(() => {
    const { linePos, lineCol, tipPos, tipCol } = buildEntity(
      ENTITY_PALETTES[paletteKey]
    );
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    lg.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    const tg = new THREE.BufferGeometry();
    tg.setAttribute("position", new THREE.BufferAttribute(tipPos, 3));
    tg.setAttribute("color", new THREE.BufferAttribute(tipCol, 3));
    return { entityGeom: lg, entityTips: tg };
  }, [paletteKey]);

  const tunnelGeom = useMemo(() => {
    const { linePos, lineCol } = buildTunnel();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const st = stateRef.current;

    // Импульс контакта затухает сам.
    st.pulse = Math.max(0, st.pulse - delta * 1.6);

    if (entityGroup.current) {
      const breathe = reduce ? 1 : 1 + Math.sin(t * 1.1) * 0.035;
      const s = breathe * (1 + st.pulse * 0.3);
      entityGroup.current.scale.setScalar(s);
      if (!reduce) {
        entityGroup.current.rotation.y += delta * 0.22;
        entityGroup.current.rotation.z += delta * 0.07;
        entityGroup.current.position.y = Math.sin(t * 0.6) * 0.08;
      }
      // На широких экранах после hero сущность уезжает вбок — летит РЯДОМ с
      // текстом, а не прячется за панелями; на телефоне остаётся по центру
      // (панели полупрозрачные — она просвечивает глубиной).
      const wide = state.size.width / state.size.height > 1.05;
      const aside = wide && st.progress > 0.02 ? 2.5 : 0;
      entityGroup.current.position.x +=
        (aside - entityGroup.current.position.x) * Math.min(1, delta * 1.8);
    }
    if (tunnelGroup.current) {
      // Скролл «везёт» по трубе: волокна текут навстречу; торможения нет —
      // прогресс приходит готовым (lerp на стороне страницы).
      const flow = st.progress * T_LEN * 1.4 + (reduce ? 0 : t * 0.25);
      tunnelGroup.current.position.z = flow % T_LEN;
      if (!reduce) tunnelGroup.current.rotation.z = st.progress * 2.2 + t * 0.02;
    }

    // Подкраска сущности и трубы: базово белый → акцент активной категории,
    // при вспышке контакта — сильнее.
    tintTarget.set("#ffffff").lerp(st.accent, 0.35 + st.pulse * 0.5);
    if (entityLineMat.current) {
      entityLineMat.current.color.lerp(tintTarget, 0.06);
      entityLineMat.current.opacity = 0.78 + st.pulse * 0.2;
    }
    if (entityTipMat.current) entityTipMat.current.color.lerp(tintTarget, 0.06);
    if (tunnelMat.current) {
      tunnelMat.current.color.lerp(tintTarget, 0.03);
    }
  });

  return (
    <>
      <group ref={tunnelGroup}>
        <lineSegments geometry={tunnelGeom} frustumCulled={false}>
          <lineBasicMaterial
            ref={tunnelMat}
            vertexColors
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      </group>

      <group ref={entityGroup} position={[0, 0, 4.2]}>
        <lineSegments geometry={entityGeom} frustumCulled={false}>
          <lineBasicMaterial
            ref={entityLineMat}
            vertexColors
            transparent
            opacity={0.78}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
        <points geometry={entityTips} frustumCulled={false}>
          <pointsMaterial
            ref={entityTipMat}
            vertexColors
            size={0.02}
            sizeAttenuation
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </points>
        <Sparks stateRef={stateRef} />
      </group>
    </>
  );
}

// API наружу: setProgress(0..1), setAccent("#hex"), pulse("#hex").
const ReadingScene = forwardRef(function ReadingScene({ gender }, ref) {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const stateRef = useRef({
    progress: 0,
    accent: new THREE.Color("#33e6e0"),
    pulse: 0,
    sparkLife: 0,
    sparkColor: new THREE.Color("#33e6e0"),
  });

  useImperativeHandle(ref, () => ({
    setProgress(p) {
      stateRef.current.progress = p;
    },
    setAccent(hex) {
      stateRef.current.accent.set(hex);
    },
    pulse(hex) {
      const st = stateRef.current;
      st.pulse = 1;
      st.sparkLife = 1.1;
      st.sparkColor.set(hex);
    },
  }));

  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 7.4], fov: 50 }}
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
      <SceneBody gender={gender} reduce={reduce} stateRef={stateRef} />
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.05}
          luminanceThreshold={0.16}
          luminanceSmoothing={0.75}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
});

export default ReadingScene;
