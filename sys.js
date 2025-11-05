// ==================== DATA STRUCTURE ====================

const seesawState = {
    objects: [],        
    currentAngle: 0,    
    leftTorque: 0,     
    rightTorque: 0,     
    leftWeight: 0,      
    rightWeight: 0      
};

const CONSTANTS = {
    BAR_WIDTH: 400,
    MAX_POSITION: 200,    
    MIN_POSITION: -200,   
    MAX_ANGLE: 30,
    MIN_WEIGHT: 1,
    MAX_WEIGHT: 10,
    TORQUE_SENSITIVITY: 10
};

// Global variable - next weight and cooldown
let nextWeight = generateRandomWeight();
let isClickCooldown = false; // Cooldown state

// ==================== HELPER FUNCTIONS ====================

function generateRandomWeight() {
    return Math.floor(Math.random() * CONSTANTS.MAX_WEIGHT) + CONSTANTS.MIN_WEIGHT;
}

function isLeftSide(position) {
    return position < 0;
}

function logToConsole(message) {
    const consoleElement = document.querySelector('.console_log');
    consoleElement.innerHTML += message + '<br>';
    console.log(message); 
}

// ==================== ANIMATION FUNCTIONS ====================

function animateSeesawRotation(newAngle) {
    const barElement = document.querySelector('.bar');
    
    // CSS transition and rotation for bar - PRESERVING POSITION
    barElement.style.transition = 'transform 0.8s ease-out';
    barElement.style.transformOrigin = 'center bottom'; // Bottom center = pivot point
    barElement.style.transform = `translateX(-50%) rotate(${newAngle}deg)`; // Center + rotation
    
    // Objects inside bar will automatically rotate together!
    
    logToConsole(`Seesaw tilted ${newAngle.toFixed(1)}°`);
}

function rotateObjectsWithBar(angle) {
    seesawState.objects.forEach(obj => {
        if (obj.element) {
            obj.element.style.transition = 'transform 0.8s ease-out';
            // Object pivot point should be same as bar's pivot point
            // Rotation relative to bar's bottom center
            const objRect = obj.element.getBoundingClientRect();
            const barElement = document.querySelector('.bar');
            const barRect = barElement.getBoundingClientRect();
            
            // Set transform-origin relative to bar's bottom center point
            const barBottomCenterX = barRect.left + barRect.width / 2;
            const barBottomY = barRect.bottom;
            const objCenterX = objRect.left + objRect.width / 2;
            const objCenterY = objRect.top + objRect.height / 2;
            
            // Calculate relative position
            const relativeX = objCenterX - barBottomCenterX;
            const relativeY = objCenterY - barBottomY;
            
            obj.element.style.transformOrigin = `${-relativeX}px ${-relativeY}px`;
            obj.element.style.transform = `rotate(${angle}deg)`;
        }
    });
}

// ==================== COLLISION DETECTION ====================

function isCollide(a, b) {
    return !(
        ((a.y + a.height) < (b.y)) ||
        (a.y > (b.y + b.height)) ||
        ((a.x + a.width) < b.x) ||
        (a.x > (b.x + b.width))
    );
}

function getElementBounds(element) {
    const rect = element.getBoundingClientRect();
    const container = document.querySelector('.seesaw_container');
    const containerRect = container.getBoundingClientRect();
    
    // Relative position to container
    return {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
    };
}

function getBarBounds() {
    const barElement = document.querySelector('.bar');
    return getElementBounds(barElement);
}

function startCollisionDetection(fallingElement, objData) {
    const checkCollision = () => {
        const objectBounds = getElementBounds(fallingElement);
        const barBounds = getBarBounds();
        
        if (isCollide(objectBounds, barBounds)) {
            // COLLISION DETECTED!
            handleCollision(fallingElement, objData);
            return; // Stop animation
        }
        
        // Check if object is still falling
        if (fallingElement.parentNode) {
            requestAnimationFrame(checkCollision);
        }
    };
    
    // First check
    requestAnimationFrame(checkCollision);
}

function handleCollision(fallingElement, objData) {
    // Stop falling object and remove it
    fallingElement.style.animation = 'none';
    
    // Remove from container
    const container = document.querySelector('.seesaw_container');
    if (container.contains(fallingElement)) {
        container.removeChild(fallingElement);
    }
    
    // Add permanently to bar
    createVisualObjectOnBar(objData);
    
    // Update seesaw
    updateSeesaw();
    saveState();
    
    logToConsole('Object hit the bar and attached!');
}

// ==================== FALLING ANIMATION ====================

function createFallingObject(objData) {
    // Create falling object
    const circle = document.createElement('div');
    circle.className = 'seesaw-object falling';
    
    // Weight label
    circle.textContent = objData.weight + 'kg';
    
    // Only dynamic styles (color and position)
    circle.style.backgroundColor = getObjectColor(objData.weight);
    
    // Add to container (during falling)
    const seesawContainer = document.querySelector('.seesaw_container');
    const containerWidth = seesawContainer.offsetWidth;
    const containerCenter = containerWidth / 2;
    
    // Start from TOP of container
    const startX = containerCenter + objData.position - 20;
    const startY = 0; // From container top
    
    circle.style.left = startX + 'px';
    circle.style.top = startY + 'px';
    
    // LONG animation - enough time for collision detection
    circle.style.animation = 'fallDown 2.0s linear forwards';
    
    // Add to container
    seesawContainer.appendChild(circle);
    
    // Start COLLISION DETECTION
    startCollisionDetection(circle, objData);
    
    // Backup timeout (if collision detection fails)
    setTimeout(() => {
        if (seesawContainer.contains(circle)) {
            handleCollision(circle, objData);
        }
    }, 2000); // 2 second backup
    
    return circle;
}

function createVisualObjectOnBar(objData) {
    // Create permanent object on bar
    const circle = document.createElement('div');
    circle.className = 'seesaw-object';
    
    // Weight label
    circle.textContent = objData.weight + 'kg';
    
    // Only dynamic styles (color and position)
    circle.style.backgroundColor = getObjectColor(objData.weight);
    
    // Position on bar
    const barCenter = 200;
    const objectX = barCenter + objData.position - 20;
    const objectY = -50;
    
    circle.style.left = objectX + 'px';
    circle.style.top = objectY + 'px';
    
    // Add to bar element
    const barElement = document.querySelector('.bar');
    barElement.appendChild(circle);
    
    // Add element reference to object data
    objData.element = circle;
    
    return circle;
}

// ==================== VISUAL OBJECT FUNCTIONS ====================

function createVisualObject(objData) {
    // Create circle element
    const circle = document.createElement('div');
    circle.className = 'seesaw-object';
    
    // Weight label
    circle.textContent = objData.weight + 'kg';
    
    // Only dynamic styles (color and position)
    circle.style.backgroundColor = getObjectColor(objData.weight);
    
    // ADD OBJECT TO BAR ELEMENT - so it moves together with bar
    const barElement = document.querySelector('.bar');
    
    // Position on bar (bar center = 0, left -, right +)
    const barCenter = 200; // Bar width 400px, center 200px
    const objectX = barCenter + objData.position - 20; // -20 for centering
    const objectY = -50; // Above the bar
    
    circle.style.left = objectX + 'px';
    circle.style.top = objectY + 'px';
    
    // Add to BAR ELEMENT (not container)
    barElement.appendChild(circle);
    
    // Add element reference to object data
    objData.element = circle;
    
    logToConsole(`Object created: pos=${objData.position}, x=${objectX}`);
    
    return circle;
}

function getObjectColor(weight) {
    // Color based on weight - light blue to dark blue
    const intensity = weight / CONSTANTS.MAX_WEIGHT;
    const blue = Math.floor(100 + (155 * intensity)); // 100-255 range
    return `rgb(50, 150, ${blue})`;
}

function removeAllVisualObjects() {
    // Clean objects inside bar
    const barElement = document.querySelector('.bar');
    const existingObjects = barElement.querySelectorAll('.seesaw-object');
    existingObjects.forEach(obj => obj.remove());
}

function recreateAllVisualObjects() {
    // First clean existing visual objects
    removeAllVisualObjects();
    
    // Then recreate for each object
    seesawState.objects.forEach(objData => {
        if (objData.element) {
            objData.element = null; // Clear reference
        }
        createVisualObject(objData);
    });
    
    // Bar will already be rotated at correct angle, objects will rotate together
    if (seesawState.currentAngle !== 0) {
        const barElement = document.querySelector('.bar');
        barElement.style.transform = `translateX(-50%) rotate(${seesawState.currentAngle}deg)`;
        barElement.style.transformOrigin = 'center bottom';
    }
}

// ==================== EVENT HANDLING ====================

function convertClickToPosition(clickX, clickableElement) {
    const clickableRect = clickableElement.getBoundingClientRect();
    const relativeX = clickX - clickableRect.left; 
    return relativeX - (CONSTANTS.BAR_WIDTH / 2); 
}

function playDropSound() {
    try {
        const audio = new Audio('assets/water-drip-45622.mp3');
        audio.volume = 0.1; // Set volume to 30%
        audio.play().catch(error => {
            console.log('Audio play failed:', error);
        });
    } catch (error) {
        console.log('Audio creation failed:', error);
    }
}

function handleClickableClick(event) {
    // COOLDOWN check
    if (isClickCooldown) {
        logToConsole('Clicking too fast! Wait 1 second.');
        return;
    }
    
    const clickableElement = event.target;
    const clickPosition = convertClickToPosition(event.clientX, clickableElement);
    
    // Create click effect at mouse position
    createClickEffect(event.clientX, event.clientY);
    
    // Use current nextWeight
    const currentWeight = nextWeight;
    
    if (clickPosition < CONSTANTS.MIN_POSITION || clickPosition > CONSTANTS.MAX_POSITION) {
        logToConsole('Click outside allowed area!');
        return;
    }
    
    // Play drop sound effect
    playDropSound();
    
    // Start COOLDOWN
    isClickCooldown = true;
    setTimeout(() => {
        isClickCooldown = false;
        logToConsole('You can click again!');
    }, 1000); // 1 second
    
    const newObject = addObject(clickPosition, currentWeight);
    
    // Create visual object with FALLING ANIMATION
    createFallingObject(newObject);
    
    // Generate new weight
    nextWeight = generateRandomWeight();
    updateUI();
    
    logToConsole(`${currentWeight}kg object dropped (position: ${clickPosition.toFixed(1)})`);
}

function createClickEffect(x, y) {
    // Create click effect element
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    
    // Position at click coordinates (relative to viewport)
    effect.style.left = (x - 10) + 'px'; // -10 to center the 20px circle
    effect.style.top = (y - 10) + 'px';
    effect.style.position = 'fixed'; // Use fixed positioning relative to viewport
    
    // Add to body
    document.body.appendChild(effect);
    
    // Remove after animation completes
    setTimeout(() => {
        if (document.body.contains(effect)) {
            document.body.removeChild(effect);
        }
    }, 600); // Match animation duration
}

// ==================== OBJECT MANAGEMENT ====================

function addObject(position, weight) {
    const newObject = {
        weight: weight,
        position: position,
        element: null
    };
    
    seesawState.objects.push(newObject);
    return newObject;
}

function updateTorqueAndWeights() {
    seesawState.leftTorque = 0;
    seesawState.rightTorque = 0;
    seesawState.leftWeight = 0;
    seesawState.rightWeight = 0;
    
    seesawState.objects.forEach(obj => {
        const torque = Math.abs(obj.position) * obj.weight;
        
        if (isLeftSide(obj.position)) {
            seesawState.leftTorque += torque;
            seesawState.leftWeight += obj.weight;
        } else {
            seesawState.rightTorque += torque;
            seesawState.rightWeight += obj.weight;
        }
    });
    
    logToConsole(`Left: ${seesawState.leftWeight}kg (torque: ${seesawState.leftTorque})`);
    logToConsole(`Right: ${seesawState.rightWeight}kg (torque: ${seesawState.rightTorque})`);
}

function calculateNewAngle() {
    // Formula from PDF: Math.max(-30, Math.min(30, (rightTorque - leftTorque) / 10))
    const angle = Math.max(-30, Math.min(30, (seesawState.rightTorque - seesawState.leftTorque) / 10));
    return angle;
}

function updateSeesaw() {
    updateTorqueAndWeights();
    
    // Calculate new angle
    const newAngle = calculateNewAngle();
    
    // If angle changed, animate
    if (Math.abs(newAngle - seesawState.currentAngle) > 0.1) {
        seesawState.currentAngle = newAngle;
        animateSeesawRotation(newAngle);
    }
    
    updateUI();
}

// ==================== UI UPDATES ====================

function updateUI() {
    document.querySelector('.options .item:nth-child(1) .value').textContent = nextWeight.toFixed(1) + ' kg';
    document.querySelector('.options .item:nth-child(2) .value').textContent = seesawState.leftWeight.toFixed(1) + ' kg';
    document.querySelector('.options .item:nth-child(3) .value').textContent = seesawState.rightWeight.toFixed(1) + ' kg';
    
    const newAngle = calculateNewAngle();
    seesawState.currentAngle = newAngle;
    document.querySelector('.options .item:nth-child(4) .value').textContent = newAngle.toFixed(1) + ' degre';
}

// ==================== LOCAL STORAGE OPERATIONS ====================

function saveState() {
    try {
        const stateToSave = {
            objects: seesawState.objects.map(obj => ({
                weight: obj.weight,
                position: obj.position
                // not saving element because it's DOM object
            })),
            currentAngle: seesawState.currentAngle,
            leftTorque: seesawState.leftTorque,
            rightTorque: seesawState.rightTorque,
            leftWeight: seesawState.leftWeight,
            rightWeight: seesawState.rightWeight,
            nextWeight: nextWeight
        };
        
        localStorage.setItem('seesawState', JSON.stringify(stateToSave));
        logToConsole('State saved!');
    } catch (error) {
        logToConsole('Save error: ' + error.message);
    }
}

function loadState() {
    try {
        const savedState = localStorage.getItem('seesawState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            seesawState.objects = parsedState.objects || [];
            seesawState.currentAngle = parsedState.currentAngle || 0;
            seesawState.leftTorque = parsedState.leftTorque || 0;
            seesawState.rightTorque = parsedState.rightTorque || 0;
            seesawState.leftWeight = parsedState.leftWeight || 0;
            seesawState.rightWeight = parsedState.rightWeight || 0;
            nextWeight = parsedState.nextWeight || generateRandomWeight();
            
            // Recreate visual objects
            recreateAllVisualObjects();
            
            logToConsole('Previous state loaded: ' + seesawState.objects.length + ' objects found');
        } else {
            logToConsole('New seesaw started');
        }
    } catch (error) {
        logToConsole('Load error: ' + error.message);
        resetSeesaw();
    }
}

function resetSeesaw() {
    seesawState.objects = [];
    seesawState.currentAngle = 0;
    seesawState.leftTorque = 0;
    seesawState.rightTorque = 0;
    seesawState.leftWeight = 0;
    seesawState.rightWeight = 0;
    nextWeight = generateRandomWeight();
    
    // Clean visual objects
    removeAllVisualObjects();
    
    // Return bar to flat position
    const barElement = document.querySelector('.bar');
    barElement.style.transition = 'transform 0.8s ease-out';
    barElement.style.transformOrigin = 'center bottom'; // Pivot point
    barElement.style.transform = 'translateX(-50%) rotate(0deg)'; // Center + flat
    
    localStorage.removeItem('seesawState');
    document.querySelector('.console_log').innerHTML = '';
    
    logToConsole('Seesaw reset!');
    updateUI();
}

// ==================== TEST FUNCTIONS ====================

function addTestObject(position, weight) {
    const newObject = {
        weight: weight,
        position: position,
        element: null
    };
    
    seesawState.objects.push(newObject);
    createFallingObject(newObject); // Add with animation
    logToConsole(`Test object dropped: ${weight}kg, position: ${position}`);
    
    return newObject;
}

// ==================== INITIALIZATION ====================

function initializeSeesaw() {
    logToConsole('Initializing seesaw...');
    
    const clickableElement = document.querySelector('.clickable');
    clickableElement.addEventListener('click', handleClickableClick);
    
    const resetButton = document.querySelector('#reset');
    resetButton.addEventListener('click', resetSeesaw);
    
    loadState();
    updateUI();
    
    logToConsole('Ready! Click on green area to add objects!');
    logToConsole('Click cooldown: 1 second (prevents spam)');
    logToConsole('For testing, try in console:');
    logToConsole('addTestObject(-100, 5) // 5kg object on left');
    logToConsole('addTestObject(150, 3)  // 3kg object on right');
}

document.addEventListener('DOMContentLoaded', initializeSeesaw);