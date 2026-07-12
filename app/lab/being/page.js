"use client";

// Главный персонаж — НАСТОЯЩИЙ 3D нейбула-человек (C2b) · скрытая /lab/being.
// Модель сгенерена по референсу N1 Артёма (Nano Banana) через Hyper3D Rodin
// (Blender MCP) → public/models/nebula-human.glb (20k верт., + диск сакральной
// геометрии, запечённая нейбула-текстура). Поверх — энергетический шейдер:
// запечённая текстура × текущий шум (нейбула живёт) + френель-контур + Bloom
// + искры. Ползунок «Заполнение» 0→1 = крепчание по мере навыков.

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useGLTF, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const BG = "#04030d";

const VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorld;
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uFill;   // 0..1 — крепчание
  uniform float uGlow;   // яркость
  uniform float uFlow;   // скорость течения

  const vec3 C_RIM  = vec3(0.55, 0.85, 1.00);
  const vec3 C_DEEP = vec3(0.03, 0.04, 0.22);
  const vec3 C_BLUE = vec3(0.20, 0.40, 1.00);
  const vec3 C_VIOL = vec3(0.52, 0.26, 0.95);
  const vec3 C_PINK = vec3(1.00, 0.35, 0.80);

  // наша палитра нейбулы: тьма → синий → фиолет → розовый → белый
  vec3 palette(float t){
    vec3 c = mix(C_DEEP, C_BLUE, smoothstep(0.12, 0.52, t));
    c = mix(c, C_VIOL, smoothstep(0.42, 0.78, t));
    c = mix(c, C_PINK, smoothstep(0.72, 1.02, t));
    c = mix(c, vec3(1.0), smoothstep(1.22, 1.65, t));
    return c;
  }

  float hash31(vec3 p){
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 p){
    vec3 i = floor(p), f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    float a = hash31(i);
    float b = hash31(i + vec3(1,0,0));
    float c = hash31(i + vec3(0,1,0));
    float d = hash31(i + vec3(1,1,0));
    float e = hash31(i + vec3(0,0,1));
    float g = hash31(i + vec3(1,0,1));
    float h = hash31(i + vec3(0,1,1));
    float k = hash31(i + vec3(1,1,1));
    return mix(mix(mix(a,b,u.x), mix(c,d,u.x), u.y),
               mix(mix(e,g,u.x), mix(h,k,u.x), u.y), u.z);
  }
  float fbm3(vec3 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++){
      v += a * noise3(p);
      p = p * 2.03 + 7.7;
      a *= 0.5;
    }
    return v;
  }

  void main(){
    vec3 base = texture2D(uMap, vUv).rgb;
    // текстура Rodin бледная — берём её как карту ДЕТАЛЕЙ (яркость),
    // а цвет строим своей палитрой (референс: тёмное тело + нейбула-жилы)
    float detail = dot(base, vec3(0.299, 0.587, 0.114));

    // живой поток: 3D-шум по мировым координатам течёт вверх
    float t = uTime * 0.22 * uFlow;
    float n = fbm3(vWorld * 2.1 + vec3(0.0, -t, 0.0));
    float fil = 1.0 - abs(2.0 * fbm3(vWorld * 3.3 + vec3(t * 0.6, -t, 0.0)) - 1.0);
    fil = pow(clamp(fil, 0.0, 1.0), 3.0);

    // крепчание: 0 — тусклый призрак, 1 — плотная нейбула
    float fill = smoothstep(0.0, 1.0, uFill);

    // индекс палитры: детали текстуры × поток + жилы-филаменты
    // (гамма прижимает бледную текстуру: тело в основном тёмно-синее,
    //  жилы — фиолет/розовый, редкие пики — белые)
    float d = pow(detail, 2.2);
    float idx = d * (0.40 + 0.42 * n) + fil * 0.32 + smoothstep(0.78, 0.96, n) * 0.10;
    idx = min(idx, 1.5);
    idx *= (0.30 + 0.85 * fill);
    vec3 col = palette(idx) * (0.35 + 0.85 * fill);

    // френель-контур
    float fr = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.6);
    float rimPulse = 0.8 + 0.2 * sin(uTime * 1.7);
    col += C_RIM * fr * rimPulse * (0.18 + 0.5 * fill);

    // внутренние искры-звёзды
    float sp = step(0.9985, hash31(floor(vWorld * 55.0)));
    float tw = 0.5 + 0.5 * sin(uTime * 3.0 + hash31(floor(vWorld * 55.0)) * 40.0);
    col += vec3(1.0) * sp * tw * (0.3 + 0.7 * fill);

    col *= uGlow;
    // мягкий тонмап: яркое сжимается в цвет, а не выгорает в белый
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col *= 1.0 / (1.0 + lum * 0.55);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function NebulaHuman({ fill, glow, flow }) {
  const grp = useRef();
  const { scene } = useGLTF("/models/nebula-human.glb");

  const { group, uniforms } = useMemo(() => {
    const uniforms = {
      uMap: { value: null },
      uTime: { value: 0 },
      uFill: { value: fill },
      uGlow: { value: glow },
      uFlow: { value: flow },
    };
    const g = new THREE.Group();
    const src = scene.clone(true);
    src.updateWorldMatrix(true, true);

    // общий bbox → центрируем и приводим к высоте 3.6
    const box = new THREE.Box3().setFromObject(src);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const k = 3.6 / (size.y || 1);

    src.traverse((o) => {
      if (!o.isMesh) return;
      const map = o.material && o.material.map ? o.material.map : null;
      if (map && !uniforms.uMap.value) uniforms.uMap.value = map;
      o.material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        toneMapped: false,
        side: THREE.DoubleSide,
      });
      o.frustumCulled = false;
    });
    src.position.set(-c.x * k, -c.y * k, -c.z * k);
    src.scale.setScalar(k);
    g.add(src);
    return { group: g, uniforms };
  }, [scene]);

  const fillRef = useRef(fill); fillRef.current = fill;
  const glowRef = useRef(glow); glowRef.current = glow;
  const flowRef = useRef(flow); flowRef.current = flow;

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uFill.value += (fillRef.current - uniforms.uFill.value) * 0.08;
    uniforms.uGlow.value = glowRef.current;
    uniforms.uFlow.value = flowRef.current;
    if (grp.current) {
      const t = state.clock.elapsedTime;
      // мягкое покачивание (диск сзади — не крутим на 360°)
      grp.current.rotation.y = Math.sin(t * 0.25) * 0.22 + state.pointer.x * 0.15;
      grp.current.rotation.x = state.pointer.y * -0.05;
      grp.current.position.y = Math.sin(t * 0.6) * 0.05;
      grp.current.scale.setScalar(1 + Math.sin(t * 1.2) * 0.008);
    }
  });

  return (
    <group ref={grp}>
      <primitive object={group} />
      <Sparkles
        count={90}
        scale={[4.5, 5, 2.5]}
        size={2.2}
        speed={0.35}
        opacity={0.55}
        color="#9ecbff"
      />
    </group>
  );
}
useGLTF.preload("/models/nebula-human.glb");

export default function BeingPage() {
  const [fill, setFill] = useState(1);
  const [glow, setGlow] = useState(1.0);
  const [flow, setFlow] = useState(1.0);

  const panel =
    "pointer-events-auto rounded-xl border border-white/15 bg-black/50 backdrop-blur-md px-3 py-2";

  return (
    <main className="h-screen overflow-hidden" style={{ background: BG }}>
      <div className="fixed inset-0 z-0">
        <Canvas
          dpr={[1, 1.8]}
          camera={{ position: [0, 0, 5.6], fov: 42 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={[BG]} />
          <Suspense fallback={null}>
            <NebulaHuman fill={fill} glow={glow} flow={flow} />
          </Suspense>
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.85}
              luminanceThreshold={0.45}
              luminanceSmoothing={0.25}
              radius={0.6}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>

      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-3 px-4 py-3">
          <h1 className="text-sm font-semibold text-white/90">
            Персонаж — нейбула-человек (3D, Rodin по референсу N1)
          </h1>
        </div>
        <div className="absolute left-3 top-14 flex w-56 flex-col gap-2">
          {[
            ["Заполнение (рост)", fill, 0, 1, 0.02, setFill],
            ["Свечение", glow, 0.4, 2.0, 0.05, setGlow],
            ["Поток нейбулы", flow, 0, 3, 0.1, setFlow],
          ].map(([lb, v, mn, mx, st, set]) => (
            <label key={lb} className={`${panel} block text-[11px]`}>
              <span className="flex justify-between text-white/60">
                <span>{lb}</span>
                <span className="font-mono text-white/90">{v}</span>
              </span>
              <input
                type="range"
                min={mn}
                max={mx}
                step={st}
                value={v}
                onChange={(e) => set(parseFloat(e.target.value))}
                className="mt-0.5 w-full accent-[#7aa2ff]"
              />
            </label>
          ))}
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-white/40">
          Настоящий 3D: модель по референсу + живой энергетический шейдер. «Заполнение» — крепчание по навыкам.
        </p>
      </div>
    </main>
  );
}
