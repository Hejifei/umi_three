import {useEffect, useRef, useState, useCallback} from 'react'
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
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
  MeshNormalMaterial,
  Mesh,
  Color,
} from 'three'

const defaultMap = {
  x: 50,
  y: 228,
  z: 1022,
}
const colorAry = [
  "rgb(216, 27, 67)", "rgb(142, 36, 170)", "rgb(81, 45, 168)", "rgb(48, 63, 159)", "rgb(30, 136, 229)", "rgb(0, 137, 123)",
  "rgb(67, 160, 71)", "rgb(251, 192, 45)", "rgb(245, 124, 0)", "rgb(230, 74, 25)", "rgb(233, 30, 78)", "rgb(156, 39, 176)",
  "rgb(0, 0, 0)"] 

// const defaultMap = {
//   x: 0,
//   y: 228,
//   z: 352,
// }
export default function IndexPage() {
  const [isAutoRotate, setIsAutoRotate] = useState(false)
  const [map, setMap] = useState({...defaultMap})
  const mapRef = useRef({...defaultMap})
  const contentRef = useRef(null)
  const sceneRef = useRef<Scene>()
  const cameraRef = useRef<PerspectiveCamera>()
  const rendererRef = useRef<WebGLRenderer>()
  const directionalLightRef = useRef<DirectionalLight>()
  const dhelperRef = useRef<DirectionalLightHelper>()
  const hemisphereLightRef = useRef<HemisphereLight>()
  const hHelperRef = useRef<HemisphereLightHelper>()
  const loadingProcessRef = useRef<number>(0)
  const isLoadingRef = useRef(true)
  const loaderRef = useRef(new GLTFLoader())
  const controlsRef = useRef<OrbitControls>()

  const loadFile = useCallback((url: string): Promise<GLTF> => {
    loaderRef.current = new GLTFLoader() //引入模型的loader实例
    return new Promise(((resolve, reject) => {
      loaderRef.current.load(url,
        (gltf) => {
          console.log({gltf})
          resolve(gltf)
        }, ({loaded, total}) => {
          console.log({
            loaded,
            total,
          })
          let load = Math.abs(loaded / total * 100)
          loadingProcessRef.current = load
          if (load >= 100) {
            setTimeout(() => {
              isLoadingRef.current = false
            }, 1000)
          }
          console.log((loaded / total * 100) + '% loaded')
        },
        (err) => { 
          reject(err)
        }
      )
    }))
  }, [])

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
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current?.domElement)
    controlsRef.current.maxPolarAngle = 0.9 * Math.PI / 2
    controlsRef.current.enableZoom = true
    
    controlsRef.current.addEventListener('change', controlRender)
  }, [])

  //  自动转动
  const changeAutoRotateStatus = (isAuto: boolean = true) => {
    console.log({
      isAuto,
    })
    if (!controlsRef.current) {
      return
    }
    controlsRef.current.autoRotate = isAuto
    setIsAutoRotate(isAuto)
  }

  const setCarColor = useCallback((index: number) => {
    const currentColor = new Color(colorAry[index])
    sceneRef.current?.traverse(child => {
      if (child.isMesh) {
        console.log(child.name, {child})
        if (child.name.includes('CarBody_Carcamero')) {
        // if (child.name.includes('body_color')) {
          child.material.color.set(currentColor)
        }
      }
    })
  }, [])

  const init = useCallback(async () => {
    // 将 gltf 模型放在静态资源文件夹public下才能被访问到
    const gltf = await loadFile('models/low_poly_car/scene.gltf')
    // const gltf = await loadFile('models/concept_car_038__-_public_domain/scene.gltf')
    addScene()
    addCamera()
    addLight()
    setControls()
    console.log({gltf}, 'xxx')
    sceneRef.current?.add(gltf.scene)

    loop()
  }, [])

  useEffect(() => {
    init()
  }, [])

  return (
    <div>
      <div
        ref={contentRef}
        id={'container'}
      >
        
      </div>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        color: '#fff',
        // backgroundColor: '#fff',
      }}>
        <p>x: {map.x}</p>
        <p>y: {map.y}</p>
        <p>z: {map.z}</p>
        <button
          onClick={() => changeAutoRotateStatus(!isAutoRotate)}
        >
          转动/停止
        </button>
        <div style={{
          display: 'flex',
          height: '20px',
          border: '1px solid #fff'
        }}>
          {
            colorAry.map((item, index) => <div
              key={item}
              onClick={() => setCarColor(index)}
              style={{
                backgroundColor: item,
                flex: 1,
              }}
              >
            </div>)
          }
        </div>
    </div>
    </div>
  )
}
