import * as T from 'three';
/** Renderer, lights and shadows shared by the landing journey and Zaky Simulator. */
export function createStage(label: string) {
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xfbfbf8, 1);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.domElement.setAttribute('aria-label', label);
  renderer.domElement.setAttribute('role', 'img');
  const scene = new T.Scene();
  scene.background = new T.Color(0xfbfbf8);
  scene.add(new T.HemisphereLight(0xffffff, 0x94a89e, 3));
  const sun = new T.DirectionalLight(0xffffff, 3.4);
  sun.position.set(-12, 32, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -20,
    right: 85,
    top: 25,
    bottom: -25,
    near: 0.1,
    far: 110,
  });
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  return { renderer, scene, sun };
}
