"use client";

import {
  Bloom,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={0.28}
        luminanceThreshold={0.78}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.45}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
