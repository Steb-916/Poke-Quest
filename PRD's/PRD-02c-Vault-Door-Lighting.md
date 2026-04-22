# PRD-02c: Vault Door — Lighting & Material Fix

**Version:** 1.0  
**Date:** April 13, 2026  
**Status:** Ready for Implementation  
**PRD Sequence:** 02c (Patch — visual quality pass)  
**Depends on:** PRD-02a vault door already rendering

---

## Problem

The vault door scene is too dark. The geometry and animation are correct but the door is nearly invisible against the black background. The concentric rings, handle, and metallic surface are all lost in darkness. The gold accent is barely perceptible.

---

## Fix 1: Three-Point Lighting

Replace whatever lighting currently exists with a proper three-point setup:

**Key Light** — strong directional light from upper-left:
```tsx
<directionalLight
  position={[-3, 4, 5]}
  intensity={2.5}
  color="#ffffff"
  castShadow={false}
/>
```

**Fill Light** — softer, from the opposite side to prevent pure black shadows:
```tsx
<directionalLight
  position={[3, 1, 3]}
  intensity={0.8}
  color="#8888cc"   // Slight cool blue tint for contrast against warm key
/>
```

**Rim Light** — behind and above the door to create an edge outline:
```tsx
<pointLight
  position={[0, 2, -3]}
  intensity={1.5}
  color="#ffffff"
  distance={10}
/>
```

**Ambient** — very low baseline so nothing is ever 100% black:
```tsx
<ambientLight intensity={0.15} />
```

---

## Fix 2: Environment Map

Add an environment map from drei so metallic surfaces have something to reflect. Without this, `metalness` in Three.js produces flat dark surfaces regardless of lighting.

```tsx
import { Environment } from '@react-three/drei';

// Inside the Canvas/scene:
<Environment preset="studio" environmentIntensity={0.4} />
```

The `"studio"` preset gives clean, neutral reflections that look like a professional photo studio. `"city"` is an alternative if studio feels too uniform. Keep intensity low (0.3–0.5) so reflections enhance the metal without overpowering the scene mood.

---

## Fix 3: Door Material

Update the vault door's material to be more reflective and visually readable:

```tsx
<meshStandardMaterial
  color="#3a3a44"          // Slightly lighter base (was likely too dark)
  metalness={0.95}         // Near-full metal
  roughness={0.18}         // Low roughness = sharper reflections
  envMapIntensity={0.6}    // How much environment map shows in reflections
/>
```

For the **door frame** (the outer ring), use a slightly different tone to create separation:
```tsx
<meshStandardMaterial
  color="#2e2e38"
  metalness={0.9}
  roughness={0.25}         // Slightly rougher than the door face
/>
```

---

## Fix 4: Gold Handle — Emissive Glow

The handle/wheel is the narrative focal point. It should glow independently and be the first thing your eye lands on.

```tsx
<meshStandardMaterial
  color="#b8960c"            // Rich gold
  metalness={1.0}
  roughness={0.15}
  emissive="#8a7a10"         // Self-illumination — glows without external light
  emissiveIntensity={0.6}    // Strong enough to see, not blinding
/>
```

Additionally, add a small point light attached to the handle's position so it casts a warm pool of light on the surrounding door surface:

```tsx
<pointLight
  position={[0, 0, 0.3]}   // Slightly in front of handle center
  intensity={0.8}
  color="#c9a84c"            // Warm gold
  distance={3}               // Tight falloff — only illuminates nearby area
/>
```

---

## Fix 5: Bloom Post-Processing

If `EffectComposer` and `Bloom` from `@react-three/postprocessing` are already in the scene, adjust the bloom settings to pick up the gold handle glow:

```tsx
<EffectComposer>
  <Bloom
    luminanceThreshold={0.6}   // Only bloom bright areas (the gold handle)
    luminanceSmoothing={0.4}
    intensity={0.8}
    mipmapBlur
  />
</EffectComposer>
```

If bloom is not yet added to the scene, add it. The gold handle's emissive value is designed to exceed the `luminanceThreshold` and trigger bloom, creating a natural glow halo.

---

## Fix 6: Background Gradient

The scene background should not be pure black. Set a very dark radial gradient so the door frame has contrast to read against:

```tsx
// Option A: Set scene background to a dark color (not black)
<color attach="background" args={['#08080f']} />

// Option B: A background plane with a radial gradient shader
// (only if Option A doesn't provide enough contrast)
```

Option A is simpler and usually sufficient. The `#08080f` is almost black but has enough blue-shift that the metallic door edges become visible against it.

---

## Fix 7: Locking Bolt Visibility

The locking bolts (small cylinders on the door edge) should be a lighter metallic tone so they read as distinct elements:

```tsx
<meshStandardMaterial
  color="#555560"            // Lighter than the door
  metalness={0.85}
  roughness={0.3}
/>
```

---

## Summary of Changes

All changes are in `src/components/three/VaultDoorModel.tsx` and `src/components/three/VaultDoor.tsx`. No other files affected.

| Area | Change |
|------|--------|
| Lighting | Add key, fill, rim, ambient (4 lights total) |
| Environment | Add `<Environment preset="studio">` from drei |
| Door material | metalness 0.95, roughness 0.18, lighter base color |
| Handle material | Add emissive glow + attached point light |
| Bloom | Tune threshold to catch handle glow |
| Background | Change from #000000 to #08080f |
| Bolts | Lighter material for visibility |

---

## Verification

```
□ Vault door is clearly visible — metallic surface catches light in broad sweeps
□ Gold handle is the brightest element, draws the eye immediately
□ Handle has a soft glow halo (bloom effect)
□ Concentric rings / frame details are distinguishable
□ Locking bolts are visible as separate elements
□ Door reads clearly against the dark (not black) background
□ Animation sequence still works correctly (spin, retract, swing)
□ Skip button still visible in bottom-right
□ Scene is dramatic and moody, not flat or washed out
```
