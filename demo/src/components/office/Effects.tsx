"use client";

import {
  Bloom,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/**
 * Bloom + vignette for the three rooms.
 *
 * These values look deliberately chosen, so the knobs below are pinned and
 * commented rather than "optimised" further. Measured against
 * postprocessing 6.39 / @react-three/postprocessing 3.2, this composer is
 * already close to its floor:
 *
 * - `multisampling={0}` — the wrapper defaults to 4, which means an MSAA
 *   resolve on every frame. 0 is correct here because the canvas is already
 *   created with `antialias: false`.
 * - `enableNormalPass={false}` — nothing in this chain reads depth or normals.
 * - `stencilBuffer` is left unset on purpose: postprocessing already defaults
 *   it to false, so passing it would only be noise.
 * - `depthBuffer` is left at its default `true`; without it the scene has no
 *   depth attachment and depth testing breaks.
 * - `frameBufferType` is left at HalfFloatType. Dropping to UnsignedByteType
 *   would halve buffer bandwidth but clamps the pre-tonemap linear values to
 *   1.0, which visibly flattens bloom on lit and emissive surfaces.
 * - `resolutionScale` is deliberately NOT set: on EffectComposer it only feeds
 *   the DepthDownsamplingPass (i.e. it is a no-op while enableNormalPass is
 *   false), and on Bloom it is ignored whenever `mipmapBlur` is on, because
 *   BloomEffect sizes its blur pass at full width/height.
 * - Bloom `levels` is left at the default 8. Its mip 0 is half the canvas and
 *   each level halves again, so the chain costs roughly 0.6 of a full-screen
 *   pass. Dropping levels only removes the 1/32-and-smaller mips (<1% of that
 *   cost) while visibly tightening the glow, so it is not worth the trade.
 *
 * For a real saving, raise the DPR cap in WorldScene instead — that scales
 * the scene pass, the mip chain and the final effect pass at once.
 */
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
