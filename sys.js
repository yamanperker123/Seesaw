// ==================== Data ====================

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

// Global değişken - bir sonraki ağırlık ve cooldown
let nextWeight = generateRandomWeight();
let isClickCooldown = false; // Cooldown durumu

// ==================== Auxiliary func ====================

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

// ==================== Animation  ====================

function animateSeesawRotation(newAngle) {
    const barElement = document.querySelector('.bar');
    
    // Bar için CSS transition ve rotasyon - POZÄ°SYONU KORUYARAK
    barElement.style.transition = 'transform 0.8s ease-out';
    barElement.style.transformOrigin = 'center bottom'; // Alt merkez = pivot noktası
    barElement.style.transform = `translateX(-50%) rotate(${newAngle}deg)`; // Merkez + döndürme
    
    // Objeler bar içinde olduğu için otomatik olarak birlikte dönecek!
    
    logToConsole(`Seesaw ${newAngle.toFixed(1)}° eğildi`);
}

function rotateObjectsWithBar(angle) {
    seesawState.objects.forEach(obj => {
        if (obj.element) {
            obj.element.style.transition = 'transform 0.8s ease-out';
            // Objelerin pivot noktası da bar'ın pivot noktası ile aynı olmalı
            // Bar'ın alt merkezine göre döndürme
            const objRect = obj.element.getBoundingClientRect();
            const barElement = document.querySelector('.bar');
            const barRect = barElement.getBoundingClientRect();
            
            // Bar'ın alt merkez noktasına göre transform-origin ayarla
            const barBottomCenterX = barRect.left + barRect.width / 2;
            const barBottomY = barRect.bottom;
            const objCenterX = objRect.left + objRect.width / 2;
            const objCenterY = objRect.top + objRect.height / 2;
            
            // Relatif pozisyon hesapla
            const relativeX = objCenterX - barBottomCenterX;
            const relativeY = objCenterY - barBottomY;
            
            obj.element.style.transformOrigin = `${-relativeX}px ${-relativeY}px`;
            obj.element.style.transform = `rotate(${angle}deg)`;
        }
    });
}

// ==================== Collision Detection ====================

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
    
    // Container'a göre relatif pozisyon
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
            
            handleCollision(fallingElement, objData);
            return; 
        }
        
        // check object if it is falling or not
        if (fallingElement.parentNode) {
            requestAnimationFrame(checkCollision);
        }
    };
    
   
    requestAnimationFrame(checkCollision);
}

function handleCollision(fallingElement, objData) {
    // Stop and remove object
    fallingElement.style.animation = 'none';
    
    // Remove from Container
    const container = document.querySelector('.seesaw_container');
    if (container.contains(fallingElement)) {
        container.removeChild(fallingElement);
    }
    
    //stick to bar
    createVisualObjectOnBar(objData);
    
    // update Seesaw
    updateSeesaw();
    saveState();
    
    logToConsole('Obje bara çarptı ve yapıştı!');
}

// ==================== Falling animation ====================

function createFallingObject(objData) {
    // Düşecek objeyi oluştur
    const circle = document.createElement('div');
    circle.className = 'seesaw-object falling';
    
    // Ağırlık etiketi
    circle.textContent = objData.weight + 'kg';
    
    // Sadece dinamik stiller (renk ve pozisyon)
    circle.style.backgroundColor = getObjectColor(objData.weight);
    
    // Container'a ekle (düşme sırasında)
    const seesawContainer = document.querySelector('.seesaw_container');
    const containerWidth = seesawContainer.offsetWidth;
    const containerCenter = containerWidth / 2;
    
    // Container TEPESINDEN başla
    const startX = containerCenter + objData.position - 20;
    const startY = 0; // Container tepesinden
    
    circle.style.left = startX + 'px';
    circle.style.top = startY + 'px';
    
    // UZUN animasyon - collision detection için yeterli zaman
    circle.style.animation = 'fallDown 2.0s linear forwards';
    
    // Container'a ekle
    seesawContainer.appendChild(circle);
    
    // COLLISION DETECTION başlat
    startCollisionDetection(circle, objData);
    
    // Backup timeout (eğer collision detection başarısız olursa)
    setTimeout(() => {
        if (seesawContainer.contains(circle)) {
            handleCollision(circle, objData);
        }
    }, 2000); // 2 saniye backup
    
    return circle;
}

function createVisualObjectOnBar(objData) {
    // Bar üzerinde kalıcı obje oluştur
    const circle = document.createElement('div');
    circle.className = 'seesaw-object';
    
    // Ağırlık etiketi
    circle.textContent = objData.weight + 'kg';
    
    // Sadece dinamik stiller (renk ve pozisyon)
    circle.style.backgroundColor = getObjectColor(objData.weight);
    
    // Bar üzerindeki pozisyon
    const barCenter = 200;
    const objectX = barCenter + objData.position - 20;
    const objectY = -50;
    
    circle.style.left = objectX + 'px';
    circle.style.top = objectY + 'px';
    
    // Bar element'ine ekle
    const barElement = document.querySelector('.bar');
    barElement.appendChild(circle);
    
    // Obje datasına element referansını ekle
    objData.element = circle;
    
    return circle;
}

// ==================== GÃ–RSEL OBJE FONKSÄ°YONLARI ====================

function createVisualObject(objData) {
    // Daire elementi oluştur
    const circle = document.createElement('div');
    circle.className = 'seesaw-object';
    
    // Ağırlık etiketi
    circle.textContent = objData.weight + 'kg';
    
    // Sadece dinamik stiller (renk ve pozisyon)
    circle.style.backgroundColor = getObjectColor(objData.weight);
    
    // OBJEYI BAR ELEMENT'Ä°NE EKLEYELİM - böylece bar ile birlikte hareket eder
    const barElement = document.querySelector('.bar');
    
    // Bar üzerindeki pozisyon (bar merkezi = 0, sol -, sağ +)
    const barCenter = 200; // Bar genişliği 400px, merkezi 200px
    const objectX = barCenter + objData.position - 20; // -20 merkezleme
    const objectY = -50; // Bar'ın üstünde
    
    circle.style.left = objectX + 'px';
    circle.style.top = objectY + 'px';
    
    // BAR ELEMENT'İNE ekle (container'a değil)
    barElement.appendChild(circle);
    
    // Obje datasına element referansını ekle
    objData.element = circle;
    
    logToConsole(`Obje oluşturuldu: pos=${objData.position}, x=${objectX}`);
    
    return circle;
}

function getObjectColor(weight) {
    // Ağırlığa göre renk - açık mavi'den koyu mavi'ye
    const intensity = weight / CONSTANTS.MAX_WEIGHT;
    const blue = Math.floor(100 + (155 * intensity)); // 100-255 arası
    return `rgb(50, 150, ${blue})`;
}

function removeAllVisualObjects() {
    // Bar içindeki objeleri temizle
    const barElement = document.querySelector('.bar');
    const existingObjects = barElement.querySelectorAll('.seesaw-object');
    existingObjects.forEach(obj => obj.remove());
}

function recreateAllVisualObjects() {
    // Önce mevcut görsel objeleri temizle
    removeAllVisualObjects();
    
    // Sonra her obje için yeniden oluştur
    seesawState.objects.forEach(objData => {
        if (objData.element) {
            objData.element = null; // Referansı temizle
        }
        createVisualObject(objData);
    });
    
    // Bar zaten doğru açıda döndürülecek, objeler de birlikte dönecek
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

function handleClickableClick(event) {
    // COOLDOWN kontrolü
    if (isClickCooldown) {
        logToConsole('Çok hızlı tıklıyorsun! 1 saniye bekle.');
        return;
    }
    
    const clickableElement = event.target;
    const clickPosition = convertClickToPosition(event.clientX, clickableElement);
    
    // Mevcut nextWeight'i kullan
    const currentWeight = nextWeight;
    
    if (clickPosition < CONSTANTS.MIN_POSITION || clickPosition > CONSTANTS.MAX_POSITION) {
        logToConsole('Tıklama alanı dışında!');
        return;
    }
    
    // COOLDOWN başlat
    isClickCooldown = true;
    setTimeout(() => {
        isClickCooldown = false;
        logToConsole('Tekrar tıklayabilirsin!');
    }, 1000); // 1 saniye
    
    const newObject = addObject(clickPosition, currentWeight);
    
    // DÜŞME ANIMASYONU ile görsel obje oluştur
    createFallingObject(newObject);
    
    // Yeni ağırlık üret
    nextWeight = generateRandomWeight();
    updateUI();
    
    logToConsole(`${currentWeight}kg obje düşürüldü (pozisyon: ${clickPosition.toFixed(1)})`);
}

// ==================== OBJE YÃ–NETÄ°MÄ° ====================

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
    
    logToConsole(`Sol: ${seesawState.leftWeight}kg (torque: ${seesawState.leftTorque})`);
    logToConsole(`Sağ: ${seesawState.rightWeight}kg (torque: ${seesawState.rightTorque})`);
}

function calculateNewAngle() {
    // PDF'teki örnek formül: Math.max(-30, Math.min(30, (rightTorque - leftTorque) / 10))
    const angle = Math.max(-30, Math.min(30, (seesawState.rightTorque - seesawState.leftTorque) / 10));
    return angle;
}

function updateSeesaw() {
    updateTorqueAndWeights();
    
    // Yeni açıyı hesapla
    const newAngle = calculateNewAngle();
    
    // Açı değiştiyse animasyon yap
    if (Math.abs(newAngle - seesawState.currentAngle) > 0.1) {
        seesawState.currentAngle = newAngle;
        animateSeesawRotation(newAngle);
    }
    
    updateUI();
}

// ==================== UI GÃœNCELLEMELERÄ° ====================

function updateUI() {
    document.querySelector('.options .item:nth-child(1) .value').textContent = nextWeight.toFixed(1) + ' kg';
    document.querySelector('.options .item:nth-child(2) .value').textContent = seesawState.leftWeight.toFixed(1) + ' kg';
    document.querySelector('.options .item:nth-child(3) .value').textContent = seesawState.rightWeight.toFixed(1) + ' kg';
    
    const newAngle = calculateNewAngle();
    seesawState.currentAngle = newAngle;
    document.querySelector('.options .item:nth-child(4) .value').textContent = newAngle.toFixed(1) + ' degre';
}

// ==================== LOCAL STORAGE Ä°ÅžLEMLERÄ° ====================

function saveState() {
    try {
        const stateToSave = {
            objects: seesawState.objects.map(obj => ({
                weight: obj.weight,
                position: obj.position
                // element'i kaydetmiyoruz çünkü DOM objesi
            })),
            currentAngle: seesawState.currentAngle,
            leftTorque: seesawState.leftTorque,
            rightTorque: seesawState.rightTorque,
            leftWeight: seesawState.leftWeight,
            rightWeight: seesawState.rightWeight,
            nextWeight: nextWeight
        };
        
        localStorage.setItem('seesawState', JSON.stringify(stateToSave));
        logToConsole('Durum kaydedildi!');
    } catch (error) {
        logToConsole('Kaydetme hatası: ' + error.message);
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
            
            // Görsel objeleri yeniden oluştur
            recreateAllVisualObjects();
            
            logToConsole('Önceki durum yüklendi: ' + seesawState.objects.length + ' obje bulundu');
        } else {
            logToConsole('Yeni seesaw başlatıldı');
        }
    } catch (error) {
        logToConsole('Yükleme hatası: ' + error.message);
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
    
    // Görsel objeleri temizle
    removeAllVisualObjects();
    
    // Bar'ı düz konuma getir
    const barElement = document.querySelector('.bar');
    barElement.style.transition = 'transform 0.8s ease-out';
    barElement.style.transformOrigin = 'center bottom'; // Pivot noktası
    barElement.style.transform = 'translateX(-50%) rotate(0deg)'; // Merkez + düz
    
    localStorage.removeItem('seesawState');
    document.querySelector('.console_log').innerHTML = '';
    
    logToConsole('Seesaw sıfırlandı!');
    updateUI();
}

// ==================== TEST FONKSÄ°YONLARI ====================

function addTestObject(position, weight) {
    const newObject = {
        weight: weight,
        position: position,
        element: null
    };
    
    seesawState.objects.push(newObject);
    createFallingObject(newObject); // Animasyonlu ekle
    logToConsole(`Test objesi düşürüldü: ${weight}kg, pozisyon: ${position}`);
    
    return newObject;
}

// ==================== BAÅžLATMA ====================

function initializeSeesaw() {
    logToConsole('Seesaw başlatılıyor...');
    
    const clickableElement = document.querySelector('.clickable');
    clickableElement.addEventListener('click', handleClickableClick);
    
    const resetButton = document.querySelector('#reset');
    resetButton.addEventListener('click', resetSeesaw);
    
    loadState();
    updateUI();
    
    logToConsole('Hazır! Yeşil alana tıklayarak obje ekleyebilirsin!');
    logToConsole('Tıklama cooldown: 1 saniye (devamlı spam engelleme)');
    logToConsole('Test için console\'da şunları deneyebilirsin:');
    logToConsole('addTestObject(-100, 5) // Sol tarafa 5kg obje');
    logToConsole('addTestObject(150, 3)  // Sağ tarafa 3kg obje');
}

document.addEventListener('DOMContentLoaded', initializeSeesaw);