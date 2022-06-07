import {useEffect, useRef, useState, useCallback} from 'react'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {Scene,WebGLRenderer,PerspectiveCamera} from 'three'

const defaultMap = {
  x: 510,
  y: 128,
  z: 0,
}
export default function IndexPage() {
  const contentRef = useRef(null)

  useEffect(() => {
    //  相机
    const camera = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000,
    );
    const {x, y , z} = defaultMap
    camera.position.set(x, y, z)

    //  场景
    const scene = new Scene()

    const renderer = new WebGLRenderer({
      antialias: true,
    })
    renderer.setSize(
      window.innerWidth,
      window.innerHeight,
    )
    if (contentRef.current) {
      const container = contentRef.current as unknown as HTMLElement
      container.appendChild( renderer.domElement );
    }
  }, [])

  return (
    <div
      ref={contentRef}
      id={'container'}
    >
      
    </div>
  );
}
