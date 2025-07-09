// Scene initialization and cube creation

// Initialize Three.js scene, camera, and renderer
function initScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.getElementById('container').appendChild(renderer.domElement);
    
    camera.position.z = 5;
    
    return { scene, camera, renderer };
}

// Add lighting to the scene
function addLighting(scene) {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
}

// Create Rubik's cube structure (without right side cubes)
function createRubiksCube(scene, materials, ballGeometry, pyramidGeometry) {
    const cubes = [];
    const cubeSize = 1.02;
    const spacing = 1.0;
    
    let cubeIndex = 0;
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                // Skip the center cube (it's our main cube)
                if (x === 0 && y === 0 && z === 0) continue;
                
                // Skip the right side cubes (x = 1)
                if (x === 1) continue;
                
                const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
                const cubeMat = materials.map(mat => mat.clone());
                const cube = new THREE.Mesh(cubeGeo, cubeMat);
                
                // Set initial position (spread out)
                const initialSpreadPosition = new THREE.Vector3(x * spacing * 8, y * spacing * 8, z * spacing * 8);
                cube.position.copy(initialSpreadPosition);
                cube.initialPosition = initialSpreadPosition;
                cube.targetPosition = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
                
                // Calculate positions for different phases
                cube.pyramidPosition = calculatePyramidPosition(cubeIndex);
                cube.ballPosition = calculateBallPosition(cubeIndex);
                cube.floatingUpPosition = calculateFloatingUpPosition(cubeIndex);
                
                // Create ball mesh for transformation
                const ballMat = new THREE.MeshLambertMaterial({ 
                    color: cubeMat[0].color,
                    transparent: true,
                    opacity: 0
                });
                cube.ballMesh = new THREE.Mesh(ballGeometry, ballMat);
                cube.ballMesh.visible = false;
                cube.ballMesh.scale.set(0, 0, 0);
                scene.add(cube.ballMesh);
                
                // Create pyramid mesh for transformation
                const pyramidMat = new THREE.MeshLambertMaterial({ 
                    color: cubeMat[0].color,
                    transparent: true,
                    opacity: 0
                });
                cube.pyramidMesh = new THREE.Mesh(pyramidGeometry, pyramidMat);
                cube.pyramidMesh.visible = false;
                cube.pyramidMesh.scale.set(0, 0, 0);
                scene.add(cube.pyramidMesh);
                
                cube.visible = false;
                
                scene.add(cube);
                cubes.push(cube);
                cubeIndex++;
            }
        }
    }
    
    return cubes;
}

// Add colorful swirly background
function addColorfulBackground(scene) {
    // Create background geometry (large plane)
    const backgroundGeometry = new THREE.PlaneGeometry(100, 100);
    
    // Create animated swirly background material
    const backgroundMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec2 resolution;
            varying vec2 vUv;
            
            void main() {
                vec2 uv = vUv;
                vec2 center = vec2(0.5, 0.5);
                
                // Multiple swirling centers for complexity
                vec2 center1 = vec2(0.3, 0.7);
                vec2 center2 = vec2(0.7, 0.3);
                vec2 center3 = vec2(0.2, 0.2);
                vec2 center4 = vec2(0.8, 0.8);
                
                // Create multiple layered swirling patterns
                float angle = atan(uv.y - center.y, uv.x - center.x);
                float radius = length(uv - center);
                
                float angle1 = atan(uv.y - center1.y, uv.x - center1.x);
                float radius1 = length(uv - center1);
                
                float angle2 = atan(uv.y - center2.y, uv.x - center2.x);
                float radius2 = length(uv - center2);
                
                float angle3 = atan(uv.y - center3.y, uv.x - center3.x);
                float radius3 = length(uv - center3);
                
                float angle4 = atan(uv.y - center4.y, uv.x - center4.x);
                float radius4 = length(uv - center4);
                
                // Create many detailed swirls with different frequencies
                float swirl1 = sin(angle * 8.0 + time * 0.7 + radius * 15.0) * 0.5 + 0.5;
                float swirl2 = cos(angle * 12.0 - time * 0.9 + radius * 20.0) * 0.5 + 0.5;
                float swirl3 = sin(angle * 6.0 + time * 1.2 + radius * 18.0) * 0.5 + 0.5;
                
                float swirl4 = sin(angle1 * 10.0 + time * 0.8 + radius1 * 25.0) * 0.5 + 0.5;
                float swirl5 = cos(angle2 * 15.0 - time * 1.1 + radius2 * 22.0) * 0.5 + 0.5;
                float swirl6 = sin(angle3 * 9.0 + time * 0.6 + radius3 * 28.0) * 0.5 + 0.5;
                float swirl7 = cos(angle4 * 11.0 - time * 1.3 + radius4 * 24.0) * 0.5 + 0.5;
                
                // Add fine detail swirls
                float detail1 = sin(angle * 20.0 + time * 2.0 + radius * 35.0) * 0.3 + 0.7;
                float detail2 = cos(angle * 25.0 - time * 1.8 + radius * 40.0) * 0.3 + 0.7;
                float detail3 = sin(angle * 18.0 + time * 2.5 + radius * 30.0) * 0.3 + 0.7;
                
                // Create complex wave patterns
                float wave1 = sin(uv.x * 12.0 + time * 0.8) * 0.4 + 0.6;
                float wave2 = cos(uv.y * 10.0 + time * 1.2) * 0.4 + 0.6;
                float wave3 = sin(uv.x * 15.0 + uv.y * 8.0 + time * 0.9) * 0.3 + 0.7;
                float wave4 = cos(uv.x * 8.0 - uv.y * 12.0 + time * 1.1) * 0.3 + 0.7;
                
                // Combine all patterns for rich, detailed colors
                vec3 color1 = vec3(
                    (swirl1 * swirl4 * detail1) * wave1,
                    (swirl2 * swirl5 * detail2) * wave2,
                    (swirl3 * swirl6 * detail3) * wave3
                );
                
                vec3 color2 = vec3(
                    (swirl7 * swirl2 * detail2) * wave4,
                    (swirl1 * swirl3 * detail1) * wave1,
                    (swirl4 * swirl5 * detail3) * wave2
                );
                
                vec3 color3 = vec3(
                    (swirl6 * swirl1 * detail3) * wave3,
                    (swirl7 * swirl4 * detail1) * wave4,
                    (swirl2 * swirl3 * detail2) * wave1
                );
                
                // Mix multiple color layers with different timings
                vec3 mixedColor1 = mix(color1, color2, sin(time * 0.3) * 0.5 + 0.5);
                vec3 mixedColor2 = mix(color2, color3, cos(time * 0.4) * 0.5 + 0.5);
                vec3 finalColor = mix(mixedColor1, mixedColor2, sin(time * 0.2) * 0.5 + 0.5);
                
                // Add brightness and contrast variations
                finalColor *= 0.9 + sin(time * 0.15) * 0.3;
                finalColor = pow(finalColor, vec3(0.8)); // Gamma correction for richness
                
                // Add subtle color shifting
                finalColor.r += sin(time * 0.1) * 0.1;
                finalColor.g += cos(time * 0.12) * 0.1;
                finalColor.b += sin(time * 0.08) * 0.1;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
        side: THREE.DoubleSide
    });
    
    // Create background mesh
    const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.position.z = -50; // Place far behind other objects
    scene.add(backgroundMesh);
    
    // Animation function to update background
    function animateBackground() {
        backgroundMaterial.uniforms.time.value = Date.now() * 0.001;
        requestAnimationFrame(animateBackground);
    }
    animateBackground();
}

// Handle retreat animation when scrolling back up
function handleRetreatAnimation(cubes, scrollProgress) {
    cubes.forEach((cube, index) => {
        if (cube.visible || cube.ballMesh.visible) {
            // Stagger the retreat animation
            const delay = index * 0.02;
            const retreatProgress = Math.max(0, Math.min(1, (0.05 - scrollProgress + delay) / 0.05));
            
            // Hide balls and pyramids, show cubes
            cube.ballMesh.visible = false;
            cube.pyramidMesh.visible = false;
            cube.visible = true;
            
            // Reset opacity and transparency
            cube.material.forEach(mat => {
                mat.opacity = 1;
                mat.transparent = false;
            });
            
            // Animate position from target back to initial spread position
            cube.position.lerpVectors(cube.targetPosition, cube.initialPosition, retreatProgress);
            
            // Animate scale down
            const scale = 1 - retreatProgress;
            cube.scale.set(scale, scale, scale);
            
            // Hide cube when it's fully retreated
            if (retreatProgress >= 1) {
                cube.visible = false;
            }
        }
    });
}
