import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function ParticleField() {
  const ref = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const count  = 3000
    const pos    = new Float32Array(count * 3)
    const col    = new Float32Array(count * 3)

    // palette: indigo / violet / sky
    const palette = [
      [0.49, 0.36, 0.98],  // #7c5cfa − violet
      [0.38, 0.40, 0.94],  // #6166f0 − indigo
      [0.22, 0.74, 0.98],  // #37bcfa − sky
      [0.93, 0.28, 0.60],  // #ec4899 − pink
      [0.20, 0.83, 0.60],  // #34d399 − emerald
    ]

    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 6
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10

      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3]     = c[0]
      col[i * 3 + 1] = c[1]
      col[i * 3 + 2] = c[2]
    }

    return { positions: pos, colors: col }
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.getElapsedTime()
    ref.current.rotation.y = t * 0.010
    ref.current.rotation.x = Math.sin(t * 0.05) * 0.06
  })

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        vertexColors
        transparent
        size={0.012}
        sizeAttenuation
        depthWrite={false}
        opacity={0.75}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

export function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden" style={{ background: '#040408' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: 'low-power' }}
      >
        <color attach="background" args={['#040408']} />
        <ParticleField />
      </Canvas>
    </div>
  )
}
