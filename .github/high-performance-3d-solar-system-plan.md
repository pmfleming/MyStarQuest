# Plan: Unified 3D Planetary & Solar System Integration

This plan details the transition of the "Earth View" (Time Explorer) to a high-performance 3D engine and its integration with a new "Solar System View".

## 1. Vision: Unified Planetary Experience

Instead of two separate components, we will build a single, unified 3D experience that allows the user to toggle between a **Close-up Earth View** (replacing the current D3-based explorer) and a **Solar System View**.

### 1.1 Why Rewrite Earth View in Three.js?

- **Visual Consistency**: Seamless transitions and matching lighting/shading between views.
- **Performance**: Move from D3 Canvas rendering to hardware-accelerated WebGL.
- **Maintenance**: Consolidate logic into a single 3D manager; remove dependencies on external D3/TopoJSON scripts.
- **Realism**: Native support for axial tilt, realistic day/night textures, and a physically accurate terminator line.

## 2. Architecture: Standalone Three.js Manager

### 2.1 `SolarSystem3DManager.ts`

The manager will now support two primary "Display Modes":

- **`EARTH_FOCUS`**: The camera is locked to the Earth. The Earth fills the screen. Users see the terminator line and rotation clearly.
- **`SOLAR_FOCUS`**: The camera pulls back to show the Sun at the center with the Earth and Moon orbiting it.

### 2.2 Integration in `TimeExplorerPage.tsx`

- The `SolarSystem3D` component will be the primary visual element.
- A **Sun/Earth Toggle Icon** (positioned in the UI overlay) will trigger the camera transition between modes.
- **State Sync**: The manager will listen to `selectedDate` (for orbital position) and `currentTime` (for axial rotation).

## 3. Visual & Interaction Strategy

### 3.1 Earth View (Close-up)

- **Rotation**: Earth rotates 360° every 24 hours (linked to the app's clock).
- **Terminator**: Sharp transition between day and night textures, dynamically updated by the Sun's relative position.
- **Features**: 3D atmosphere glow, cloud layer, and night lights.
- **Cities**: Markers for key cities (e.g., Amsterdam, New York, Tokyo) will be visible on the globe.

### 3.2 Solar System View (Wide)

- **Elliptical Orbit**: To maximize the use of rectangular mobile/tablet screens, the Earth will follow a slightly elliptical path rather than a perfect circle.
- **Orbit Mapping**: January is positioned at "12 o'clock" (top of the orbit).
- **Moon**: Realistic orbit around the Earth.
- **City Markers**: City markers remain visible on the Earth mesh even in Solar view, reinforcing the connection between local time and global position.
- **Seasonal UI**: Faded month labels around the Sun with seasonal color indicators (e.g., blue for winter, yellow for summer).

### 3.3 Transitions & Zoom

- Toggling modes will trigger a smooth **Zoom Animation**. The camera will lerp (linear interpolate) between positions, providing a sense of scale as the user "flies" from the Sun to the Earth and back.

## 4. Technical Implications

- **Assets**: Require high-quality Earth textures (Day, Night, Clouds, Specular).
- **Coordinates**: Use a consistent coordinate system where Sun is `(0,0,0)`.
- **Input**: Support touch/mouse rotation of the globe in Earth mode and camera orbiting in Solar mode.

## 5. Implementation Steps

1. **Infrastructure**: Install `three` and types.
2. **The Manager**: Implement `SolarSystem3DManager` with basic scene setup.
3. **The Earth**: Port Earth rendering from D3 to Three.js (Geometry, Materials, Textures).
4. **City Pins**: Implement a system to place persistent 3D markers on the Earth's surface.
5. **The Sun & Moon**: Add the central Sun and orbiting Moon.
6. **The Toggle & Zoom**: Implement the camera lerp logic and elliptical orbital path.
7. **UI Integration**: Add the component and toggle button to `TimeExplorerPage`.
8. **Animation**: Link app-wide Time/Date state to 3D transformations.

## 6. Verification

- **Performance**: Target 60fps on Android.
- **Visuals**: Verify the terminator line correctly reflects the time of day.
- **UI**: Ensure the Sun/Earth toggle is intuitive and responsive.
