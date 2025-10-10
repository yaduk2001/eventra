'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Floating particle component
const Particle = ({ position, color, size }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 8, 6]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.6}
        emissive={color}
        emissiveIntensity={0.1}
      />
    </mesh>
  );
};

// Floating geometric shapes
const GeometricShape = ({ position, shape, color, size }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case 'box':
        return <boxGeometry args={[size, size, size]} />;
      case 'octahedron':
        return <octahedronGeometry args={[size]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[size]} />;
      default:
        return <sphereGeometry args={[size, 8, 6]} />;
    }
  }, [shape, size]);

  return (
    <mesh ref={meshRef} position={position}>
      {geometry}
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.4}
        wireframe={false}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
};

const FloatingParticles = () => {
  // Generate random particles
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 20
      ],
      color: ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'][Math.floor(Math.random() * 4)],
      size: Math.random() * 0.1 + 0.05
    }));
  }, []);

  // Generate geometric shapes
  const shapes = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 15
      ],
      shape: ['box', 'octahedron', 'tetrahedron', 'sphere'][Math.floor(Math.random() * 4)],
      color: ['#6366F1', '#8B5CF6', '#EC4899'][Math.floor(Math.random() * 3)],
      size: Math.random() * 0.3 + 0.2
    }));
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [0, 0, 8], fov: 75 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />
        <pointLight position={[-10, -10, -5]} intensity={0.3} color="#6366F1" />
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <Particle
            key={particle.id}
            position={particle.position}
            color={particle.color}
            size={particle.size}
          />
        ))}
        
        {/* Geometric shapes */}
        {shapes.map((shape) => (
          <GeometricShape
            key={shape.id}
            position={shape.position}
            shape={shape.shape}
            color={shape.color}
            size={shape.size}
          />
        ))}
      </Canvas>
    </div>
  );
};

export default FloatingParticles;
