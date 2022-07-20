import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  Children,
} from 'react';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { Water } from 'three/examples/jsm/objects/Water';
import { Sky } from 'three/examples/jsm/objects/Sky';
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLight,
  HemisphereLightHelper,
  BoxGeometry,
  MeshNormalMaterial,
  Mesh,
  Color,
  Group,
  AxesHelper,
  GridHelper,
  Vector2,
  Vector3,
  Raycaster,
  AmbientLight,
  PlaneGeometry,
  TextureLoader,
  RepeatWrapping,
  PMREMGenerator,
  MathUtils,
  ACESFilmicToneMapping,
  Clock,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
} from 'three';
import TWEEN from '@tweenjs/tween.js';
import Animations from '@/utils/animations';
import waterTexture from '@/assets/image/waternormals.jpg';
import './index.less';
import { render } from 'react-dom';

const colorAry = [
  'rgb(255, 255, 255)',
  'rgb(216, 27, 67)',
  'rgb(142, 36, 170)',
  'rgb(81, 45, 168)',
  'rgb(48, 63, 159)',
  'rgb(30, 136, 229)',
  'rgb(0, 137, 123)',
  'rgb(67, 160, 71)',
  'rgb(251, 192, 45)',
  'rgb(245, 124, 0)',
  'rgb(230, 74, 25)',
  'rgb(233, 30, 78)',
  'rgb(156, 39, 176)',
  'rgb(0, 0, 0)',
];

const defaultMap = {
  x: 0,
  y: 1,
  z: 1,
};
export default function IndexPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [map, setMap] = useState({ ...defaultMap });
  const mapRef = useRef({ ...defaultMap });
  const contentRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene>();
  const cameraRef = useRef<PerspectiveCamera>();
  const rendererRef = useRef<WebGLRenderer>();
  const directionalLightRef = useRef<DirectionalLight>();
  const dhelperRef = useRef<DirectionalLightHelper>();
  const hemisphereLightRef = useRef<HemisphereLight>();
  const hHelperRef = useRef<HemisphereLightHelper>();
  const loadingProcessRef = useRef<number>(0);
  const isLoadingRef = useRef(true);
  const loaderRef = useRef(new GLTFLoader());
  const controlsRef = useRef<OrbitControls>();
  const raycasterRef = useRef<Raycaster>();
  const mouseRef = useRef<Vector2>();
  const waterRef = useRef<Water>();
  const clockRef = useRef<Clock>();
  const dragControlRef = useRef<DragControls>();
  const transformControlsRef = useRef<TransformControls>();
  const cubesRef = useRef<Mesh[]>([]);
  const drag_obj_ref = useRef<any[]>([]);

  const addScene = useCallback(() => {
    //  场景
    sceneRef.current = new Scene();

    rendererRef.current = new WebGLRenderer({
      antialias: true,
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    // 设置渲染效果
    rendererRef.current.toneMapping = ACESFilmicToneMapping;
    const container = contentRef.current as unknown as HTMLElement;
    container?.appendChild(rendererRef.current.domElement);
  }, []);

  const addCamera = useCallback(() => {
    //  相机
    cameraRef.current = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    );
    const { x, y, z } = defaultMap;
    cameraRef.current.position.set(x, y, z).setLength(15);
    // cameraRef.current.lookAt(cameraRef.current.position)
    const scene = sceneRef.current;
    if (!scene) {
      return;
    }
    cameraRef.current.lookAt(scene.position);
  }, []);

  const addLight = useCallback(() => {
    // 添加环境光
    const ambientLight = new AmbientLight(0xffffff, 0.8);
    sceneRef.current?.add(ambientLight);
    /**
     * DirectionalLight 平行光
     * DirectionalLight( color : Integer, intensity : Float )
     * color - (可选参数) 16进制表示光的颜色。 缺省值为 0xffffff (白色)。
     * intensity - (可选参数) 光照的强度。缺省值为1。
     */
    directionalLightRef.current = new DirectionalLight(0xffffff, 1);
    directionalLightRef.current.position.set(-4, 8, 4);
    dhelperRef.current = new DirectionalLightHelper(
      directionalLightRef.current,
      5,
      0xff0000,
    );
    hemisphereLightRef.current = new HemisphereLight(0xffffff, 0xffffff, 0.4);
    hemisphereLightRef.current.position.set(0, 8, 0);
    hHelperRef.current = new HemisphereLightHelper(
      hemisphereLightRef.current,
      5,
    );
    sceneRef.current?.add(directionalLightRef.current);
    sceneRef.current?.add(hemisphereLightRef.current);
  }, []);

  const loop = useCallback(() => {
    requestAnimationFrame(loop);
    const controls = controlsRef.current;
    controls && controls.update();
    const camera = cameraRef.current;
    const raycaster = raycasterRef.current;
    const scene = sceneRef.current;
    if (!camera || !raycaster || !scene) {
      return;
    }
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    if (sceneRef.current && cameraRef.current) {
      rendererRef.current?.render(sceneRef.current, cameraRef.current);
      controlsRef.current?.update();
    }
  }, []);

  const controlRender = useCallback(() => {
    if (!cameraRef.current) {
      return;
    }
    mapRef.current.x = Number.parseInt(`${cameraRef.current.position.x}`);
    mapRef.current.y = Number.parseInt(`${cameraRef.current.position.y}`);
    mapRef.current.z = Number.parseInt(`${cameraRef.current.position.z}`);
    setMap({ ...mapRef.current });
  }, []);

  //  设置模型控制
  const setControls = useCallback(() => {
    if (!cameraRef?.current) {
      return;
    }
    //  添加控制器
    controlsRef.current = new OrbitControls(
      cameraRef.current,
      rendererRef.current?.domElement,
    );

    // controlsRef.current.target.set(0, 0, 0);
    // controlsRef.current.enableDamping = true;
    // // controlsRef.current.enablePan = true; //  是否开启相机平移操作
    // controlsRef.current.maxPolarAngle = 1.5;
    // controlsRef.current.panSpeed = 2.0;
    // controlsRef.current.minDistance = 50;
    // controlsRef.current.maxDistance = 1200;

    // controlsRef.current.addEventListener('change', controlRender);
  }, []);

  const setRandomPosition = useCallback((obj: Mesh) => {
    obj.position.set(
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
      Math.random() * 10 - 5,
    );
  }, []);

  const createCube = useCallback((color: string) => {
    const cubegeom = new BoxGeometry(1, 1, 1);
    const edgeGeo = new EdgesGeometry(cubegeom);
    const material = new LineBasicMaterial({
      color: color,
      linewidth: 1,
    });
    let lines_mesh = new LineSegments(edgeGeo, material);
    let lines_mesh2 = new LineSegments(edgeGeo, material);
    var cube = new Mesh(
      cubegeom,
      new MeshBasicMaterial({
        color: color,
      }),
    );
    cube.add(lines_mesh);
    cube.add(lines_mesh2);
    setRandomPosition(cube);
    sceneRef.current?.add(cube);
    cubesRef.current.push(cube);
    return cube;
  }, []);

  const dragBindinit = useCallback(() => {
    const controls = controlsRef.current;
    const drag_obj = drag_obj_ref.current;
    const camera = cameraRef.current;
    const container = contentRef.current;
    // const dragControls = dragControlRef.current
    console.log('1');
    if (!controls || !drag_obj || !camera || !container) {
      return;
    }
    console.log('2');
    const dragControls = new DragControls(drag_obj, camera, container);
    dragControlRef.current = dragControls;
    // dragControls.transformRoot = true;
    dragControls.transformGroup = true;
    dragControls.addEventListener('dragstart', function (event) {
      controls.enabled = false;
      console.log({
        enabled: controls.enabled,
      });
    });
    dragControls.addEventListener('dragend', function (event) {
      controls.enabled = true;
    });
  }, []);

  const raycast = useCallback((event: any) => {
    console.log('mousedown');
    drag_obj_ref.current.length = 0;
    var canvasBounds = rendererRef.current?.domElement.getBoundingClientRect();
    if (!canvasBounds) {
      return;
    }
    const mouse = mouseRef.current;
    const raycaster = raycasterRef.current;
    const camera = cameraRef.current;
    const dragControls = dragControlRef.current;
    const controls = controlsRef.current;
    if (!mouse || !raycaster || !camera || !dragControls || !controls) {
      return;
    }
    mouse.x =
      ((event.clientX - canvasBounds.left) /
        (canvasBounds.right - canvasBounds.left)) *
        2 -
      1;
    mouse.y =
      -(
        (event.clientY - canvasBounds.top) /
        (canvasBounds.bottom - canvasBounds.top)
      ) *
        2 +
      1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(cubesRef.current);
    console.log({
      intersects,
      cubes: cubesRef.current,
    });
    if (intersects.length > 0) {
      const INTERSECTED = intersects[0].object;
      drag_obj_ref.current.push(INTERSECTED);
    }
    dragControls.removeEventListener('dragstart', function (event) {
      controls.enabled = false;
    });
    dragControls.removeEventListener('dragend', function (event) {
      controls.enabled = true;
    });
    dragBindinit();
  }, []);

  const init = useCallback(async () => {
    addScene();
    addCamera();
    addLight();
    setControls();

    const cube1 = createCube('red');
    const cube2 = createCube('green');
    const cube3 = createCube('blue');

    /**
     * 辅助线坐标轴显示
     */
    const axesHelper = new AxesHelper(400);
    sceneRef.current?.add(axesHelper);

    /**
     * 辅助线网格显示
     */
    const size = 10;
    const divisions = 20;
    const gridHelper = new GridHelper(size, divisions);
    sceneRef.current?.add(gridHelper);

    raycasterRef.current = new Raycaster();
    mouseRef.current = new Vector2();
    dragBindinit();
    loop();
    window.addEventListener('mousedown', raycast, false);

    // 页面缩放监听并重新更新场景和相机
    window.addEventListener(
      'resize',
      () => {
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        if (!camera || !renderer) {
          return;
        }
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false,
    );
  }, []);

  useEffect(() => {
    init();
  }, []);

  return (
    <div className={'wrapper'}>
      <div ref={contentRef} id={'container'}></div>
    </div>
  );
}
