import {useEffect, useRef, useState, useCallback} from 'react'
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
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
} from 'three'

const defaultMap = {
  x: 510,
  y: 128,
  z: 0,
}
export default function IndexPage() {
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
    directionalLightRef.current = new DirectionalLight(0xffffff, 0.5)
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
    }
  }, [])

  const init = useCallback(async () => {
    // 将 gltf 模型放在静态资源文件夹public下才能被访问到
    const gltf = await loadFile('models/low_poly_car/scene.gltf')
    addScene()
    addCamera()
    addLight()
    console.log({gltf}, 'xxx')
    sceneRef.current?.add(gltf.scene)

    loop()
  }, [])

  useEffect(() => {
    init()

    
  }, [])

  return (
    <div
      ref={contentRef}
      id={'container'}
    >
      
    </div>
  );
}
