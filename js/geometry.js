// Geometry creation and position calculations

// Create main cube geometry and materials
function createGeometry() {
    const geometry = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    
    const materials = [
        new THREE.MeshLambertMaterial({ color: 0xff0000 }), // Right face - Red
        new THREE.MeshLambertMaterial({ color: 0x00ff00 }), // Left face - Green
        new THREE.MeshLambertMaterial({ color: 0x0000ff }), // Top face - Blue
        new THREE.MeshLambertMaterial({ color: 0xffff00 }), // Bottom face - Yellow
        new THREE.MeshLambertMaterial({ color: 0xff00ff }), // Front face - Magenta
        new THREE.MeshLambertMaterial({ color: 0x00ffff })  // Back face - Cyan
    ];
    
    return { geometry, materials };
}

// Create ball and pyramid geometries
function createShapeGeometries() {
    const ballGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const pyramidGeometry = new THREE.ConeGeometry(0.8, 1.6, 4); // 4 sides make it a pyramid
    
    return { ballGeometry, pyramidGeometry };
}

// Calculate pyramid positions for large pyramid structure
function calculatePyramidPosition(index) {
    const pyramidLayers = [
        // Bottom layer (3x3)
        [
            new THREE.Vector3(-1, -2, -1), new THREE.Vector3(0, -2, -1), new THREE.Vector3(-1, -2, 0),
            new THREE.Vector3(0, -2, 0), new THREE.Vector3(-1, -2, 1), new THREE.Vector3(0, -2, 1),
            new THREE.Vector3(1, -2, -1), new THREE.Vector3(1, -2, 0), new THREE.Vector3(1, -2, 1)
        ],
        // Second layer (2x2)
        [
            new THREE.Vector3(-0.5, -1, -0.5), new THREE.Vector3(0.5, -1, -0.5),
            new THREE.Vector3(-0.5, -1, 0.5), new THREE.Vector3(0.5, -1, 0.5)
        ],
        // Third layer (1x1)
        [
            new THREE.Vector3(0, 0, 0)
        ],
        // Top layer (1 cube)
        [
            new THREE.Vector3(0, 1, 0)
        ]
    ];
    
    const allPyramidPositions = pyramidLayers.flat();
    
    if (index < allPyramidPositions.length) {
        return allPyramidPositions[index];
    } else {
        // Place extra cubes around the base in a circle
        const angle = (index - allPyramidPositions.length) * (Math.PI * 2 / 6);
        const radius = 2.5;
        return new THREE.Vector3(
            Math.cos(angle) * radius,
            -2.5,
            Math.sin(angle) * radius
        );
    }
}

// Calculate floating ball positions
function calculateBallPosition(index) {
    const radius = 4 + Math.random() * 6; // Random radius between 4-10
    const theta = (index * 0.618) * Math.PI * 2; // Golden angle for spiral distribution
    const phi = Math.acos(1 - 2 * Math.random()); // Random phi for sphere distribution
    
    return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        (Math.random() - 0.5) * 8, // Random Y between -4 and 4
        radius * Math.sin(phi) * Math.sin(theta)
    );
}

// Calculate floating up positions for balls (unused in current implementation)
function calculateFloatingUpPosition(index) {
    const radius = 2 + Math.random() * 4;
    const theta = (index * 0.618) * Math.PI * 2;
    
    return new THREE.Vector3(
        radius * Math.cos(theta),
        8 + Math.random() * 4,
        radius * Math.sin(theta)
    );
}
