// Main application entry point

// Global variables
let scene, camera, renderer;

// Initialize and start the application
function init() {
    // Initialize scene
    const sceneData = initScene();
    scene = sceneData.scene;
    camera = sceneData.camera;
    renderer = sceneData.renderer;
    
    // Add lighting
    addLighting(scene);
    
    // Add colorful swirly background
    addColorfulBackground(scene);
    
    // Create geometries
    const { geometry, materials } = createGeometry();
    const { ballGeometry, pyramidGeometry } = createShapeGeometries();
    
    // Create main cube
    mainCube = new THREE.Mesh(geometry, materials);
    scene.add(mainCube);
    
    // Create Rubik's cube structure
    rubiksCubes = createRubiksCube(scene, materials, ballGeometry, pyramidGeometry);
    
    // Initialize text system for shape titles
    initTextSystem();
    
    // Setup event listeners
    setupMouseInteraction();
    setupScrollInteraction();
    setupWindowResize(camera, renderer);
    
    // Start animation loop
    animate();
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update cached time values for performance optimization
    updateCachedTimeValues();
    
    // Calculate animation phases
    const phases = calculateAnimationPhases(scrollProgress);
    
    // Animate main cube
    animateMainCube(mainCube, isSpinning);
    
    // Transform to Rubik's cube based on scroll progress
    if (scrollProgress > 0.05) {
        const { transformProgress } = phases;
        
        // Scale down the main cube
        const mainCubeScale = 1 - (transformProgress * 0.4);
        mainCube.scale.set(mainCubeScale, mainCubeScale, mainCubeScale);
        
        // Show and animate the Rubik's cube pieces
        rubiksCubes.forEach((cube, index) => {
            cube.visible = true;
            
            // Stagger the appearance of cubes
            const delay = index * 0.03;
            const adjustedProgress = Math.max(0, Math.min(1, (transformProgress - delay) / 0.5));
            
            // Animate individual cube
            animateCube(cube, index, phases, adjustedProgress);
        });
        
        // Animate camera
        animateCamera(camera, phases);
        
        // Handle main cube visibility and position
        handleMainCubePhases(mainCube, phases);
        
        // Update shape title text
        updateShapeTitle(phases);
        
    } else {
        // When scrolling back up, animate cubes back to initial spread positions
        handleRetreatAnimation(rubiksCubes, scrollProgress);
        
        // Reset main cube scale and visibility
        mainCube.scale.set(1, 1, 1);
        mainCube.visible = true;
        
        // Reset camera position
        camera.position.z += (5 - camera.position.z) * 0.05;
        
        // Update shape title text
        updateShapeTitle(calculateAnimationPhases(scrollProgress));
    }
    
    // Apply mouse interaction to camera
    applyMouseInteraction(camera);
    
    // Render the scene
    renderer.render(scene, camera);
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
