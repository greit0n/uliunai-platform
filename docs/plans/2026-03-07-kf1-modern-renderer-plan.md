# KF1 Modern Renderer — DX12, Ray Tracing, DLSS 4

## Goal

Replace Killing Floor 1's DirectX 9 renderer with a modern DirectX 12 renderer that supports ray tracing (DXR) and NVIDIA DLSS 4, delivered as a drop-in DLL replacement.

## Background

### Engine Architecture

KF1 runs on **Unreal Engine 2.5** (Tripwire's modified build). UE2 has a pluggable renderer architecture:

- The engine defines a `URenderDevice` abstract interface
- The renderer is a separate DLL (e.g., `D3DDrv.dll`, `D3D9Drv.dll`, `OpenGLDrv.dll`)
- The active renderer is specified in `KillingFloor.ini`:
  ```ini
  [Engine.Engine]
  RenderDevice=D3D9Drv.D3D9RenderDevice
  ```
- Swapping renderers = drop new DLL in `System/`, change this one line

### URenderDevice Interface (UE2)

The renderer DLL exports a `URenderDevice` subclass. Key methods:

```cpp
class URenderDevice : public USubsystem {
    // Lifecycle
    virtual UBOOL Init(UViewport* InViewport, INT NewX, INT NewY, INT NewColorBytes, UBOOL Fullscreen);
    virtual void Exit();
    virtual UBOOL SetRes(INT NewX, INT NewY, INT NewColorBytes, UBOOL Fullscreen);

    // Frame
    virtual void Lock(FPlane FlashScale, FPlane FlashFog, FPlane ScreenClear, DWORD RenderLockFlags, BYTE* HitData, INT* HitSize);
    virtual void Unlock(UBOOL Blit);

    // Drawing
    virtual void DrawComplexSurface(FSceneNode* Frame, FSurfaceInfo& Surface, FSurfaceFacet& Facet);  // BSP surfaces
    virtual void DrawGouraudPolygon(FSceneNode* Frame, FTextureInfo& Info, FTransTexture** Pts, INT NumPts, DWORD PolyFlags, FSpanBuffer* Span);  // Meshes
    virtual void DrawTile(FSceneNode* Frame, FTextureInfo& Info, FLOAT X, FLOAT Y, FLOAT XL, FLOAT YL, FLOAT U, FLOAT V, FLOAT UL, FLOAT VL, class FSpanBuffer* Span, FLOAT Z, FPlane Color, FPlane Fog, DWORD PolyFlags);  // 2D/HUD

    // Texture management
    virtual void SetTextureFormat(ETextureFormat Format);
    virtual void PrecacheTexture(FTextureInfo& Info, DWORD PolyFlags);

    // Viewport
    virtual void SetViewport(INT X, INT Y, INT Width, INT Height);
    virtual void ReadPixels(FColor* Pixels);
    // ... additional methods
};
```

### Existing Reference Implementations

These open-source projects implement custom URenderDevice for UE1/UE2 games:

1. **UTGLR (Chris Dohnal)** — OpenGL and D3D9 renderers for Unreal/UT99
   - Source: https://github.com/nicehash/utglr (and various forks)
   - Fully documents the URenderDevice interface for UE1

2. **D3D11Drv for UT2004** — Community DX11 renderer
   - Closest reference since UT2004 shares UE2 with KF1
   - Search for "UT2004 D3D11 renderer" or "Unreal Engine 2 D3D11"

3. **Kentie's D3D10 renderer for Deus Ex** — DX10 renderer for UE1
   - Source: https://github.com/Jenevive/kentie-d3d10drv (and forks)
   - Demonstrates the DLL replacement approach end-to-end

4. **Rune D3D11Drv** — Another UE1 DX11 implementation
   - Useful for understanding the URenderDevice vtable

---

## Phase 0: Research & Reverse Engineering

### 0.1 — Map KF1's URenderDevice Interface

KF1 is a **modified** UE2.5. Tripwire may have added or changed methods compared to stock UT2004.

**Tasks:**
- Disassemble KF1's `D3DDrv.dll` (or `D3D9Drv.dll`) using IDA Pro, Ghidra, or Binary Ninja
- Map out the vtable of KF1's `URenderDevice` implementation
- Compare against known UT2004 URenderDevice interface to identify Tripwire-specific additions
- Document every virtual method: signature, calling convention, purpose
- Identify how the engine passes scene data (FSceneNode, FSurfaceInfo, FTextureInfo structs)

**Deliverable:** Complete header file (`URenderDevice.h`) matching KF1's exact interface.

### 0.2 — Understand KF1's Rendering Pipeline

- Trace a full frame from Lock() to Unlock() — log every draw call
- Catalog all texture formats KF1 uses (DXT1, DXT3, DXT5, RGBA8, P8, etc.)
- Understand how fog, lighting, and translucency flags are passed
- Map all `PolyFlags` values and their visual meaning (PF_Translucent, PF_Modulated, PF_Masked, etc.)
- Document the coordinate system and projection matrix conventions

**Deliverable:** Frame capture documentation showing exactly what data flows through URenderDevice per frame.

### 0.3 — Build Environment Setup

- Set up a C++ project (Visual Studio / CMake)
- Configure DX12 SDK (Windows SDK includes it)
- Create the DLL skeleton that exports the `URenderDevice` subclass
- Verify KF1 loads the DLL (even if it just shows a blank screen)
- Set up a test environment: KF1 installation, debug tools, PIX/RenderDoc for DX12 debugging

**Deliverable:** Empty renderer DLL that KF1 successfully loads.

---

## Phase 1: Basic DX12 Renderer

Goal: Get KF1 rendering correctly with DX12. No new features — pixel-perfect parity with the DX9 renderer.

### 1.1 — DX12 Device Initialization

```
Init() / SetRes():
├── Create DXGI Factory & Adapter (enumerate GPUs)
├── Create ID3D12Device
├── Create Command Queue, Command Allocator, Command List
├── Create Swap Chain (DXGI_SWAP_CHAIN_DESC1)
├── Create RTV/DSV Descriptor Heaps
├── Create Render Target Views for back buffers
├── Create Depth/Stencil buffer
└── Create Root Signature(s) and Pipeline State Objects
```

**Key decisions:**
- Use `IDXGISwapChain4` for flip-model presentation (required for DLSS frame generation later)
- Double or triple buffering with proper fence synchronization
- Create a resource upload heap for dynamic per-frame data

### 1.2 — Texture Management

- Implement `PrecacheTexture()` — upload UE2 textures to GPU as `ID3D12Resource`
- Handle all UE2 texture formats: convert P8 (palettized), DXT1/3/5 (pass through as BC1/2/3), RGBA8
- Implement texture caching with LRU eviction (UE2 can have many textures)
- Create SRV descriptor heap for bindless texture access
- Handle dynamic textures (lightmaps, procedural textures) with ring buffer uploads

### 1.3 — Geometry Pipeline

- `DrawComplexSurface()` — BSP world geometry
  - Convert FSurfaceFacet (triangle fan) to indexed triangle list
  - Apply diffuse texture + lightmap as multi-texture
  - Handle surface flags (masked, translucent, modulated, etc.)

- `DrawGouraudPolygon()` — Skeletal meshes, weapons, pickups
  - Convert FTransTexture vertices (position, UV, color, fog) to vertex buffer
  - Dynamic vertex buffer with per-frame ring buffer
  - Handle vertex colors and fog per-vertex

- `DrawTile()` — HUD, menus, 2D elements
  - Simple textured quad rendering
  - Correct Z-ordering for 2D overlay

### 1.4 — Render State Management

- Translate UE2 `PolyFlags` to DX12 Pipeline State Objects:
  - `PF_Translucent` → alpha blending (src * one + dst * one)
  - `PF_Modulated` → modulate blending (src * dst)
  - `PF_Masked` → alpha test (discard if alpha < 0.5)
  - `PF_Invisible`, `PF_TwoSided`, `PF_NoSmooth`, etc.
- Pre-create PSOs for common flag combinations (avoid runtime PSO creation)
- Implement depth testing and stencil operations

### 1.5 — Shaders (HLSL)

Basic shaders for parity rendering:

```hlsl
// Vertex Shader — transforms UE2 vertices
struct VSInput {
    float3 Position : POSITION;
    float2 TexCoord0 : TEXCOORD0;  // Diffuse UV
    float2 TexCoord1 : TEXCOORD1;  // Lightmap UV
    float4 Color : COLOR0;         // Vertex color
    float4 Fog : COLOR1;           // Fog color
};

// Pixel Shader — multi-texture with fog
float4 PSMain(VSOutput input) : SV_TARGET {
    float4 diffuse = DiffuseTexture.Sample(Sampler, input.TexCoord0);
    float4 lightmap = LightmapTexture.Sample(Sampler, input.TexCoord1);
    float4 color = diffuse * lightmap * input.Color;
    color.rgb = lerp(color.rgb, input.Fog.rgb, input.Fog.a);  // Distance fog
    return color;
}
```

### 1.6 — Frame Synchronization

- Implement proper CPU-GPU synchronization with fences
- Handle window resize, fullscreen toggle, alt-tab
- Implement `ReadPixels()` for screenshots
- VSync control

**Milestone:** KF1 runs and looks identical to the DX9 renderer. All maps, all meshes, all HUD elements render correctly.

---

## Phase 2: Modern Rendering Enhancements

Goal: Improve visual quality beyond what UE2's DX9 renderer offered, using the same source assets.

### 2.1 — Improved Anti-Aliasing

- **MSAA** (Multi-Sample AA): Native DX12 MSAA, 2x/4x/8x options
- **FXAA/SMAA**: Post-process AA as a compute shader pass
- These are prerequisites for DLSS (which replaces them later)

### 2.2 — Anisotropic Filtering

- Force high-quality anisotropic filtering (16x) on all texture samplers
- UE2's DX9 renderer had limited AF support

### 2.3 — Enhanced Post-Processing Pipeline

Build a post-process stack (render to offscreen HDR buffer first, then post-process):

1. **HDR rendering** — Render to R16G16B16A16_FLOAT render target
2. **Tonemapping** — ACES or Uncharted 2 tonemapper
3. **Bloom** — Gaussian bloom on bright areas
4. **Ambient Occlusion** — SSAO or GTAO (screen-space)
5. **Color grading** — LUT-based color correction
6. **Sharpening** — CAS (Contrast Adaptive Sharpening)
7. **Film grain / vignette** — Optional cinematic effects

### 2.4 — Improved Lighting

- Convert UE2's baked lightmaps from LDR to pseudo-HDR (expand range)
- Add screen-space reflections (SSR) for shiny surfaces
- Dynamic shadow mapping for the dominant light source (optional, complex)

### 2.5 — Resolution Scaling Foundation

- Render 3D scene at a separate resolution from UI
- UI always renders at native resolution
- 3D scene resolution can be scaled (this is required for DLSS later)
- Implement jittered rendering (sub-pixel jitter for temporal techniques)
- Output **motion vectors** — required for DLSS and temporal AA
  - UE2 doesn't provide motion vectors natively
  - Compute from current vs. previous frame transforms
  - Store per-pixel velocity in a motion vector buffer (R16G16_FLOAT)
- Output **depth buffer** in a format DLSS can consume

**Milestone:** KF1 looks noticeably better than stock — cleaner image, better colors, modern post-processing.

---

## Phase 3: Ray Tracing (DXR)

Goal: Add hardware-accelerated ray tracing for select effects.

### 3.1 — Acceleration Structure Management

The biggest challenge: UE2 doesn't know about ray tracing. You must build acceleration structures from the draw calls.

```
Per Frame:
├── Capture all geometry from DrawComplexSurface / DrawGouraudPolygon
├── Build/update Bottom-Level Acceleration Structures (BLAS)
│   ├── Static world geometry (BSP) — build once, reuse
│   ├── Dynamic meshes (players, weapons, zeds) — rebuild per frame
│   └── Use BLAS compaction for memory efficiency
├── Build Top-Level Acceleration Structure (TLAS)
│   └── Instances referencing BLAS with per-instance transforms
└── Store geometry buffers for hit shader access
```

**Key challenge:** Identifying static vs. dynamic geometry from URenderDevice calls alone. Heuristics:
- `DrawComplexSurface` = world BSP = static (build BLAS once)
- `DrawGouraudPolygon` = meshes = potentially dynamic (check if transform changed)
- Cache BLAS by texture/vertex hash, only rebuild when changed

### 3.2 — RT Shadows (Start Here — Simplest RT Effect)

- Cast shadow rays from visible surfaces toward light sources
- UE2 doesn't expose light positions directly through URenderDevice
  - **Option A:** Extract light info from lightmaps (approximate dominant light direction)
  - **Option B:** Add a companion UnrealScript mutator that exports light actor positions to a file/shared memory
  - **Option C:** Use a fixed directional light + point lights at known positions (less accurate)
- Denoise shadow result with a spatial filter or NVIDIA's ray reconstruction (Phase 4)
- Blend RT shadows with UE2's baked lightmaps

**Ray Generation Shader:**
```hlsl
[shader("raygeneration")]
void ShadowRayGen() {
    // Get world position and normal from G-buffer
    float3 worldPos = ReconstructWorldPos(DispatchRaysIndex());
    float3 normal = LoadNormal(DispatchRaysIndex());

    // Trace shadow ray toward light
    RayDesc ray;
    ray.Origin = worldPos + normal * 0.01;  // Bias to avoid self-intersection
    ray.Direction = normalize(LightPosition - worldPos);
    ray.TMin = 0.001;
    ray.TMax = length(LightPosition - worldPos);

    ShadowPayload payload = { 1.0 };  // Assume lit
    TraceRay(SceneBVH, RAY_FLAG_ACCEPT_FIRST_HIT_AND_END_SEARCH,
             0xFF, 0, 0, 0, ray, payload);

    ShadowOutput[DispatchRaysIndex().xy] = payload.shadow;
}
```

### 3.3 — RT Reflections

- Trace reflection rays from surfaces with reflective properties
- Identify reflective surfaces by texture properties or PolyFlags
- Single bounce is sufficient for KF1's aesthetic
- Use roughness approximation (derive from texture analysis or flag surfaces manually)
- Fallback to SSR for non-reflective surfaces

### 3.4 — RT Ambient Occlusion

- Short-range rays in hemisphere around surface normal
- Replace or supplement SSAO from Phase 2
- Much higher quality than screen-space — no halos, handles off-screen occluders
- Low ray count (1-4 rays per pixel) + temporal accumulation + denoising

### 3.5 — RT Global Illumination (Advanced)

- Single-bounce diffuse GI
- Captures indirect light bouncing off colored surfaces (color bleeding)
- Use irradiance probes or per-pixel tracing with aggressive denoising
- Can use NVIDIA's ray reconstruction denoiser (integrates with DLSS pipeline)

**Milestone:** KF1 has hardware ray-traced shadows, reflections, and AO. Visual quality leap.

---

## Phase 4: NVIDIA DLSS 4 Integration

Goal: Integrate DLSS 4 for upscaling, frame generation, and ray reconstruction.

### 4.1 — NVIDIA Streamline SDK Integration

DLSS 4 is delivered through NVIDIA's **Streamline SDK**, which provides a unified interface.

```
Streamline SDK Components:
├── sl.dlss        — DLSS Super Resolution (upscaling)
├── sl.dlss_g      — DLSS Frame Generation / Multi Frame Generation
├── sl.reflex      — Reflex (latency reduction, required for frame gen)
├── sl.dlss_rr     — DLSS Ray Reconstruction (RT denoiser replacement)
└── sl.common      — Core framework
```

**Integration steps:**
1. Download Streamline SDK from NVIDIA
2. Link against `sl.interposer.dll` and `sl.common.dll`
3. Initialize Streamline before DX12 device creation
4. Tag engine resources (depth, motion vectors, exposure, etc.) with Streamline resource tags

### 4.2 — DLSS Super Resolution (Upscaling)

Renders the 3D scene at lower resolution and upscales to native.

**Requirements from Phase 2.5:**
- Jittered rendering (sub-pixel jitter per frame)
- Motion vectors buffer (R16G16_FLOAT)
- Depth buffer
- Exposure value

**Quality modes:**
| Mode | Render Scale | Example (4K output) |
|------|-------------|---------------------|
| Ultra Performance | 33% | 1280x720 → 3840x2160 |
| Performance | 50% | 1920x1080 → 3840x2160 |
| Balanced | 58% | 2227x1253 → 3840x2160 |
| Quality | 67% | 2560x1440 → 3840x2160 |
| DLAA | 100% | 3840x2160 → 3840x2160 (AA only) |

**Integration pseudocode:**
```cpp
// Per frame, after rendering 3D scene but before UI:
sl::DLSSOptions dlssOptions = {};
dlssOptions.mode = sl::DLSSMode::eBalanced;
dlssOptions.outputWidth = nativeWidth;
dlssOptions.outputHeight = nativeHeight;

sl::Resource colorInput = {renderTargetLowRes, ...};
sl::Resource depthInput = {depthBuffer, ...};
sl::Resource motionVectors = {mvBuffer, ...};
sl::Resource output = {renderTargetNative, ...};

slDLSSSetOptions(viewport, dlssOptions);
slEvaluateFeature(viewport, sl::kFeatureDLSS, frame, commandList);
// Result: output contains upscaled native-resolution image
// Then render UI on top at native resolution
```

### 4.3 — DLSS Frame Generation / Multi Frame Generation

Generates additional frames between rendered frames for higher FPS.

- **Frame Generation (FG):** RTX 40-series, generates 1 extra frame (2x FPS)
- **Multi Frame Generation (MFG):** RTX 50-series (Blackwell), generates up to 3 extra frames (4x FPS)

**Requirements:**
- DLSS Super Resolution must be active
- **Reflex** must be enabled (mandatory — reduces latency added by frame gen)
- Swap chain must use flip-model presentation (`DXGI_SWAP_EFFECT_FLIP_DISCARD`)
- HUD/UI should be rendered in a separate pass and tagged so DLSS can handle it correctly

**Integration:**
```cpp
// Initialize Reflex
sl::ReflexOptions reflexOptions = {};
reflexOptions.mode = sl::ReflexMode::eLowLatency;
slReflexSetOptions(reflexOptions);

// Per frame — mark simulation start/end, render start/end
slReflexSetMarker(sl::ReflexMarker::eSimulationStart, frame);
// ... game logic (UE2 handles this) ...
slReflexSetMarker(sl::ReflexMarker::eSimulationEnd, frame);
slReflexSetMarker(sl::ReflexMarker::eRenderSubmitStart, frame);
// ... rendering ...
slReflexSetMarker(sl::ReflexMarker::eRenderSubmitEnd, frame);

// Frame generation evaluates automatically during Present()
slEvaluateFeature(viewport, sl::kFeatureDLSS_G, frame, commandList);
```

**Important for KF1:** UE2's game logic runs at a fixed tick rate. Frame generation interpolates visual frames — the game simulation doesn't run faster. This is ideal since we can't change UE2's tick rate.

### 4.4 — DLSS Ray Reconstruction

Replaces traditional denoisers for ray-traced effects with an AI denoiser trained on RT data.

- Dramatically improves quality of noisy RT effects (shadows, reflections, GI)
- Allows using fewer rays per pixel (better performance) while maintaining quality
- Replaces the spatial/temporal denoisers you'd normally write

**Integration:**
```cpp
// Instead of custom denoiser after RT passes:
sl::DLSSRROptions rrOptions = {};
rrOptions.mode = sl::DLSSRRMode::eOn;

// Tag the noisy RT outputs (diffuse GI, specular, shadows)
// DLSS RR denoises them as part of the DLSS pipeline
slDLSSRRSetOptions(viewport, rrOptions);
```

### 4.5 — UI Handling with DLSS

Critical: UE2's `DrawTile()` calls render HUD/menu elements. These must NOT go through DLSS upscaling (they'd get blurry).

**Solution:**
1. Render 3D scene at internal resolution → DLSS upscales to native
2. Render UI (`DrawTile` calls) at native resolution on top
3. Tag UI layer for DLSS Frame Generation so it handles it correctly
4. This requires separating `DrawTile` calls from 3D draw calls in the rendering pipeline

---

## Phase 5: Configuration & Polish

### 5.1 — Settings System

Create an INI-based settings system (KF1 convention):

```ini
[D3D12Drv.D3D12RenderDevice]
; Resolution
FullscreenResX=3840
FullscreenResY=2160
Fullscreen=True

; Anti-Aliasing (when DLSS is off)
AntiAliasing=SMAA          ; None, FXAA, SMAA, MSAA2x, MSAA4x

; DLSS
DLSSEnabled=True
DLSSMode=Balanced           ; UltraPerformance, Performance, Balanced, Quality, DLAA
DLSSFrameGeneration=True
DLSSRayReconstruction=True

; Ray Tracing
RayTracedShadows=True
RayTracedReflections=True
RayTracedAO=True
RayTracedGI=False           ; Most expensive, off by default

; Post Processing
HDR=True
Bloom=True
SSAO=True                   ; Fallback when RT AO is off
Tonemapper=ACES
Sharpening=0.5
FilmGrain=0.0

; Performance
VSyncEnabled=False
MaxFPS=0                    ; 0 = unlimited
```

### 5.2 — In-Game Settings UI

- Hook into KF1's menu system or create an overlay (ImGui is ideal for debug/settings)
- Alternatively: settings are INI-only (simpler, KF1 players are used to INI editing)
- Real-time preview of setting changes

### 5.3 — Compatibility & Fallbacks

- Detect GPU capabilities at startup (DXR support, DLSS support)
- Graceful fallback: no RTX GPU → disable RT features, use SSAO/SSR
- No NVIDIA GPU → disable DLSS, use FSR 3 as alternative (AMD's open-source upscaler)
- Handle alt-tab, window resize, multi-monitor correctly
- Support Windows 10 (21H2+) and Windows 11

### 5.4 — Performance Profiling

- Built-in frame time graph (toggle with key)
- Per-phase GPU timing (scene rendering, RT, DLSS, post-process, UI)
- Log GPU memory usage
- Target: 60+ FPS at 4K with DLSS Balanced on RTX 3060+

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   KF1 Engine (UE2.5)            │
│                                                 │
│  Game Logic → Scene Graph → URenderDevice calls │
└────────────────────┬────────────────────────────┘
                     │ DrawComplexSurface()
                     │ DrawGouraudPolygon()
                     │ DrawTile()
                     ▼
┌─────────────────────────────────────────────────┐
│              D3D12Drv.dll (Our Renderer)        │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │         Geometry Capture Layer          │    │
│  │  Buffers all draw calls per frame       │    │
│  │  Separates 3D geometry from 2D UI       │    │
│  │  Builds vertex/index buffers            │    │
│  └──────────────┬──────────────────────────┘    │
│                 │                                │
│  ┌──────────────▼──────────────────────────┐    │
│  │        Rasterization Pass               │    │
│  │  Standard DX12 rasterization            │    │
│  │  Outputs: Color, Depth, Normals, MV     │    │
│  │  (at internal resolution for DLSS)      │    │
│  └──────────────┬──────────────────────────┘    │
│                 │                                │
│  ┌──────────────▼──────────────────────────┐    │
│  │        Ray Tracing Pass (DXR)           │    │
│  │  Build BLAS/TLAS from captured geometry  │    │
│  │  RT Shadows, Reflections, AO, GI        │    │
│  │  Output: noisy RT buffers               │    │
│  └──────────────┬──────────────────────────┘    │
│                 │                                │
│  ┌──────────────▼──────────────────────────┐    │
│  │      DLSS Pipeline (Streamline SDK)     │    │
│  │  Ray Reconstruction (denoise RT)        │    │
│  │  Super Resolution (upscale to native)   │    │
│  │  Reflex (latency markers)               │    │
│  └──────────────┬──────────────────────────┘    │
│                 │                                │
│  ┌──────────────▼──────────────────────────┐    │
│  │        Post-Processing Stack            │    │
│  │  Bloom, Tonemapping, Color Grading      │    │
│  │  Sharpening (CAS)                       │    │
│  └──────────────┬──────────────────────────┘    │
│                 │                                │
│  ┌──────────────▼──────────────────────────┐    │
│  │          UI Rendering Pass              │    │
│  │  DrawTile calls at native resolution    │    │
│  │  HUD, menus, text overlays              │    │
│  └──────────────┬──────────────────────────┘    │
│                 │                                │
│  ┌──────────────▼──────────────────────────┐    │
│  │    DLSS Frame Generation / MFG          │    │
│  │  Generate interpolated frames           │    │
│  │  Present via flip-model swap chain      │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Key Technical Challenges

### 1. Reverse Engineering KF1's URenderDevice

The exact vtable layout for KF1's modified UE2.5 is unknown. Tripwire may have:
- Added new virtual methods
- Changed method signatures
- Added new PolyFlags or texture formats

**Mitigation:** Start from UT2004's known interface, test incrementally, use a debugger to catch crashes from vtable mismatches.

### 2. Motion Vector Generation

DLSS requires per-pixel motion vectors. UE2 doesn't provide them.

**Approach:**
- Track per-object transforms between frames
- In the vertex shader, output current and previous screen positions
- Compute velocity in the pixel shader: `motionVector = currentPos - previousPos`
- For BSP (static world): motion vectors come only from camera movement
- For skeletal meshes: need to track previous frame's vertex positions (double-buffer vertex data)

### 3. Geometry for Ray Tracing

URenderDevice receives pre-transformed geometry (partially). For RT you need world-space geometry and transforms.

**Approach:**
- FSceneNode contains the frame's coordinate system — extract the view/projection matrices
- Reverse the viewport transform to recover world-space positions
- Cache world geometry (BSP) across frames — only rebuild BLAS when map changes
- Dynamic geometry (meshes) gets rebuilt every frame — keep BLAS count low

### 4. Light Source Information

URenderDevice doesn't receive explicit light positions — lighting is baked into lightmaps and vertex colors.

**Options (in order of practicality):**
1. Analyze lightmap gradients to estimate dominant light direction per surface
2. Use a companion UnrealScript mutator to export light actor positions (shared memory or file)
3. Provide manual light placement config per map (JSON file)
4. Use screen-space techniques that don't need explicit lights (SSAO, SSR work without light positions)

### 5. Transparency and Draw Order

UE2 doesn't use a deferred rendering pipeline — it draws front-to-back with painter's algorithm for transparency. RT and deferred techniques need careful handling of:
- Translucent surfaces (glass, particles, effects)
- Masked textures (fences, foliage with alpha cutout)
- Modulated blending (KF1 uses this for some effects)

**Approach:** Use a hybrid pipeline — deferred for opaque geometry (enables RT), forward for translucent geometry.

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Language | C++17 or C++20 |
| Build | CMake + Visual Studio 2022 |
| Graphics API | DirectX 12 (via Windows SDK) |
| Ray Tracing | DXR 1.1 (inline + shader-based) |
| DLSS | NVIDIA Streamline SDK 2.x |
| Shader Language | HLSL 6.6+ (SM 6.5 for DXR) |
| Shader Compiler | DXC (DirectX Shader Compiler) |
| Math Library | DirectXMath or glm |
| Debugging | PIX, RenderDoc (non-RT), NVIDIA Nsight |
| RE Tools | Ghidra / IDA Pro / x64dbg |

## Minimum Hardware

| Feature | Minimum GPU |
|---------|------------|
| DX12 renderer (no RT/DLSS) | Any DX12 GPU (GTX 600+, RX 400+) |
| Ray tracing | RTX 2060 / RX 6600 XT |
| DLSS Super Resolution | RTX 2060+ |
| DLSS Frame Generation | RTX 4060+ |
| DLSS Multi Frame Generation | RTX 5070+ |
| DLSS Ray Reconstruction | RTX 4060+ |

---

## Development Order Summary

```
Phase 0  [Research]     RE the URenderDevice interface, set up build
Phase 1  [Foundation]   Working DX12 renderer with visual parity
Phase 2  [Enhancement]  Post-processing, HDR, motion vectors, SSAO
Phase 3  [Ray Tracing]  BLAS/TLAS management, RT shadows → reflections → AO → GI
Phase 4  [DLSS 4]       Super Resolution → Reflex → Frame Gen → Ray Reconstruction
Phase 5  [Polish]       Settings UI, fallbacks, compatibility, optimization
```

Each phase is independently valuable — Phase 1 alone gives you a working DX12 KF1. Phase 2 makes it look better. Phases 3-4 are the wow factor.

---

## Alternative: FSR 3 (AMD) for Non-NVIDIA GPUs

If you want to support AMD/Intel GPUs with upscaling and frame gen:
- **FSR 3.1** — open source, works on any GPU (DX11/12/Vulkan)
- **FSR 3 Frame Generation** — works on any DX12 GPU (not NVIDIA-exclusive)
- Can be implemented alongside DLSS — detect GPU vendor at startup, use appropriate technology
- FSR uses the same inputs (depth, motion vectors, color) — the integration pattern is similar
- SDK: https://github.com/GPUOpen-LibrariesAndSDKs/FidelityFX-SDK
