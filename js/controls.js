// Event handlers for user interaction

// Mouse interaction variables
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;

// Mouse move event listener
function setupMouseInteraction() {
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        targetRotationX = mouseY * 0.5;
        targetRotationY = mouseX * 0.5;
    });
}

// Scroll event listener
function setupScrollInteraction() {
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = Math.min(scrollTop / maxScroll, 1);
        
        // Stop spinning when scrolling starts
        if (scrollProgress > 0.05) {
            isSpinning = false;
        } else {
            isSpinning = true;
        }
    });
}

// Handle window resize
function setupWindowResize(camera, renderer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Apply mouse interaction to camera
function applyMouseInteraction(camera) {
    camera.position.x += (targetRotationY - camera.position.x) * 0.05;
    camera.position.y += (targetRotationX - camera.position.y) * 0.05;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}
