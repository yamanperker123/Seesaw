// variables
let objects = [];
let angle = 0;
let leftWeight = 0, rightWeight = 0;
let leftTorque = 0, rightTorque = 0;
let nextW = Math.floor(Math.random() * 10) + 1;
let clicking = false;

// constants
const BAR_W = 400;
const MAX_POS = 200;  //right
const MIN_POS = -200; //left

//generate weight
function randomWeight() {
    return Math.floor(Math.random() * 10) + 1;
}

//check righht or left
function isLeft(pos) {
    return pos < 0;
}

// console log
function log(msg) {
    document.querySelector('.console_log').innerHTML += msg + '<br>';
    console.log(msg);
}

// rotate the seesaw bar
function rotateSeesaw(newAngle) {
    const bar = document.querySelector('.bar');
    bar.style.transform = `translateX(-50%) rotate(${newAngle}deg)`;
}

// check if two rectangles overlap
function checkOverlap(rect1, rect2) {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y);
}

function getBounds(el) {
    const rect = el.getBoundingClientRect();
    const container = document.querySelector('.seesaw_container');
    const cRect = container.getBoundingClientRect();
    
    return {
        x: rect.left - cRect.left,
        y: rect.top - cRect.top,
        width: rect.width,
        height: rect.height
    };
}

// watch for collision while falling
function watchCollision(fallingEl, data) {
    function check() {
        const objBounds = getBounds(fallingEl);
        const barBounds = getBounds(document.querySelector('.bar'));
        
        if (checkOverlap(objBounds, barBounds)) {
            // hit the bar!
            fallingEl.style.animation = 'none';
            document.querySelector('.seesaw_container').removeChild(fallingEl);
            addToBar(data);
            recalculate();
            saveToStorage();
            return;
        }
        
        if (fallingEl.parentNode) {
            requestAnimationFrame(check);
        }
    }
    requestAnimationFrame(check);
}

// make a falling object
function makeFallingObj(data) {
    const div = document.createElement('div');
    div.className = 'seesaw-object falling';
    div.textContent = data.weight + 'kg';
    div.style.backgroundColor = getColor(data.weight);
    
    const container = document.querySelector('.seesaw_container');
    const centerX = container.offsetWidth / 2;
    
    div.style.left = (centerX + data.position - 20) + 'px';
    div.style.top = '0px';
    div.style.animation = 'fallDown 2s linear forwards';
    
    container.appendChild(div);
    watchCollision(div, data);
    
    // backup in case collision fails
    setTimeout(() => {
        if (container.contains(div)) {
            div.style.animation = 'none';
            container.removeChild(div);
            addToBar(data);
            recalculate();
            saveToStorage();
        }
    }, 2000);
    
    return div;
}

function getColor(weight) {
    const intensity = weight / 10;
    const blue = Math.floor(100 + (155 * intensity));
    return `rgb(50, 150, ${blue})`;
}

// add object to the bar 
function addToBar(data) {
    const div = document.createElement('div');
    div.className = 'seesaw-object';
    div.textContent = data.weight + 'kg';
    div.style.backgroundColor = getColor(data.weight);
    
    const bar = document.querySelector('.bar');
    div.style.left = (200 + data.position - 20) + 'px';
    div.style.top = '-50px';
    
    bar.appendChild(div);
    data.element = div;
}

// clean up objects from bar
function clearObjects() {
    const bar = document.querySelector('.bar');
    const existing = bar.querySelectorAll('.seesaw-object');
    existing.forEach(obj => obj.remove());
}

// recreate all objects after loading
function recreateObjects() {
    clearObjects();
    
    objects.forEach(data => {
        if (data.element) data.element = null;
        addToBar(data);
    });
    
    if (angle !== 0) {
        document.querySelector('.bar').style.transform = `translateX(-50%) rotate(${angle}deg)`;
    }
}

// convert click position to seesaw coordinate
function getPosition(clickX, clickEl) {
    const rect = clickEl.getBoundingClientRect();
    const relativeX = clickX - rect.left;
    return relativeX - (BAR_W / 2);
}

// play sound when clicked
function playSound() {
    try {
        const audio = new Audio('assets/water-drip-45622.mp3');
        audio.volume = 0.1;
        audio.play().catch(e => console.log('sound failed:', e));
    } catch (error) {
        console.log('audio error:', error);
    }
}

// handle clicks on the seesaw
function onClick(e) {
    if (clicking) return; // prevent spam clicking
    
    const pos = getPosition(e.clientX, e.target);
    const weight = nextW;
    
    if (pos < MIN_POS || pos > MAX_POS) {
        log('Click outside range!');
        return;
    }
    
    playSound();
    
    clicking = true;
    setTimeout(() => clicking = false, 1000); //1sec cooldown
    
    const obj = {
        weight: weight,
        position: pos,
        element: null
    };
    
    objects.push(obj);
    makeFallingObj(obj);
    
    nextW = randomWeight();
    updateDisplay();
    
    const side = isLeft(pos) ? 'LEFT' : 'RIGHT';
    const dist = Math.abs(pos);
    log(`${weight}kg dropped on ${side}, ${dist.toFixed(1)}px from center`);
}

// torque calc
function recalculate() {
    leftTorque = 0;
    rightTorque = 0;
    leftWeight = 0;
    rightWeight = 0;
    
    objects.forEach(obj => {
        const torque = Math.abs(obj.position) * obj.weight;
        
        if (isLeft(obj.position)) {
            leftTorque += torque;
            leftWeight += obj.weight;
        } else {
            rightTorque += torque;
            rightWeight += obj.weight;
        }
    });
    
    // calculate new angle
    const newAngle = Math.max(-30, Math.min(30, (rightTorque - leftTorque) / 10));
    
    if (Math.abs(newAngle - angle) > 0.1) {
        angle = newAngle;
        rotateSeesaw(newAngle);
    }
    
    updateDisplay();
}

// update UI displays
function updateDisplay() {
    document.querySelector('.options .item:nth-child(1) .value').textContent = nextW.toFixed(1) + ' kg';
    document.querySelector('.options .item:nth-child(2) .value').textContent = leftWeight.toFixed(1) + ' kg';
    document.querySelector('.options .item:nth-child(3) .value').textContent = rightWeight.toFixed(1) + ' kg';
    document.querySelector('.options .item:nth-child(4) .value').textContent = angle.toFixed(1) + ' degree'; 
}

// save current state
function saveToStorage() {
    try {
        const state = {
            objects: objects.map(obj => ({
                weight: obj.weight,
                position: obj.position
            })),
            angle: angle,
            leftTorque: leftTorque,
            rightTorque: rightTorque,
            leftWeight: leftWeight,
            rightWeight: rightWeight,
            nextW: nextW
        };
        
        localStorage.setItem('seesawState', JSON.stringify(state));
    } catch (error) {
        log('Save failed: ' + error.message);
    }
}

// load saved state
function loadFromStorage() {
    try {
        const saved = localStorage.getItem('seesawState');
        if (saved) {
            const state = JSON.parse(saved);
            
            objects = state.objects || [];
            angle = state.angle || 0;
            leftTorque = state.leftTorque || 0;
            rightTorque = state.rightTorque || 0;
            leftWeight = state.leftWeight || 0;
            rightWeight = state.rightWeight || 0;
            nextW = state.nextW || randomWeight();
            
            recreateObjects();
        }
    } catch (error) {
        log('Load failed: ' + error.message);
        reset();
    }
}

// reset everything
function reset() {
    objects = [];
    angle = 0;
    leftTorque = 0;
    rightTorque = 0;
    leftWeight = 0;
    rightWeight = 0;
    nextW = randomWeight();
    
    clearObjects();
    
    document.querySelector('.bar').style.transform = 'translateX(-50%) rotate(0deg)';
    localStorage.removeItem('seesawState');
    document.querySelector('.console_log').innerHTML = '';
    
    updateDisplay();
}

// start
function start() {
    document.querySelector('.clickable').addEventListener('click', onClick);
    document.querySelector('#reset').addEventListener('click', reset);
    
    loadFromStorage();
    updateDisplay();
}

document.addEventListener('DOMContentLoaded', start);

// debug function for testing
function testObj(pos, weight) {
    const obj = {
        weight: weight,
        position: pos,
        element: null
    };
    
    objects.push(obj);
    makeFallingObj(obj);
    
    return obj;
}