"use client";

import { useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import {
  createAdminBoardTexture,
  createNameplateTexture,
  createVetcBadgeTexture,
  TASCO_3D,
} from "./brand-textures";

export type OfficeStation = "cs" | "claims" | "admin" | "vetc";

const STATION_META: Record<
  OfficeStation,
  { label: string; prompt: string; position: [number, number, number] }
> = {
  cs: {
    label: "Tasco CS",
    prompt: "Nói chuyện với CS",
    position: [2.4, 0, -1.2],
  },
  claims: {
    label: "Bồi thường",
    prompt: "Khai báo bồi thường",
    position: [-2.6, 0, -1.4],
  },
  admin: {
    label: "Hồ sơ",
    prompt: "Theo dõi hồ sơ",
    position: [-5.2, 0, -4.2],
  },
  vetc: {
    label: "VETC",
    prompt: "Gia hạn qua VETC",
    position: [5.0, 0, 1.4],
  },
};

function Desk({
  id,
  accent,
  onSelect,
  hovered,
  setHovered,
}: {
  id: OfficeStation;
  accent: string;
  onSelect: (id: OfficeStation) => void;
  hovered: OfficeStation | null;
  setHovered: (id: OfficeStation | null) => void;
}) {
  const plate = useMemo(
    () => createNameplateTexture(STATION_META[id].label, accent),
    [id, accent],
  );
  const active = hovered === id;
  const pos = STATION_META[id].position;

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = "pointer";
  };
  const onPointerOut = () => {
    setHovered(null);
    document.body.style.cursor = "auto";
  };

  return (
    <group position={pos}>
      <mesh
        castShadow
        position={[0, 0.55, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <boxGeometry args={[2.1, 1.1, 1.05]} />
        <meshStandardMaterial
          color={active ? "#ffffff" : "#eef3f9"}
          emissive={accent}
          emissiveIntensity={active ? 0.35 : 0.08}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[2.25, 0.1, 1.15]} />
        <meshStandardMaterial color={accent} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.45, 0.02]}>
        <planeGeometry args={[1.5, 0.38]} />
        <meshStandardMaterial map={plate} roughness={0.5} />
      </mesh>
      {/* Chair */}
      <mesh position={[0, 0.45, 0.95]} castShadow>
        <boxGeometry args={[0.7, 0.9, 0.7]} />
        <meshStandardMaterial color={TASCO_3D.navy} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Stations({
  onSelect,
}: {
  onSelect: (id: OfficeStation) => void;
}) {
  const [hovered, setHovered] = useState<OfficeStation | null>(null);
  const boardTex = useMemo(() => createAdminBoardTexture(), []);
  const vetcTex = useMemo(() => createVetcBadgeTexture(), []);

  return (
    <group>
      <Desk
        id="cs"
        accent={TASCO_3D.sky}
        onSelect={onSelect}
        hovered={hovered}
        setHovered={setHovered}
      />
      <Desk
        id="claims"
        accent="#e8a838"
        onSelect={onSelect}
        hovered={hovered}
        setHovered={setHovered}
      />

      {/* Admin board on wall */}
      <group position={STATION_META.admin.position}>
        <mesh
          position={[0, 2.1, 0.9]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect("admin");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered("admin");
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(null);
            document.body.style.cursor = "auto";
          }}
        >
          <planeGeometry args={[2.8, 1.9]} />
          <meshStandardMaterial
            map={boardTex}
            emissive={TASCO_3D.sky}
            emissiveIntensity={hovered === "admin" ? 0.2 : 0.05}
          />
        </mesh>
        <mesh position={[0, 0.9, 0.7]}>
          <boxGeometry args={[0.15, 1.8, 0.15]} />
          <meshStandardMaterial color="#8a7355" />
        </mesh>
      </group>

      {/* VETC kiosk */}
      <group position={STATION_META.vetc.position}>
        <mesh
          castShadow
          position={[0, 1.1, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect("vetc");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered("vetc");
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(null);
            document.body.style.cursor = "auto";
          }}
        >
          <boxGeometry args={[1.1, 2.2, 0.7]} />
          <meshStandardMaterial
            color="#0f3d28"
            emissive={TASCO_3D.vetc}
            emissiveIntensity={hovered === "vetc" ? 0.35 : 0.12}
          />
        </mesh>
        <mesh position={[0, 1.55, 0.36]}>
          <planeGeometry args={[0.75, 0.75]} />
          <meshStandardMaterial map={vetcTex} />
        </mesh>
      </group>
    </group>
  );
}

export { STATION_META };
