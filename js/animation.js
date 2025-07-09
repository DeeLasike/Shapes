// Animation state variables
let isSpinning = true;
let scrollProgress = 0;
let rubiksCubes = [];
let mainCube;

// Animation phases and progress calculations
function calculateAnimationPhases(scrollProgress) {
    const transformProgress = Math.min((scrollProgress - 0.05) / 0.30, 1); // Rubik's cube phase (0.05 to 0.35) - increased from 0.20
    const pyramidProgress = Math.max(0, Math.min(1, (scrollProgress - 0.35) / 0.25, 1)); // Pyramid phase (0.35 to 0.60) - increased from 0.20
    const ballProgress = Math.max(0, Math.min(1, (scrollProgress - 0.60) / 0.25, 1)); // Ball phase (0.60 to 0.85) - increased from 0.20
    const pyramidTransformProgress = Math.max(0, Math.min(1, (scrollProgress - 0.85) / 0.15)); // Pyramid transform phase (0.85 to 1.00) - reduced from 0.35
    
    return { transformProgress, pyramidProgress, ballProgress, pyramidTransformProgress };
}

// Animate main cube
function animateMainCube(mainCube, isSpinning) {
    if (isSpinning) {
        mainCube.rotation.x += 0.01;
        mainCube.rotation.y += 0.01;
        mainCube.position.y = Math.sin(Date.now() * 0.001) * 0.3;
    }
}

// Animate individual cube in Rubik's cube formation
function animateCube(cube, index, phases, adjustedProgress) {
    const { transformProgress, pyramidProgress, ballProgress, pyramidTransformProgress } = phases;
    
    let currentTargetPosition;
    
    if (pyramidTransformProgress > 0) {
        // Pyramid transform phase - balls transform into spinning pyramids
        cube.visible = false;
        cube.ballMesh.visible = false;
        cube.pyramidMesh.visible = true;
        
        // Keep pyramids at the same position as balls were
        cube.pyramidMesh.position.copy(cube.ballPosition);
        
        // Add spinning animation to pyramids
        cube.pyramidMesh.rotation.x += 0.02;
        cube.pyramidMesh.rotation.y += 0.03;
        cube.pyramidMesh.rotation.z += 0.01;
        
        // Scale pyramids as they transform from balls
        const pyramidScale = pyramidTransformProgress * 1.5;
        cube.pyramidMesh.scale.set(pyramidScale, pyramidScale, pyramidScale);
        
        // Fade in pyramids
        cube.pyramidMesh.material.opacity = pyramidTransformProgress;
        cube.pyramidMesh.material.transparent = true;
        
    } else if (ballProgress > 0) {
        // Keep cubes visible during ball transition for smooth morphing
        cube.visible = true;
        cube.ballMesh.visible = true;
        
        // Interpolate between pyramid position and ball position
        currentTargetPosition = new THREE.Vector3();
        const fromPosition = pyramidProgress > 0 ? cube.pyramidPosition : cube.targetPosition;
        currentTargetPosition.lerpVectors(fromPosition, cube.ballPosition, ballProgress);
        
        // Sync positions for smooth morphing
        cube.position.lerpVectors(cube.initialPosition, currentTargetPosition, adjustedProgress);
        cube.ballMesh.position.copy(cube.position);
        cube.ballMesh.position.y += Math.sin(Date.now() * 0.001 + index * 0.5) * 0.5 * ballProgress;
        
        // Add rotation to balls
        cube.ballMesh.rotation.x += 0.02 * ballProgress;
        cube.ballMesh.rotation.y += 0.01 * ballProgress;
        
        // Smooth scale transition - cubes shrink as balls grow
        const cubeScale = adjustedProgress * (1 - ballProgress * 0.8);
        cube.scale.set(cubeScale, cubeScale, cubeScale);
        
        const ballScale = adjustedProgress * ballProgress * 1.2;
        cube.ballMesh.scale.set(ballScale, ballScale, ballScale);
        
        // Smooth opacity transition
        cube.material.forEach(mat => {
            mat.opacity = 1 - ballProgress;
            mat.transparent = true;
        });
        
        cube.ballMesh.material.opacity = ballProgress;
        cube.ballMesh.material.transparent = true;
        
    } else if (pyramidProgress > 0) {
        // Show cubes, hide balls
        cube.ballMesh.visible = false;
        
        // Reset opacity for cubes
        cube.material.forEach(mat => {
            mat.opacity = 1;
            mat.transparent = false;
        });
        
        // Interpolate between Rubik's cube position and pyramid position
        currentTargetPosition = new THREE.Vector3();
        currentTargetPosition.lerpVectors(cube.targetPosition, cube.pyramidPosition, pyramidProgress);
    } else {
        // Show cubes, hide balls and pyramids
        cube.ballMesh.visible = false;
        cube.pyramidMesh.visible = false;
        
        // Reset opacity for cubes
        cube.material.forEach(mat => {
            mat.opacity = 1;
            mat.transparent = false;
        });
        
        currentTargetPosition = cube.targetPosition;
    }
    
    // Animate cube position (always animate, but scale determines visibility)
    if (ballProgress === 0 && pyramidTransformProgress === 0) {
        cube.position.lerpVectors(cube.initialPosition, currentTargetPosition, adjustedProgress);
        
        // Animate scale - now starts from 0 and scales to 1 (same size as main cube)
        const scale = adjustedProgress;
        cube.scale.set(scale, scale, scale);
        
        // Sync rotation with main cube, but add some pyramid-specific rotation
        if (!isSpinning) {
            cube.rotation.x = mainCube.rotation.x + (pyramidProgress * 0.5);
            cube.rotation.y = mainCube.rotation.y + (pyramidProgress * 0.3);
        }
    } else {
        // During ball/pyramid transform transition, sync rotation with main cube
        if (!isSpinning) {
            cube.rotation.x = mainCube.rotation.x + (pyramidProgress * 0.5);
            cube.rotation.y = mainCube.rotation.y + (pyramidProgress * 0.3);
        }
    }
}

// Animate camera position based on current phase
function animateCamera(camera, phases) {
    const { transformProgress, pyramidProgress, ballProgress, pyramidTransformProgress } = phases;
    
    const baseCameraZ = 5 + (transformProgress * 3);
    const pyramidCameraZ = baseCameraZ + (pyramidProgress * 2);
    const ballCameraZ = pyramidCameraZ + (ballProgress * 6);
    const pyramidTransformCameraZ = ballCameraZ + (pyramidTransformProgress * 4);
    camera.position.z += (pyramidTransformCameraZ - camera.position.z) * 0.02;
}

// Handle main cube visibility and position during phases
function handleMainCubePhases(mainCube, phases) {
    const { pyramidProgress, ballProgress, pyramidTransformProgress } = phases;
    
    if (ballProgress > 0 || pyramidTransformProgress > 0) {
        // Hide main cube during ball and pyramid transform phases
        mainCube.visible = false;
    } else {
        mainCube.visible = true;
        if (pyramidProgress > 0) {
            const pyramidTopPosition = new THREE.Vector3(0, 1, 0);
            mainCube.position.lerpVectors(
                new THREE.Vector3(0, Math.sin(Date.now() * 0.001) * 0.3, 0),
                pyramidTopPosition,
                pyramidProgress
            );
        }
    }
}
