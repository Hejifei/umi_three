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
  z: 7,
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
  const points = useMemo(
    () => [
      {
        position: new Vector3(10, 46, 0),
        elementName: '.point-0',
      },
      {
        position: new Vector3(-10, 8, 24),
        elementName: '.point-1',
      },
      {
        position: new Vector3(30, 10, 70),
        elementName: '.point-2',
      },
      {
        position: new Vector3(-100, 50, -300),
        elementName: '.point-3',
      },
      {
        position: new Vector3(-120, 20, -100),
        elementName: '.point-4',
      },
    ],
    [],
  );

  const loadFile = useCallback((url: string, name: string): Promise<GLTF> => {
    loaderRef.current = new GLTFLoader(); //引入模型的loader实例
    return new Promise((resolve, reject) => {
      loaderRef.current.load(
        url,
        (gltf) => {
          let index = 1;
          gltf.scene.name = name;
          gltf.scene.traverse((child) => {
            if (child instanceof Mesh) {
              //  重置材料
              child.material.map = null;
              child.name = `${name}_${index}`;
              index++;
            }
          });
          resolve(gltf);
        },
        ({ loaded, total }) => {
          let load = Math.abs((loaded / total) * 100);
          loadingProcessRef.current = load;
          if (load >= 100) {
            setTimeout(() => {
              isLoadingRef.current = false;
            }, 1000);
          }
        },
        (err) => {
          reject(err);
        },
      );
    });
  }, []);

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
    cameraRef.current.position.set(x, y, z);
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
    const water = waterRef.current;
    const controls = controlsRef.current;
    const clock = clockRef.current;
    if (!water || !clock) {
      return;
    }
    water.material.uniforms['time'].value += 1.0 / 60.0;
    controls && controls.update();
    const delta = clock.getDelta();
    // this.mixers && this.mixers.forEach(item => {
    //   item.update(delta);
    // });
    const timer = Date.now() * 0.0005;
    TWEEN && TWEEN.update();
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
    // 遍历每个点
    for (const point of points) {
      // 获取2D屏幕位置
      const screenPosition = point.position.clone();
      screenPosition.project(camera);
      raycaster.setFromCamera(screenPosition, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const { elementName } = point;
      const element = document.querySelector(elementName);
      if (element) {
        if (intersects.length === 0) {
          // 未找到相交点，显示
          element?.classList.add('visible');
        } else {
          // 找到相交点
          // 获取相交点的距离和点的距离
          const intersectionDistance = intersects[0].distance;
          const pointDistance = point.position.distanceTo(camera.position);
          // 相交点距离比点距离近，隐藏；相交点距离比点距离远，显示
          if (intersectionDistance < pointDistance) {
            element.classList.remove('visible');
          } else {
            element.classList.add('visible');
          }
        }
        const translateX = screenPosition.x * sizes.width * 0.5;
        const translateY = -screenPosition.y * sizes.height * 0.5;
        element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
      }
    }
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
    // 相机向外移动极限
    // controlsRef.current.maxPolarAngle = 0.9 * Math.PI / 2
    // //  启用惯性
    // controlsRef.current.enableZoom = true

    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.enableDamping = true;
    // controlsRef.current.enablePan = true; //  是否开启相机平移操作
    controlsRef.current.maxPolarAngle = 1.5;
    controlsRef.current.panSpeed = 2.0;
    controlsRef.current.minDistance = 50;
    controlsRef.current.maxDistance = 1200;

    controlsRef.current.addEventListener('change', controlRender);
  }, []);

  //  自动转动
  const changeAutoRotateStatus = (isAuto: boolean = true) => {
    if (!controlsRef.current) {
      return;
    }
    controlsRef.current.autoRotate = isAuto;
    setIsAutoRotate(isAuto);
  };

  const setCarColor = useCallback((index: number) => {
    const currentColor = new Color(colorAry[index]);
    // 修改某个分组下面某个材料的颜色
    sceneRef.current?.getObjectByName('inverter_1_0')?.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const name = child.name;
        if (name.includes('inverter_6')) {
          (child as Mesh).material.color.set(currentColor);
        }
      }
    });
    // 修改所有的某个材料的颜色
    // sceneRef.current?.traverse((child) => {
    //   if ((child as Mesh).isMesh) {
    //     // inverter_1_0
    //     console.log({
    //       child,
    //       name: child.name,
    //       xxx: sceneRef.current?.getObjectByName('inverter_1_0'),
    //     })
    //     const name = child.name;
    //     // console.log(child.name, {child})
    //     if (name.includes('inverter_6')) {
    //       // if (child.name.includes('body_color')) {
    //       (child as Mesh).material.color.set(currentColor);
    //     }
    //   }
    // });
  }, []);

  const addBatteryAndSolarToGroup = useCallback(
    (group: Group, batteryGltf: GLTF, solarGltf: GLTF) => {
      for (let i = 0; i < 20; i++) {
        const batteryGltfCloned = batteryGltf.scene.clone();
        batteryGltfCloned.position.y = 1.5 * i;
        group.add(batteryGltfCloned);

        const solarGltfClone = solarGltf.scene.clone();
        solarGltfClone.position.x = -6 * i;
        group.add(solarGltfClone);
      }
    },
    [],
  );

  const groupClone = useCallback(async (group: Group) => {
    for (let i = 0; i < 10; i++) {
      const groupChildren = group.children;

      const groupCloned1 = new Group();
      const groupCloned2 = new Group();
      const groupCloned3 = new Group();
      const groupCloned4 = new Group();

      groupChildren.forEach((item) => {
        const itemClone1 = item.clone();
        itemClone1.name = `${itemClone1.name}_1_${i}`;
        const itemClone2 = item.clone();
        itemClone2.name = `${itemClone2.name}_1_${i}`;
        const itemClone3 = item.clone();
        itemClone3.name = `${itemClone3.name}_1_${i}`;
        const itemClone4 = item.clone();
        itemClone4.name = `${itemClone4.name}_1_${i}`;
        itemClone1.traverse((child) => {
          if (child instanceof Mesh) {
            child.material = child.material.clone();
          }
        });
        groupCloned1.add(itemClone1);

        itemClone2.traverse((child) => {
          if (child instanceof Mesh) {
            child.material = child.material.clone();
          }
        });
        groupCloned2.add(itemClone2);

        itemClone3.traverse((child) => {
          if (child instanceof Mesh) {
            child.material = child.material.clone();
          }
        });
        groupCloned3.add(itemClone3);

        itemClone4.traverse((child) => {
          if (child instanceof Mesh) {
            child.material = child.material.clone();
          }
        });
        groupCloned4.add(itemClone4);
      });

      groupCloned1.position.z = -20 * i;
      sceneRef.current?.add(groupCloned1);

      groupCloned4.position.x = 50;
      groupCloned4.position.z = -20 * i;
      sceneRef.current?.add(groupCloned4);

      groupCloned2.position.x = -50;
      groupCloned2.position.z = -20 * i;
      sceneRef.current?.add(groupCloned2);

      groupCloned3.position.x = -100;
      groupCloned3.position.z = -20 * i;
      sceneRef.current?.add(groupCloned3);
    }
  }, []);

  const onMouseClick = useCallback((e) => {
    e.preventDefault();
    let element = contentRef.current;
    if (
      !element ||
      !cameraRef.current ||
      !rendererRef.current ||
      !raycasterRef.current ||
      !mouseRef.current
    ) {
      return;
    }
    const mouse = mouseRef.current;
    // 将鼠标点击位置的屏幕坐标转成threejs中的标准坐标，以屏幕中心为原点，值的范围为-1到1.
    mouse.x = (e.clientX / element.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / element.clientHeight) * 2 + 1;
    // 通过鼠标点的位置和当前相机的矩阵计算出raycaster
    const point = raycasterRef.current.setFromCamera(mouse, cameraRef.current);
    const origin = raycasterRef.current.ray.origin;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) {
      return;
    }

    // 给点击的第一个添加效果
    const sceneChildren = sceneRef.current?.children;
    // sceneRef.current?.getObjectById()
    if (!sceneChildren) {
      return;
    }
    //  射线和模型求交,选中一系列直线
    let intersects = raycasterRef.current.intersectObjects(sceneChildren);
    if (intersects.length > 0) {
      // 可以通过遍历实现点击不同mesh触发不同交互，如：
      //  选中第一个射线相交的物体
      let selectedObj = intersects[0].object;
      if (selectedObj.name.includes('inverter_6')) {
        (selectedObj as Mesh).material.color.set('red');
      }
    }
  }, []);

  const addWater = useCallback(() => {
    const waterGeometry = new PlaneGeometry(10000, 10000);
    const water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new TextureLoader().load(waterTexture, (texture) => {
        texture.wrapS = texture.wrapT = RepeatWrapping;
      }),
      sunDirection: new Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x0072ff,
      distortionScale: 4,
      fog: sceneRef.current?.fog !== undefined,
    });
    water.rotation.x = -Math.PI / 2;
    waterRef.current = water;
    sceneRef.current?.add(water);
  }, []);

  const addSky = useCallback(() => {
    const sky = new Sky();
    sky.scale.setScalar(10000);
    sceneRef.current?.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 20;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }
    // 太阳
    const sun = new Vector3();
    const pmremGenerator = new PMREMGenerator(renderer);
    const phi = MathUtils.degToRad(88);
    const theta = MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);
    const water = waterRef.current;
    const scene = sceneRef.current;
    if (!water || !scene) {
      return;
    }
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();
    scene.environment = pmremGenerator.fromScene(sky).texture;
  }, []);

  const addClock = useCallback(() => {
    clockRef.current = new Clock();
  }, []);

  const addClickPoint = useCallback(() => {
    const points = [
      {
        position: new Vector3(10, 46, 0),
        element: document.querySelector('.point-0'),
      },
      // ...
    ];
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) {
      return;
    }
    document.querySelectorAll('.point').forEach((item) => {
      item.addEventListener(
        'click',
        (event: Event) => {
          const classList = (event.target as HTMLDivElement).classList;
          let className = classList[classList.length - 1];
          switch (className) {
            case 'label-0':
              Animations.animateCamera(
                camera,
                controls,
                { x: -15, y: 80, z: 60 },
                { x: 0, y: 0, z: 0 },
                1600,
                () => {},
              );
              break;
            case 'label-1':
              Animations.animateCamera(
                camera,
                controls,
                { x: -20, y: 10, z: 60 },
                { x: 0, y: 0, z: 0 },
                1600,
                () => {},
              );
              break;
            case 'label-2':
              Animations.animateCamera(
                camera,
                controls,
                { x: 30, y: 10, z: 100 },
                { x: 0, y: 0, z: 0 },
                1600,
                () => {},
              );
              break;
            case 'label-3':
              Animations.animateCamera(
                camera,
                controls,
                { x: -120, y: 76, z: -368 },
                { x: 0, y: 0, z: 0 },
                1600,
                () => {},
              );
              break;
            default:
              Animations.animateCamera(
                camera,
                controls,
                { x: -138, y: 27, z: -115 },
                { x: 0, y: 0, z: 0 },
                1600,
                () => {},
              );
              break;
          }
        },
        false,
      );
    });
  }, []);

  const changeEditStatus = useCallback((editAble: boolean) => {
    if (!controlsRef.current) {
      return;
    }
    controlsRef.current.enableRotate = !editAble; //  是否允许旋转视角
    setIsEditing(editAble);
  }, []);

  const initDragControls = useCallback(() => {
    const camera = cameraRef.current;
    const content = contentRef.current;
    const control = controlsRef.current;
    if (!camera || !content || !control) {
      return;
    }
    // const objects: any[] = [];
    // sceneRef.current?.children.forEach(groupItem => {
    //   if ((groupItem as Group).isGroup) {
    //     objects.unshift(groupItem)
    //   }
    // })
    // const dragControls = new DragControls(objects, camera, content);
    // sceneRef.current?.traverse((child) => {
    //   if ((child as Mesh).isMesh) {
    //     objects.push(child);
    //   }
    // });

    const dragControls = new DragControls([], camera, content);
    // const dragControls = new DragControls(objects, camera, rendererRef.current?.domElement)
    const draggableObjects = dragControls.getObjects();
    //   console.log({
    //     draggableObjects,
    //   });
    draggableObjects.length = 0;

    sceneRef.current?.children.forEach((groupItem) => {
      if ((groupItem as Group).isGroup) {
        draggableObjects.push(groupItem);
        console.log({
          groupItem,
        });
      }
    });
    dragControls.transformGroup = true;
    dragControlRef.current = dragControls;
    // const transformControls = new TransformControls(camera, content)
    // transformControlsRef.current = transformControls

    // dragControls.addEventListener('hoveron', function (event) {
    //   // 让变换控件对象和选中的mesh与其group绑定
    //   console.log('===', event);
    //   // transformControls.attach( event.object.parent);
    // });

    dragControls.addEventListener('dragstart', function (event) {
      control.enabled = false;
    });
    dragControls.addEventListener('dragend', function (event) {
      control.enabled = true;
    });
  }, []);

  const init = useCallback(async () => {
    // 将 gltf 模型放在静态资源文件夹public下才能被访问到

    //  逆变器模型加载
    const inverterGltf = await loadFile(
      'models/inverter/scene.gltf',
      'inverter',
    );
    inverterGltf.scene.position.x = 1;
    inverterGltf.scene.position.y = 0.5;
    inverterGltf.scene.position.z = 0;
    inverterGltf.scene.scale.set(2, 2, 2);

    //  光伏板模型加载
    const blankGltf = await loadFile('models/blank/scene.gltf', 'blank');
    blankGltf.scene.position.x = 5;
    blankGltf.scene.rotateX(-Math.PI / 2);

    const group = new Group();
    group.add(blankGltf.scene.clone());
    group.add(inverterGltf.scene.clone());

    addClock();
    addScene();
    addCamera();
    addLight();
    setControls();
    groupClone(group);
    addWater();
    addSky();
    addClickPoint();
    sceneRef.current?.remove(inverterGltf.scene);
    inverterGltf.scene.remove();
    initDragControls();

    loop();

    /**
     * 辅助线坐标轴显示
     */
    const axesHelper = new AxesHelper(400);
    sceneRef.current?.add(axesHelper);

    /**
     * 辅助线网格显示
     */
    const size = 100;
    const divisions = 20;
    const gridHelper = new GridHelper(size, divisions);
    sceneRef.current?.add(gridHelper);

    raycasterRef.current = new Raycaster();
    mouseRef.current = new Vector2();
    window.addEventListener('click', onMouseClick, false);

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

  const freeUp = useCallback((obj: Scene) => {
    obj.children.forEach((data) => {
      if (data.children) {
        freeUp(data);
      }

      data.geometry?.dispose();
      if (data.material?.type) {
        data.material.dispose();
        data.material.map?.dispose();
        data.material.envMap?.dispose();
      }
    });
  }, []);

  useEffect(() => {
    init();

    return () => {
      const scene = sceneRef.current;
      if (scene) {
        freeUp(scene);
      }
    };
  }, []);

  return (
    <div className={'wrapper'}>
      <div ref={contentRef} id={'container'}></div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <p>x: {map.x}</p>
        <p>y: {map.y}</p>
        <p>z: {map.z}</p>
        <button onClick={() => changeEditStatus(!isEditing)}>
          {isEditing ? '查看' : '编辑'}
        </button>
        <button onClick={() => changeAutoRotateStatus(!isAutoRotate)}>
          转动/停止
        </button>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '20px',
            height: '20px',
            border: '1px solid #fff',
            flex: 1,
          }}
        >
          {colorAry.map((item, index) => (
            <div
              key={item}
              onClick={() => setCarColor(index)}
              style={{
                backgroundColor: item,
                flex: 1,
              }}
            ></div>
          ))}
        </div>
      </div>
      <div className="point point-0">
        <div className="label label-0">1</div>
        <div className="text">正上方: 这里是描述性文字</div>
      </div>
      <div className="point point-1">
        <div className="label label-1">2</div>
        <div className="text">左边视角: 这里是描述性文字</div>
      </div>
      <div className="point point-2">
        <div className="label label-2">3</div>
        <div className="text">右前方: 这里是描述性文字</div>
      </div>
      <div className="point point-3">
        <div className="label label-3">4</div>
        <div className="text">中间视角: 这里是描述性文字。</div>
      </div>
      <div className="point point-4">
        <div className="label label-4">5</div>
        <div className="text">xxx: 这里是描述性文字。</div>
      </div>
    </div>
  );
}
