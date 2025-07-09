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
                    color: cubeMat[0].color
                });
                cube.ballMesh = new THREE.Mesh(ballGeometry, ballMat);
                cube.ballMesh.visible = false;
                scene.add(cube.ballMesh);
                
                // Create pyramid mesh for transformation
                const pyramidMat = new THREE.MeshLambertMaterial({ 
                    color: cubeMat[0].color
                });
                cube.pyramidMesh = new THREE.Mesh(pyramidGeometry, pyramidMat);
                cube.pyramidMesh.visible = false;
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
