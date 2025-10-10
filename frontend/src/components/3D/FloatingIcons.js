'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Text3D, Center } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 3D Icon Components
const WeddingIcon = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position} ref={meshRef}>
        {/* Wedding ring */}
        <mesh>
          <torusGeometry args={[0.3, 0.1, 8, 100]} />
          <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Heart */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.15, 8, 6]} />
          <meshStandardMaterial color="#FF69B4" />
        </mesh>
      </group>
    </Float>
  );
};

const CameraIcon = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
      <group position={position} ref={meshRef}>
        {/* Camera body */}
        <mesh>
          <boxGeometry args={[0.4, 0.3, 0.2]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        {/* Lens */}
        <mesh position={[0, 0, 0.15]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#34495E" />
        </mesh>
        {/* Flash */}
        <mesh position={[0.1, 0.1, 0.1]}>
          <boxGeometry args={[0.1, 0.05, 0.05]} />
          <meshStandardMaterial color="#F39C12" />
        </mesh>
      </group>
    </Float>
  );
};

const CakeIcon = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.3}>
      <group position={position} ref={meshRef}>
        {/* Cake base */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 8]} />
          <meshStandardMaterial color="#E8B4B8" />
        </mesh>
        {/* Cake top */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 8]} />
          <meshStandardMaterial color="#F5B7B1" />
        </mesh>
        {/* Candle */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshStandardMaterial color="#F7DC6F" />
        </mesh>
      </group>
    </Float>
  );
};

const CarIcon = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.2}>
      <group position={position} ref={meshRef}>
        {/* Car body */}
        <mesh>
          <boxGeometry args={[0.6, 0.2, 0.3]} />
          <meshStandardMaterial color="#E74C3C" />
        </mesh>
        {/* Wheels */}
        <mesh position={[-0.2, -0.1, 0.2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        <mesh position={[0.2, -0.1, 0.2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        <mesh position={[-0.2, -0.1, -0.2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
        <mesh position={[0.2, -0.1, -0.2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 8]} />
          <meshStandardMaterial color="#2C3E50" />
        </mesh>
      </group>
    </Float>
  );
};

const UtensilsIcon = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.1;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
    }
  });

  return (
    <Float speed={2.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <group position={position} ref={meshRef}>
        {/* Fork */}
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial color="#C0C0C0" />
        </mesh>
        {/* Knife */}
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial color="#C0C0C0" />
        </mesh>
        {/* Plate */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 8]} />
          <meshStandardMaterial color="#F8F9FA" />
        </mesh>
      </group>
    </Float>
  );
};

const BuildingIcon = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.1}>
      <group position={position} ref={meshRef}>
        {/* Building base */}
        <mesh>
          <boxGeometry args={[0.4, 0.6, 0.3]} />
          <meshStandardMaterial color="#95A5A6" />
        </mesh>
        {/* Windows */}
        <mesh position={[-0.1, 0.1, 0.16]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#3498DB" />
        </mesh>
        <mesh position={[0.1, 0.1, 0.16]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial color="#3498DB" />
        </mesh>
      </group>
    </Float>
  );
};

const FloatingIcons = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        
        {/* Floating Icons */}
        <WeddingIcon position={[-2, 1, -1]} />
        <CameraIcon position={[2, 0.5, -2]} />
        <CakeIcon position={[0, 1.5, -1]} />
        <CarIcon position={[-1.5, -0.5, -3]} />
        <UtensilsIcon position={[1.5, -1, -2]} />
        <BuildingIcon position={[0, -1.5, -4]} />
        
        {/* Background particles */}
        {Array.from({ length: 50 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20
            ]}
          >
            <sphereGeometry args={[0.02, 4, 4]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.3} 
            />
          </mesh>
        ))}
      </Canvas>
    </div>
  );
};

export default FloatingIcons;
