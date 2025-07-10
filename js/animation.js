// Animation state variables
let isSpinning = true;
let scrollProgress = 0;
let rubiksCubes = [];
let mainCube;

// Text rendering variables
let textMesh = null;
let textGeometry = null;
let textMaterial = null;
let fontLoader = null;
let loadedFont = null;
let currentDisplayedText = "CUBE";
let targetText = "CUBE";
let titleFadeProgress = 0; // 0 = fully visible, 1 = fully faded out
let titleTransitioning = false;

// Performance optimization variables
let lastTime = 0;
let deltaTime = 0;
let cachedTime = 0;
let cachedFastTime = 0;
let cachedSlowTime = 0; // For slower color transitions
let frameCount = 0;

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
        mainCube.position.y = Math.sin(cachedTime) * 0.3;
    }
}

// Animate individual cube in Rubik's cube formation
function animateCube(cube, index, phases, adjustedProgress) {
    const { transformProgress, pyramidProgress, ballProgress, pyramidTransformProgress } = phases;
    
    let currentTargetPosition;
    
    if (pyramidTransformProgress > 0) {
        // Pyramid transform phase - balls fade away and pyramids appear
        cube.visible = false;
        cube.ballMesh.visible = true;
        cube.pyramidMesh.visible = true;
        
        // Keep both at the same position as balls
        cube.ballMesh.position.copy(cube.ballPosition);
        cube.pyramidMesh.position.copy(cube.ballPosition);
        
        // Add floating animation to both
        const floatOffset = Math.sin(cachedTime + index * 0.5) * 0.5;
        cube.ballMesh.position.y += floatOffset;
        cube.pyramidMesh.position.y += floatOffset;
        
        // Make pyramids jiggle like jelly when cursor is touching them
        // Convert mouse screen coordinates to world coordinates
        const mouseWorldX = mouseX * 10; // Scale to world space
        const mouseWorldY = mouseY * 10;
        
        // Calculate distance from cursor to pyramid
        const pyramidPos = cube.pyramidMesh.position;
        const distanceX = mouseWorldX - pyramidPos.x;
        const distanceY = mouseWorldY - pyramidPos.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        
        // Define touch threshold (very close distance for touching)
        const touchThreshold = 1.0; // Much smaller threshold for touching
        const maxJiggle = 0.4; // Increased jiggle intensity
        
        // Calculate jiggle intensity based on touch proximity
        const jiggleIntensity = distance < touchThreshold ? 1 : 0; // Binary: touching or not
        
        if (jiggleIntensity > 0) {
            // Apply intense jelly-like jiggling animation when touching
            const jiggleTime = cachedTime * 15; // Cached version of Date.now() * 0.015
            const jiggleFastTime = cachedTime * 30; // Cached version of Date.now() * 0.03
            
            // Intense jiggle rotation with varying frequencies for jelly effect
            cube.pyramidMesh.rotation.x = Math.sin(jiggleTime + index * 0.5) * maxJiggle;
            cube.pyramidMesh.rotation.y = Math.cos(jiggleFastTime + index * 0.3) * maxJiggle;
            cube.pyramidMesh.rotation.z = Math.sin(jiggleTime * 1.5 + index * 0.8) * maxJiggle;
            
            // Add intense scale jiggling for more jelly-like effect
            const scaleJiggle = 1 + Math.sin(jiggleFastTime + index) * 0.15;
            cube.pyramidMesh.scale.set(1.5 * scaleJiggle, 1.5 * scaleJiggle, 1.5 * scaleJiggle);
        } else {
            // Normal spinning animation when not touching
            cube.pyramidMesh.rotation.x += 0.01;
            cube.pyramidMesh.rotation.y += 0.02;
            cube.pyramidMesh.rotation.z += 0.005;
            
            // Reset scale to normal
            cube.pyramidMesh.scale.set(1.5, 1.5, 1.5);
        }
        
        // Balls fade away while maintaining their size
        cube.ballMesh.scale.set(1.2, 1.2, 1.2);
        
        // Pyramids appear at full size
        cube.pyramidMesh.scale.set(1.5, 1.5, 1.5);
        
        // Smooth opacity transition - balls fade out as pyramids fade in
        cube.ballMesh.material.opacity = 1 - pyramidTransformProgress;
        cube.ballMesh.material.transparent = true;
        
        cube.pyramidMesh.material.opacity = pyramidTransformProgress;
        cube.pyramidMesh.material.transparent = true;
        
    } else if (ballProgress > 0) {
        // Keep cubes visible during ball transition for smooth morphing
        cube.visible = true;
        cube.ballMesh.visible = true;
        cube.pyramidMesh.visible = false;
        
        // Interpolate between pyramid position and ball position
        currentTargetPosition = new THREE.Vector3();
        const fromPosition = pyramidProgress > 0 ? cube.pyramidPosition : cube.targetPosition;
        currentTargetPosition.lerpVectors(fromPosition, cube.ballPosition, ballProgress);
        
        // Sync positions for smooth morphing
        cube.position.lerpVectors(cube.initialPosition, currentTargetPosition, adjustedProgress);
        cube.ballMesh.position.copy(cube.position);
        cube.ballMesh.position.y += Math.sin(cachedTime + index * 0.5) * 0.5 * ballProgress;
        
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

// Initialize text system
function initTextSystem() {
    fontLoader = new THREE.FontLoader();
    
    // Load a font (using Three.js built-in font)
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function (font) {
        loadedFont = font;
        currentDisplayedText = "CUBE";
        targetText = "CUBE";
        createTextMesh("CUBE");
    });
}

// Create bubbly text mesh
function createTextMesh(text) {
    if (!loadedFont) return;
    
    // Remove existing text mesh
    if (textMesh) {
        scene.remove(textMesh);
        if (textGeometry) textGeometry.dispose();
        if (textMaterial) textMaterial.dispose();
    }
    
    // Create text geometry
    textGeometry = new THREE.TextGeometry(text, {
        font: loadedFont,
        size: 8,
        height: 1.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.2,
        bevelOffset: 0,
        bevelSegments: 8
    });
    
    // Center the text
    textGeometry.computeBoundingBox();
    const centerOffsetX = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
    const centerOffsetY = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
    textGeometry.translate(centerOffsetX, centerOffsetY, 0);
    
    // Create enhanced bubbly material with dynamic properties
    textMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        shininess: 120,
        specular: 0x444444,
        emissive: 0x111111, // Add subtle glow
        emissiveIntensity: 0.2
    });
    
    // Create text mesh
    textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, -20); // Position behind shapes
    scene.add(textMesh);
}

// Update text based on current animation phase
function updateShapeTitle(phases) {
    if (!loadedFont) return;
    
    const { transformProgress, pyramidProgress, ballProgress, pyramidTransformProgress } = phases;
    
    let newTargetText = "CUBE";
    let baseOpacity = 0.3;
    
    if (pyramidTransformProgress > 0) {
        newTargetText = "PYRAMID";
        baseOpacity = 0.4;
    } else if (ballProgress > 0) {
        newTargetText = "SPHERE";
        baseOpacity = 0.4;
    }
    
    // Check if we need to start a transition
    if (newTargetText !== targetText) {
        targetText = newTargetText;
        titleTransitioning = true;
        titleFadeProgress = 0;
    }
    
    // Handle title transitions
    if (titleTransitioning) {
        titleFadeProgress += 0.05; // Fade speed
        
        if (titleFadeProgress >= 1) {
            // Fade out complete, switch to new text
            currentDisplayedText = targetText;
            createTextMesh(currentDisplayedText);
            titleFadeProgress = 1;
        }
        
        if (titleFadeProgress >= 2) {
            // Fade in complete, transition finished
            titleTransitioning = false;
            titleFadeProgress = 0;
        }
    }
    
    // Ensure we have the correct text mesh
    if (textMesh && textMesh.userData.currentText !== currentDisplayedText) {
        createTextMesh(currentDisplayedText);
        textMesh.userData.currentText = currentDisplayedText;
    }
    
    if (textMesh) {
        // Use cached time values for better performance
        const time = cachedTime;
        const fastTime = cachedFastTime;
        
        // Pre-calculate common sine/cosine values to avoid redundant calculations
        const sin08 = Math.sin(time * 0.8);
        const sin13 = Math.sin(time * 1.3);
        const sin05 = Math.sin(time * 0.5);
        const sin12 = Math.sin(time * 1.2);
        
        // Bubbly animation with more variation
        const bubbleScale = 1 + sin08 * 0.05 + sin13 * 0.03;
        textMesh.scale.set(bubbleScale, bubbleScale, bubbleScale);
        
        // Enhanced floating animation with multiple wave patterns
        const floatY = sin05 * 0.8 + sin12 * 0.3;
        textMesh.position.y = floatY;
        
        // More dynamic rotation with wobble
        const rotationZ = Math.sin(time * 0.3) * 0.05 + Math.sin(time * 0.7) * 0.02;
        textMesh.rotation.z = rotationZ;
        
        // Add gentle X and Y rotation for 3D effect
        textMesh.rotation.x = Math.sin(time * 0.4) * 0.03;
        textMesh.rotation.y = Math.sin(time * 0.6) * 0.02;
        
        // Calculate opacity with fade transition
        let targetOpacity = baseOpacity;
        if (titleTransitioning) {
            if (titleFadeProgress <= 1) {
                // Fade out phase
                targetOpacity = baseOpacity * (1 - titleFadeProgress);
            } else {
                // Fade in phase
                targetOpacity = baseOpacity * (titleFadeProgress - 1);
            }
        }
        
        // Animate opacity
        textMaterial.opacity += (targetOpacity - textMaterial.opacity) * 0.1;
        
        // Enhanced colorful animation with multiple color cycles
        // Only update colors every few frames for better performance
        if (frameCount % 2 === 0) {
            // Use slower time for more gradual color transitions
            const slowTime = cachedSlowTime;
            
            // Pre-calculate hue values with slower cycling
            const hue1 = (slowTime * 0.4) % 1; // Reduced from 0.8
            const hue2 = (slowTime * 0.25 + 0.3) % 1; // Reduced from 0.5
            const hue3 = (slowTime * 0.6 + 0.6) % 1; // Reduced from 1.2
            
            // Mix multiple hue cycles for more vibrant colors
            const mixedHue = (hue1 + hue2 * 0.3 + hue3 * 0.2) % 1;
            
            // Dynamic saturation and lightness with slower animation
            const saturation = 0.8 + Math.sin(slowTime * 1.0) * 0.2; // Reduced from 2.0
            const lightness = 0.6 + Math.sin(slowTime * 0.75 + 1) * 0.2; // Reduced from 1.5
            
            textMaterial.color.setHSL(mixedHue, saturation, lightness);
            
            // Enhanced specular highlights with slower shimmer
            const specularIntensity = 0.5 + Math.sin(slowTime * 1.5) * 0.3; // Reduced from 3.0
            textMaterial.specular.setHSL((mixedHue + 0.5) % 1, 0.8, specularIntensity);
            
            // Adjust shininess with slower reflections
            textMaterial.shininess = 80 + Math.sin(slowTime * 1.25) * 40; // Reduced from 2.5
            
            // Add glowing emissive color animation with slower pulse
            const emissiveHue = (mixedHue + 0.2) % 1;
            const emissiveIntensity = 0.1 + Math.sin(slowTime * 1.25) * 0.1; // Reduced from 2.5
            textMaterial.emissive.setHSL(emissiveHue, 0.6, emissiveIntensity);
            textMaterial.emissiveIntensity = emissiveIntensity;
        }
    }
}

// Performance optimization: Update cached time values
function updateCachedTimeValues() {
    const currentTime = Date.now();
    deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    cachedTime = currentTime * 0.001;
    cachedFastTime = cachedTime * 0.3;
    cachedSlowTime = cachedTime * 0.1; // Much slower time for color transitions
    frameCount++;
}

// Optimize geometry calculations by reducing redundant operations
function optimizedLerpVectors(target, from, to, progress) {
    // Only perform lerp if progress has changed significantly
    if (Math.abs(progress - (target.userData.lastProgress || 0)) > 0.001) {
        target.lerpVectors(from, to, progress);
        target.userData.lastProgress = progress;
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
                new THREE.Vector3(0, Math.sin(cachedTime) * 0.3, 0),
                pyramidTopPosition,
                pyramidProgress
            );
        }
    }
}
