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
  MeshLambertMaterial,
  SpotLight,
  PCFShadowMap,
  // Geometry,
  DoubleSide,
  Line,
  BufferGeometry,
  Float32BufferAttribute,
  ConeGeometry,
  CylinderGeometry,
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
export default function RoofPage() {
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
  const groupRef = useRef<Group>();
  const enableSelectionRef = useRef<boolean>(false);

  const addScene = useCallback(() => {
    //  场景
    sceneRef.current = new Scene();
    sceneRef.current.background = new Color(0xf0f0f0);

    rendererRef.current = new WebGLRenderer({
      antialias: true,
    });
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.shadowMap.enabled = true;
    rendererRef.current.shadowMap.type = PCFShadowMap;
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
      5000,
    );
    cameraRef.current.position.z = 1000;
    // cameraRef.current.lookAt(cameraRef.current.position)
    // const scene = sceneRef.current
    // if (!scene) {
    //   return
    // }
    // cameraRef.current.lookAt(scene.position)
  }, []);

  const addLight = useCallback(() => {
    // 添加环境光
    // const ambientLight = new AmbientLight(0xffffff, 0.8);
    // sceneRef.current?.add(ambientLight);
    // /**
    //  * DirectionalLight 平行光
    //  * DirectionalLight( color : Integer, intensity : Float )
    //  * color - (可选参数) 16进制表示光的颜色。 缺省值为 0xffffff (白色)。
    //  * intensity - (可选参数) 光照的强度。缺省值为1。
    //  */
    // directionalLightRef.current = new DirectionalLight(0xffffff, 1);
    // directionalLightRef.current.position.set(-4, 8, 4);
    // dhelperRef.current = new DirectionalLightHelper(
    //   directionalLightRef.current,
    //   5,
    //   0xff0000,
    // );
    // hemisphereLightRef.current = new HemisphereLight(0xffffff, 0xffffff, 0.4);
    // hemisphereLightRef.current.position.set(0, 8, 0);
    // hHelperRef.current = new HemisphereLightHelper(
    //   hemisphereLightRef.current,
    //   5,
    // );
    // sceneRef.current?.add(directionalLightRef.current);
    // sceneRef.current?.add(hemisphereLightRef.current);
    sceneRef.current?.add(new AmbientLight(0x505050));
    const light = new SpotLight(0xffffff, 1.5);
    light.position.set(0, 500, 2000);
    light.angle = Math.PI / 9;

    light.castShadow = true;
    light.shadow.camera.near = 1000;
    light.shadow.camera.far = 4000;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
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
  }, []);

  const render = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) {
      return;
    }

    renderer.render(scene, camera);
  }, []);

  const addDragControl = useCallback(() => {
    const camera = cameraRef.current;
    // const group = groupRef.current
    if (!camera) {
      return;
    }
    // const dragControls = new DragControls(
    //   [...drag_obj_ref.current],
    //   camera,
    //   rendererRef.current?.domElement,
    // );
    const dragControls = new DragControls(
      [],
      camera,
      rendererRef.current?.domElement,
    );
    // dragControls.addEventListener( 'drag', render );
    dragControlRef.current = dragControls;

    const control = controlsRef.current;
    if (!control) {
      return;
    }
    dragControls.addEventListener('dragstart', function (event) {
      control.enabled = false;
      // const object = event.object;
      // const parentGroup = object.parent;
      // console.log('dragstart', {
      //   event,
      //   object,
      //   parentGroup,
      // });
      // const draggableObjects = dragControls.getObjects();
      // console.log({
      //   draggableObjects,
      // });
      // draggableObjects.length = 0;
      // // parentGroup.children.forEach((child: any) => {
      // //   if ((child as Mesh).isMesh) {
      // //     // group.attach( object )
      // //     console.log({
      // //       child,
      // //     })
      // //     child.material.emissive.set( 0x000000 );
      // //     // sceneRef.current?.attach( child );
      // //   }
      // // });
      // dragControls.transformGroup = true;
      // draggableObjects.push(parentGroup);
    });
    dragControls.addEventListener('dragend', function (event) {
      control.enabled = true;
      // console.log('dragend');
      // // dragControls.transformGroup = false;
      // const draggableObjects = dragControls.getObjects();
      // console.log({
      //   draggableObjects,
      // });
      // // draggableObjects.length = 0;
      // // draggableObjects.push(...drag_obj_ref.current);
    });
  }, []);

  const onClick = useCallback((event) => {
    event.preventDefault();
    const enableSelection = enableSelectionRef.current;
    const dragControls = dragControlRef.current;
    const objects = drag_obj_ref.current;
    const mouse = mouseRef.current;
    const raycaster = raycasterRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    console.log('click', {
      dragControls,
      mouse,
      raycaster,
      camera,
      scene,
    });
    if (!dragControls || !mouse || !raycaster || !camera || !scene) {
      return;
    }

    console.log({
      enableSelection,
      val: enableSelectionRef.current,
    });
    if (enableSelection === true) {
      const draggableObjects = dragControls.getObjects();
      draggableObjects.length = 0;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const intersections = raycaster.intersectObjects(objects, true);

      console.log({
        intersections,
        xxx: sceneRef.current?.children,
      });
      if (intersections.length > 0) {
        const object = intersections[0].object;
        const objectGroup = object.parent as Group;
        // if (group.children.includes(object)) {
        //   object.material.emissive.set(0x000000);
        //   scene.attach(object);
        // } else {
        //   object.material.emissive.set(0xaaaaaa);
        //   group.attach(object);
        // }
        sceneRef.current?.traverse((child) => {
          if ((child as Mesh).isMesh) {
            child.material.emissive.set(0x000000);
          }
        });
        if ((objectGroup as Group).isGroup) {
          objectGroup?.children.forEach((child) => {
            if ((child as Mesh).isMesh) {
              child.material.emissive.set(0xaaaaaa);
            }
          });
        }
        console.log({
          object,
        });

        dragControls.transformGroup = true;
        draggableObjects.push(objectGroup);
        return;
      }

      // if (group.children.length === 0) {
      dragControls.transformGroup = false;
      draggableObjects.push(...objects);
      // }
    }
    // render();
  }, []);

  const onKeyDown = useCallback((event) => {
    enableSelectionRef.current = event.keyCode === 16 ? true : false;
  }, []);

  const onKeyUp = useCallback(() => {
    enableSelectionRef.current = false;
  }, []);

  const init = useCallback(async () => {
    raycasterRef.current = new Raycaster();
    mouseRef.current = new Vector2();
    addScene();
    addCamera();
    addLight();
    setControls();

    const group1 = new Group();
    sceneRef.current?.add(group1);
    const group2 = new Group();
    sceneRef.current?.add(group2);
    const group3 = new Group();
    sceneRef.current?.add(group3);

    // const geometry = new BoxGeometry(40, 40, 40);
    // for (let i = 0; i < 5; i++) {
    //   const object = new Mesh(
    //     geometry,
    //     new MeshLambertMaterial({ color: Math.random() * 0xffffff }),
    //   );

    //   object.position.x = Math.random() * 1000 - 500;
    //   object.position.y = Math.random() * 600 - 300;
    //   object.position.z = Math.random() * 800 - 400;

    //   object.rotation.x = Math.random() * 2 * Math.PI;
    //   object.rotation.y = Math.random() * 2 * Math.PI;
    //   object.rotation.z = Math.random() * 2 * Math.PI;

    //   object.scale.x = Math.random() * 2 + 1;
    //   object.scale.y = Math.random() * 2 + 1;
    //   object.scale.z = Math.random() * 2 + 1;

    //   object.castShadow = true;
    //   object.receiveShadow = true;

    //   // sceneRef.current?.add( object );
    //   if (i % 3 === 0) {
    //     group1.add(object);
    //   } else if (i % 3 === 1) {
    //     group2.add(object)
    //   } else {
    //     group3.add(object)
    //   }
    //   drag_obj_ref.current.push(object);
    // }
    // // sceneRef.current?.add(group);
    // addDragControl();

    // var geometry = new BufferGeometry();//声明一个空几何体对象

    // const positions = [];
    // const r = 800;

    // for ( let i = 0; i < 2; i ++ ) {
    //   const x = Math.random() * r - r / 2;
    //   const y = Math.random() * r - r / 2;
    //   const z = Math.random() * r - r / 2;
    //   // positions
    //   positions.push( x, y, z );

    // }
    // geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
    // // generateMorphTargets( geometry );1
    // geometry.computeBoundingSphere();

    // // var p1 = new Vector3(10,0,0);//顶点1坐标
    // // var p2 = new Vector3(0,20,0);//顶点2坐标
    // // geometry.vertices.push(p1,p2); //顶点坐标添加到geometry对象
    // var material=new LineBasicMaterial({
    //     color:0x0000ff //线条颜色
    // });//材质对象
    // var line=new Line(geometry,material);//线条模型对象
    // sceneRef.current?.add(line);

    const geometry = new CylinderGeometry(50, 50, 200, 3);
    const material = new MeshBasicMaterial({ color: 0x0000ff });

    const cone = new Mesh(geometry, material);
    // cone.position.x = Math.random() * 1000 - 500;
    // cone.position.y = Math.random() * 600 - 300;
    cone.position.y = 24;
    // cone.position.z = Math.random() * 800 - 400;

    cone.rotation.x = Math.PI / 2;
    // cone.rotation.x = Math.PI / 6;
    cone.rotation.y = Math.PI / 3;
    sceneRef.current?.add(cone);

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

    loop();

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

    document.addEventListener('click', onClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
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
