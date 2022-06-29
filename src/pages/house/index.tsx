import {useEffect, useRef, useState, useCallback} from 'react'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLight,
  HemisphereLightHelper,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  TextureLoader,
  SphereGeometry,
  SpriteMaterial,
  Sprite,
  Raycaster,
  Vector2,
  Vector3,
} from 'three'
import gsap from 'gsap'
import livingRoom from '@/assets/image/livingRoom.jpg'
import kitchen from '@/assets/image/kitchen.jpg'
import styles from './index.less'

const defaultMap = {
  x: 0,
  y: 1,
  z: 7,
}

interface IPosition {
  x: number
  y: number
  z: number
}
interface ITooltopContent {
  title: string
  text: string
  image?: number
  showTip: boolean
  showTitle: boolean
}
interface TipsListItem {
  position: IPosition
  content: ITooltopContent
}
interface IDataInfoItem {
  image: string
  tipsList: TipsListItem[]
}
export default function House() {
  const [dataList] = useState<IDataInfoItem[]>([
    {
        image: livingRoom, // 场景贴图
        tipsList: [ // 标签数据
            {
                position: { x: -200, y: -4, z: -147 }, // 标签位置
                content: { // 标签内容
                    title: "进入厨房", // 标题
                    text: "", // 文本内容
                    image: 1, // 场景贴图的下标，对应dataList下标
                    showTip: false, // 是否展示弹出框
                    showTitle: true, // 是否展示提示标题
                },
            },
            {
                position: { x: -100, y: 0, z: -231 },
                content: {
                    title: "相框",
                    text: "77989",
                    showTip: true,
                    showTitle: false,
                },
            },
            {
              position: { x: 36, y: -15, z: -250 },
              content: {
                  title: "大门",
                  text: "这里开门",
                  showTip: true,
                  showTitle: false,
              },
          },
            {
                position: { x: 150, y: -50, z: -198 },
                content: {
                    title: "台灯",
                    text: "qwdcz",
                    showTip: true,
                    showTitle: false,
                },
            },
            {
                position: { x: 210, y: 11, z: -140 },
                content: {
                    title: "鹿",
                    text: "大豆食心虫侦察十大大苏打大大大大大大大",
                    showTip: true,
                    showTitle: false,
                },
            },
            {
                position: { x: 208, y: -12, z: 140 },
                content: {
                    title: "电视",
                    text: "eq",
                    showTip: true,
                    showTitle: false,
                },
            },
            {
                position: { x: 86, y: -9, z: 236 },
                content: {
                    title: "进入房间",
                    text: "",
                    showTip: false,
                    showTitle: true,
                },
            },
        ],
    },
    {
        image: kitchen,
        tipsList: [
            {
                position: { x: -199, y: -24, z: 145 },
                content: {
                    title: "进入大厅",
                    text: "",
                    image: 0,
                    showTip: false,
                    showTitle: true,
                },
            },
        ],
    },
  ])
  const [tooltopContent, setTooltopContent] = useState<ITooltopContent>()
  const [isAutoRotate, setIsAutoRotate] = useState(false)
  const [map, setMap] = useState({...defaultMap})
  // 初始化位置全部在屏幕之外
  const [tooltipPosition, setTooltipPosition] = useState({
    top: "-100%",
    left: "-100%",
  })
  const [titlePosition, setTitlePosition] = useState({
    top: "-100%",
    left: "-100%",
  })
  const mapRef = useRef({...defaultMap})
  const contentRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<Scene>()
  const cameraRef = useRef<PerspectiveCamera>()
  const rendererRef = useRef<WebGLRenderer>()
  const directionalLightRef = useRef<DirectionalLight>()
  const dhelperRef = useRef<DirectionalLightHelper>()
  const hemisphereLightRef = useRef<HemisphereLight>()
  const hHelperRef = useRef<HemisphereLightHelper>()
  const controlsRef = useRef<OrbitControls>()
  const tooltipBoxRef = useRef<HTMLDivElement>(null)
  const titleBoxRef = useRef<HTMLDivElement>(null)
  const tipsSpriteListRef = useRef<Sprite[]>([])
  const sphereRef = useRef<Mesh<SphereGeometry, MeshBasicMaterial>>()

  const addScene = useCallback(() => {
    //  场景
    sceneRef.current = new Scene()

    rendererRef.current = new WebGLRenderer({
      antialias: true,
    })
    rendererRef.current.setSize(
      window.innerWidth,
      window.innerHeight,
    )
    const container = contentRef.current as unknown as HTMLElement
    container?.appendChild(rendererRef.current.domElement );
  }, [])

  const addCamera = useCallback(() => {
    //  相机
    cameraRef.current = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    );
    const {x, y , z} = defaultMap
    cameraRef.current.position.set(x, y, z)
  }, [])

  const addLight = useCallback(() => {
    /**
     * DirectionalLight 平行光
     * DirectionalLight( color : Integer, intensity : Float )
     * color - (可选参数) 16进制表示光的颜色。 缺省值为 0xffffff (白色)。
     * intensity - (可选参数) 光照的强度。缺省值为1。
     */
    directionalLightRef.current = new DirectionalLight(0xffffff, 1)
    directionalLightRef.current.position.set(-4, 8, 4)
    dhelperRef.current = new DirectionalLightHelper(directionalLightRef.current, 5, 0xff0000)
    hemisphereLightRef.current = new HemisphereLight(0xffffff, 0xffffff, 0.4)
    hemisphereLightRef.current.position.set(0, 8, 0)
    hHelperRef.current = new HemisphereLightHelper(hemisphereLightRef.current, 5)
    sceneRef.current?.add(directionalLightRef.current)
    sceneRef.current?.add(hemisphereLightRef.current)
  }, [])

  const loop = useCallback(() => {
    requestAnimationFrame(loop)
    if (sceneRef.current && cameraRef.current) {
      rendererRef.current?.render(sceneRef.current, cameraRef.current)
      controlsRef.current?.update()
    }
  }, [])

  const controlRender = useCallback(() => {
    if (!cameraRef.current) {
      return
    }
    mapRef.current.x = Number.parseInt(`${cameraRef.current.position.x}`)
    mapRef.current.y = Number.parseInt(`${cameraRef.current.position.y}`)
    mapRef.current.z = Number.parseInt(`${cameraRef.current.position.z}`)
    setMap({...mapRef.current})
  }, [])

  //  设置模型控制
  const setControls = useCallback(() => {
    if (!cameraRef?.current) {
      return
    }
    //  添加控制器
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current?.domElement)
    // 相机向外移动极限
    // controlsRef.current.maxPolarAngle = 0.9 * Math.PI / 2
    //  启用惯性  能否开启缩放
    controlsRef.current.enableZoom = true
    // 添加最大最小缩放比例
    controlsRef.current.minDistance = 1;
    controlsRef.current.maxDistance = 100;
    
    controlsRef.current.addEventListener('change', controlRender)
  }, [])

  //  自动转动
  const changeAutoRotateStatus = (isAuto: boolean = true) => {
    if (!controlsRef.current) {
      return
    }
    controlsRef.current.autoRotate = isAuto
    setIsAutoRotate(isAuto)
  }

  // 天空盒(skyBox) 体验较差
  const addSkyBoxIntoScene = useCallback(() => {
    let picList = ["left", "right", "top", "bottom", "front", "back"];
    let boxGeometry = new BoxGeometry(10, 10, 10);
    let boxMaterials: MeshBasicMaterial[] = [];
    picList.forEach((item) => {
      let texture = new TextureLoader().load(
        require(`@/assets/image/${item}.png`)
      );
      const material = new MeshBasicMaterial({ map: texture })
      boxMaterials.push(material);
    });
    const box = new Mesh(boxGeometry, boxMaterials);

    sceneRef.current?.add(box)
    box.geometry.scale(10, 10, -10)  //  将视觉移到立方体中心，并让贴图内翻转一下
  }, [])

  //  全景图片  体验较好
  const addSpherGeometryIntoScene = useCallback(() => {
    let sphereGeometry = new SphereGeometry(16, 50, 50);
    let texture = new TextureLoader().load(require("@/assets/image/livingRoom.jpg"));
    let sphereMaterial = new MeshBasicMaterial({ map: texture });
    const sphere = new Mesh(sphereGeometry, sphereMaterial)
    sceneRef.current?.add(sphere)
    sphereGeometry.scale(16, 16, -16)  //  视觉放球内，贴图反转
  }, [])

  const addTipsSprite = useCallback((index = 0) => {
    let tipTexture = new TextureLoader().load(
      require("@/assets/image/tip.png")
    );
    let material = new SpriteMaterial({ map: tipTexture });
    const tipsSpriteList: Sprite[] = [];
    dataList[index].tipsList.forEach((item) => {
      let sprite = new Sprite(material);
      sprite.scale.set(10, 10, 10);
      sprite.position.set(item.position.x, item.position.y, item.position.z); // 设置标签位置
      //  @ts-ignore
      sprite.content = item.content; // 设置标签内容
      tipsSpriteList.push(sprite); // 储存标签
      sceneRef.current?.add(sprite); // 添加到场景中
    });
    tipsSpriteListRef.current = tipsSpriteList
  }, [])

  const onResize = useCallback(() => {
    let element = contentRef.current
    if (!element || !cameraRef.current || !rendererRef.current) {
      return
    }
    cameraRef.current.aspect = element.clientWidth / element.clientHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(element.clientWidth, element.clientHeight);
  }, [])

  const handleTooltipHide = useCallback((e) => {
    e.preventDefault();
    setTooltipPosition({
      top: "-100%",
      left: "-100%",
    })
    setTitlePosition({
      top: "-100%",
      left: "-100%",
    })
    setTooltopContent(undefined)
  }, [])

  const initContent = useCallback((index = 0) => {
    let sphereGeometry = new SphereGeometry(16, 50, 50)
    sphereGeometry.scale(16, 16, -16)
    let texture = new TextureLoader().load(dataList[index].image)
    let sphereMaterial = new MeshBasicMaterial({ map: texture })
    const sphere = new Mesh(sphereGeometry, sphereMaterial)
    sphereRef.current = sphere
    sceneRef.current?.add(sphere)
    addTipsSprite()
  }, [])

  const changeContentAndtips = useCallback((index) => {
    if (index === undefined) {
      return
    }
    const scene = sceneRef.current
    if (!scene) {
      return
    }
    scene.children = scene.children.filter(
      (item) => String(item.type) !== "Sprite"
    );
    tipsSpriteListRef.current = [];
    let texture = new TextureLoader().load(dataList[index].image);
    let sphereMaterial = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
    });
    if (!sphereRef.current) {
      return
    }
    sphereRef.current.material = sphereMaterial;
    gsap.to(sphereMaterial, { transparent: true, opacity: 1, duration: 2 });
    cameraRef.current?.updateProjectionMatrix();
    addTipsSprite(index);
  }, [])
  
  const onMouseClick = useCallback((e) => {
    e.preventDefault();
    let element = contentRef.current
    if (!element || !cameraRef.current || !rendererRef.current) {
      return
    }
    let raycaster = new Raycaster();
    let mouse = new Vector2();
    mouse.x = (e.clientX / element.clientWidth) * 2 - 1;
    mouse.y = -(e.clientY / element.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, cameraRef.current);
    let intersects = raycaster.intersectObjects(tipsSpriteListRef.current, true);
    //  @ts-ignore
    if (intersects.length > 0 && intersects[0].object.content.showTitle) {
      //  @ts-ignore
      changeContentAndtips(intersects[0].object.content.image);
      handleTooltipHide(e);
    }
  }, [])

  const onMousemove = useCallback((e) => {
    e.preventDefault()
    let element = contentRef.current
    if (!element) {
      return
    }
    let raycaster = new Raycaster()
    let mouse = new Vector2()
    // 通过鼠标点击的位置计算出raycaster所需要的点的位置，以屏幕中心为原点，值的范围为-1到1.
    mouse.x = (e.clientX / element.clientWidth) * 2 - 1
    mouse.y = -(e.clientY / element.clientHeight) * 2 + 1
    if (!cameraRef.current) {
      return
    }
    raycaster.setFromCamera(mouse, cameraRef.current)
    // 将标签精灵数据放进来做视线交互
    let intersects = raycaster.intersectObjects(tipsSpriteListRef.current, true)
    // 视线穿过集合选择最前面的一个
    if (intersects.length > 0) {
      // 将标签的空间坐标转屏幕坐标，通过计算赋给元素的top、left
      let elementWidth = element.clientWidth / 2
      let elementHeight = element.clientHeight / 2
      let worldVector = new Vector3(
        intersects[0].object.position.x,
        intersects[0].object.position.y,
        intersects[0].object.position.z
      );
      let position = worldVector.project(cameraRef.current)
      //  @ts-ignore
      const content = intersects[0].object?.content as ITooltopContent
      setTooltopContent(content)
      if (content.showTip) {
        const tooltipBox = tooltipBoxRef.current as HTMLDivElement
        if (!tooltipBox) {
          return
        }
        const {clientWidth, clientHeight} = tooltipBox
        let left = Math.round(
          elementWidth * position.x +
            elementWidth -
            clientWidth / 2
        );
        let top = Math.round(
          -elementHeight * position.y +
            elementHeight -
            clientHeight / 2
        )
        setTooltipPosition({
          left: `${left}px`,
          top: `${top}px`,
        })
      } else if (content.showTitle) {
        const titleBox = titleBoxRef.current
        if (!titleBox) {
          return
        }
        let left = Math.round(
          elementWidth * position.x +
            elementWidth -
            titleBox.clientWidth / 2
        );
        let top = Math.round(-elementHeight * position.y + elementHeight);
        setTitlePosition({
          left: `${left}px`,
          top: `${top}px`,
        })
      }
    } else {
      // 鼠标移出去隐藏所有
      handleTooltipHide(e);
    }
  },[])

  const init = useCallback(async () => {
    
    

    addScene()
    addCamera()
    addLight()
    setControls()

    //  1、skyBox
    // addSkyBoxIntoScene()

    //  2、全景图片
    // addSpherGeometryIntoScene()

    initContent()
    loop()

    window.addEventListener("resize", onResize, false)
    window.addEventListener("click", onMouseClick, false)
    rendererRef.current?.domElement.addEventListener(
      "mousemove",
      onMousemove,
      false
    );
    tooltipBoxRef.current?.addEventListener(
      "mouseleave",
      handleTooltipHide,
      false
    );
  }, [])

  useEffect(() => {
    init()
  }, [])

  return (
    <div className={styles.pageWrapper}>
      <div
        ref={contentRef}
        id={'container'}
      />
      <div
        className={styles.tooltipBox}
        style={tooltipPosition}
        ref={tooltipBoxRef}
      >
        <div className={styles.container}>
          <div className={styles.title}>
            标题：{tooltopContent?.title}
          </div>
          <div className={styles.explain}>
            说明：{tooltopContent?.text}
          </div>
        </div>
      </div>
      <p
        className={styles['title-text']}
        ref={titleBoxRef}
        style={titlePosition}
        >
        {tooltopContent?.title}
      </p>
      <div className={styles.menuWrapper}>
        <p>x: {map.x}</p>
        <p>y: {map.y}</p>
        <p>z: {map.z}</p>
        <button
          onClick={() => changeAutoRotateStatus(!isAutoRotate)}
        >
          转动/停止
        </button>
      </div>
    </div>
  )
}
