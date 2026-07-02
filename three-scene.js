/**
 * Three.js 3D Interactive Particle Visualizer Scene
 */

(function() {
    const container = document.getElementById('canvas-3d-container');
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 5.5;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // --- Particle System Configuration ---
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    
    // Arrays for tracking position transformations
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Pre-calculate target coordinates for the shapes
    const spherePositions = [];
    const torusPositions = [];
    const helixPositions = [];
    
    // Pre-calculate color variations for the shapes (gives custom theme transitions)
    const sphereColors = [];
    const torusColors = [];
    const helixColors = [];

    // Helper color generators (using Tailwind/Indigo gradients)
    const colorIndigo = new THREE.Color('#6366f1');
    const colorCyan = new THREE.Color('#06b6d4');
    const colorPink = new THREE.Color('#ec4899');
    const colorPurple = new THREE.Color('#a855f7');

    for (let i = 0; i < particleCount; i++) {
        // --- 1. Sphere positions ---
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const sphereRadius = 1.9;
        
        const sx = sphereRadius * Math.sin(phi) * Math.cos(theta);
        const sy = sphereRadius * Math.sin(phi) * Math.sin(theta);
        const sz = sphereRadius * Math.cos(phi);
        spherePositions.push(sx, sy, sz);

        // Sphere color: Indigo to Pink gradient based on height
        const sphereCol = new THREE.Color().copy(colorIndigo).lerp(colorPink, (sy + sphereRadius) / (sphereRadius * 2));
        sphereColors.push(sphereCol.r, sphereCol.g, sphereCol.b);

        // --- 2. Torus Knot positions ---
        const p = 2; // loops around axis
        const q = 3; // loops around interior
        const t = (i / particleCount) * Math.PI * 2 * p;
        const torusRadius = 0.7 * (2 + Math.sin(q * t));
        
        const tx = torusRadius * Math.cos(p * t);
        const ty = torusRadius * Math.sin(p * t);
        const tz = 0.7 * Math.cos(q * t);
        torusPositions.push(tx, ty, tz);

        // Torus color: Cyan to Purple gradient
        const torusCol = new THREE.Color().copy(colorCyan).lerp(colorPurple, (tx + 2) / 4);
        torusColors.push(torusCol.r, torusCol.g, torusCol.b);

        // --- 3. Double Helix positions ---
        const helixT = (i / particleCount) * Math.PI * 6; // 3 full twists
        const helixRadius = 1.1;
        const isStrand2 = i % 2 === 0;
        const angle = helixT + (isStrand2 ? Math.PI : 0);
        
        const hx = helixRadius * Math.cos(angle);
        const hy = (helixT / (Math.PI * 6)) * 3.4 - 1.7; // From -1.7 to 1.7
        const hz = helixRadius * Math.sin(angle);
        helixPositions.push(hx, hy, hz);

        // Helix color: Pink (Strand 1) or Cyan (Strand 2)
        const helixCol = isStrand2 ? colorCyan : colorPink;
        helixColors.push(helixCol.r, helixCol.g, helixCol.b);
    }

    // Set initial layout to Sphere
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = spherePositions[i];
        colors[i] = sphereColors[i];
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // --- Circular Glowing Particle Texture ---
    // Drawn via HTML5 Canvas to eliminate external assets loading
    function createCircleTexture() {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Draw glowing circular radial gradient
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        return new THREE.CanvasTexture(canvas);
    }

    const material = new THREE.PointsMaterial({
        size: 0.12,
        map: createCircleTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    // --- Animation & Physics State Variables ---
    let currentShapeIndex = 0; // 0: Sphere, 1: Torus, 2: Helix
    const shapes = [
        { pos: spherePositions, col: sphereColors },
        { pos: torusPositions, col: torusColors },
        { pos: helixPositions, col: helixColors }
    ];

    // Interaction values
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let raycaster = new THREE.Raycaster();
    let plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Intersection plane at z = 0
    let mouse3d = new THREE.Vector3(0, 0, 0);

    // Dynamic velocities array for particle kinetic warp physics
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
        velocities.push(new THREE.Vector3(0, 0, 0));
    }

    // --- Mouse Listeners ---
    container.addEventListener('mousemove', (e) => {
        // Calculate normalized device coordinates (-1 to +1)
        const rect = container.getBoundingClientRect();
        mouse.targetX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.targetY = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
    });

    container.addEventListener('mouseleave', () => {
        mouse.targetX = 0;
        mouse.targetY = 0;
    });

    // Morph shapes on click
    container.addEventListener('click', () => {
        currentShapeIndex = (currentShapeIndex + 1) % shapes.length;
        
        // Custom interaction tip toast
        const shapeNames = ["Digital Sphere", "Torus Core", "Code Helix"];
        if (window.showToast) {
            window.showToast(`Morphing 3D object to ${shapeNames[currentShapeIndex]}`, 'success');
        }
    });

    // --- Window Resize Hook ---
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- Main Animation Loop ---
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // 1. Smooth mouse movement interpolation
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;

        // 2. Project mouse coordinates into 3D world space at z=0 plane
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.intersectPlane(plane, mouse3d);

        // 3. Gentle base rotation of the entire particle system
        particleSystem.rotation.y = time * 0.12;
        particleSystem.rotation.x = Math.sin(time * 0.05) * 0.15;

        // Apply mouse-driven parallax tilt to the whole system
        particleSystem.rotation.y += mouse.x * 0.5;
        particleSystem.rotation.x -= mouse.y * 0.5;

        // 4. Update individual particle positions (Morphing + Physics)
        const positionsAttr = geometry.attributes.position;
        const colorsAttr = geometry.attributes.color;
        
        const targetPos = shapes[currentShapeIndex].pos;
        const targetCol = shapes[currentShapeIndex].col;

        const posArray = positionsAttr.array;
        const colArray = colorsAttr.array;

        // Active transformation matrix of particle system to calculate world space distance
        const tempPos = new THREE.Vector3();
        const worldPos = new THREE.Vector3();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Get current local coordinates
            tempPos.set(posArray[i3], posArray[i3+1], posArray[i3+2]);
            
            // Calculate world coordinates by applying rotation matrix
            worldPos.copy(tempPos).applyMatrix4(particleSystem.matrixWorld);

            // Calculate distance to projected mouse cursor
            const dist = worldPos.distanceTo(mouse3d);
            
            // Interaction physics: attract/repulse particles close to cursor
            const forceMaxDistance = 1.2;
            const forceStrength = 0.07;
            
            const velocity = velocities[i];

            if (dist < forceMaxDistance) {
                // Direction vector pointing away from cursor
                const direction = new THREE.Vector3().subVectors(worldPos, mouse3d).normalize();
                
                // Strength varies inversely with distance
                const factor = (1 - (dist / forceMaxDistance));
                
                // Add acceleration force
                velocity.addScaledVector(direction, factor * forceStrength * (1 + Math.sin(time * 2 + i)));
            }

            // Dampen velocity to prevent particle flyaways
            velocity.multiplyScalar(0.85);

            // Target shape coordinates
            const tx = targetPos[i3];
            const ty = targetPos[i3+1];
            const tz = targetPos[i3+2];

            // 5. Morph interpolation: Pull particles toward target layout coordinates
            const morphSpeed = 0.06;
            posArray[i3] += (tx - posArray[i3]) * morphSpeed + velocity.x;
            posArray[i3+1] += (ty - posArray[i3+1]) * morphSpeed + velocity.y;
            posArray[i3+2] += (tz - posArray[i3+2]) * morphSpeed + velocity.z;

            // Interpolate colors towards target layout colors
            colArray[i3] += (targetCol[i3] - colArray[i3]) * morphSpeed;
            colArray[i3+1] += (targetCol[i3+1] - colArray[i3+1]) * morphSpeed;
            colArray[i3+2] += (targetCol[i3+2] - colArray[i3+2]) * morphSpeed;
        }

        // Notify WebGL that attributes changed
        positionsAttr.needsUpdate = true;
        colorsAttr.needsUpdate = true;

        // Render scene
        renderer.render(scene, camera);
    }

    // Start loop
    animate();
})();
