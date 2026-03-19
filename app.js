// ===== 饿魔 - 科学减脂应用 v2.0 =====

// 配置
const STORAGE_KEY = 'emo_diet_data';
const USER_KEY = 'emo_user';
const USERS_KEY = 'emo_users';
const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/8a4b0195-5aad-4c33-be71-351985af8cbe';

// 碳循环配置
const CARBON_CONFIG = {
    cutting: { high: 200, medium: 150, low: 100, none: 50, protein: 150, fat: 50 },
    maintenance: { high: 250, medium: 200, low: 150, none: 100, protein: 140, fat: 60 },
    bulking: { high: 350, medium: 300, low: 250, none: 200, protein: 160, fat: 70 }
};

// 全局数据
let appData = {
    dietRecords: [],
    bodyRecords: [],
    sleepRecords: [],
    exerciseRecords: [],
    waterRecords: [],
    waterTarget: 2000,
    waterConsumed: 0,
    carbonSettings: { phase: 'cutting', dayType: 'medium' },
    currentUser: null
};

let dataChart = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 加载完成');
    init();
    bindEvents();
});

function init() {
    console.log('初始化开始...');
    loadData();
    checkAuth();
    initChart();
    console.log('初始化完成');
}

function bindEvents() {
    console.log('绑定事件...');
    
    const switchToReg = document.getElementById('switchToReg');
    const switchToLogin = document.getElementById('switchToLogin');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const guestBtn = document.getElementById('guestBtn');
    
    if (switchToReg) switchToReg.addEventListener('click', function() { switchAuthMode('register'); });
    if (switchToLogin) switchToLogin.addEventListener('click', function() { switchAuthMode('login'); });
    if (loginBtn) loginBtn.addEventListener('click', doLogin);
    if (registerBtn) registerBtn.addEventListener('click', doRegister);
    if (guestBtn) guestBtn.addEventListener('click', guestLogin);
    
    console.log('事件绑定完成');
}

// ===== 认证系统 =====
function checkAuth() {
    const user = localStorage.getItem(USER_KEY);
    if (user) {
        appData.currentUser = JSON.parse(user);
        showMainApp();
        updateUI();
    } else {
        showAuthModal();
    }
}

function showAuthModal() {
    const modal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');
    if (modal) modal.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
}

function showMainApp() {
    const modal = document.getElementById('authModal');
    const mainApp = document.getElementById('mainApp');
    if (modal) modal.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (mode === 'login') {
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
    } else {
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
    }
}

function doLogin() {
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    
    if (!email || !password) {
        showError('请填写邮箱和密码');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        appData.currentUser = user;
        showMainApp();
        updateUI();
        showNotification('欢迎回来，' + user.name + '！');
    } else {
        showError('邮箱或密码错误');
    }
}

function doRegister() {
    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');
    const confirmInput = document.getElementById('regConfirmPassword');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmInput ? confirmInput.value : '';
    
    if (!name || !email || !password) {
        showError('请填写完整信息', 'reg');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('两次输入的密码不一致', 'reg');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.email === email)) {
        showError('该邮箱已注册', 'reg');
        return;
    }
    
    const user = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    appData.currentUser = user;
    
    sendToFeishu({ type: '新用户注册', name: name, email: email });
    
    showMainApp();
    updateUI();
    showNotification('注册成功！欢迎，' + name + '！');
}

function guestLogin() {
    const guestUser = {
        id: 'guest_' + Date.now(),
        name: '游客',
        email: 'guest@demo.com',
        isGuest: true
    };
    
    localStorage.setItem(USER_KEY, JSON.stringify(guestUser));
    appData.currentUser = guestUser;
    
    showMainApp();
    updateUI();
    showNotification('欢迎游客！数据仅保存在本地');
}

function logout() {
    localStorage.removeItem(USER_KEY);
    appData.currentUser = null;
    location.reload();
}

function showError(msg, type) {
    const errorEl = type === 'reg' ? document.getElementById('regError') : document.getElementById('authError');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        setTimeout(function() { errorEl.style.display = 'none'; }, 3000);
    }
}

// ===== 飞书通知 =====
function sendToFeishu(data) {
    const text = '新用户注册！\n类型：' + data.type + '\n昵称：' + data.name + '\n邮箱：' + data.email + '\n时间：' + new Date().toLocaleString('zh-CN');
    
    fetch(FEISHU_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            msg_type: 'text',
            content: { text: text }
        })
    }).catch(function(err) { console.log('飞书通知失败:', err); });
}

// ===== 数据管理 =====
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        appData.dietRecords = parsed.dietRecords || [];
        appData.bodyRecords = parsed.bodyRecords || [];
        appData.sleepRecords = parsed.sleepRecords || [];
        appData.exerciseRecords = parsed.exerciseRecords || [];
        appData.waterRecords = parsed.waterRecords || [];
        appData.waterConsumed = parsed.waterConsumed || 0;
        appData.waterTarget = parsed.waterTarget || 2000;
        appData.carbonSettings = parsed.carbonSettings || { phase: 'cutting', dayType: 'medium' };
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// ===== UI 更新 =====
function updateUI() {
    updateTodaySummary();
    updateDietList();
    updateBodyList();
    updateSleepList();
    updateExerciseList();
    updateWaterStatus();
    updateCarbonDisplay();
    updateChart();
}

function updateTodaySummary() {
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(function(r) {
        return new Date(r.time).toDateString() === today;
    });
    
    let totalCalories = 0, totalCarbs = 0, totalProtein = 0, totalFat = 0;
    for (let r of todayRecords) {
        totalCalories += r.calories || 0;
        totalCarbs += r.carbs || 0;
        totalProtein += r.protein || 0;
        totalFat += r.fat || 0;
    }
    
    const caloriesEl = document.getElementById('todayCalories');
    const carbsEl = document.getElementById('todayCarbs');
    const proteinEl = document.getElementById('todayProtein');
    const fatEl = document.getElementById('todayFat');
    
    if (caloriesEl) caloriesEl.textContent = Math.round(totalCalories);
    if (carbsEl) carbsEl.textContent = Math.round(totalCarbs);
    if (proteinEl) proteinEl.textContent = Math.round(totalProtein);
    if (fatEl) fatEl.textContent = Math.round(totalFat);
    
    // 更新反馈
    const feedbackEl = document.getElementById('dailyFeedback');
    if (feedbackEl) {
        const config = CARBON_CONFIG[appData.carbonSettings.phase];
        const dayType = appData.carbonSettings.dayType;
        const targetCarbs = config[dayType];
        
        let hint = '';
        if (totalCarbs < targetCarbs * 0.8) {
            hint = '碳水摄入偏低，可适当增加';
        } else if (totalCarbs > targetCarbs * 1.2) {
            hint = '碳水摄入偏高，注意控制';
        } else {
            hint = '碳水摄入正常，继续保持';
        }
        feedbackEl.textContent = hint;
        feedbackEl.style.display = 'block';
    }
}

// ===== 碳循环 =====
function updateCarbonSettings() {
    const phaseSelect = document.getElementById('carbonPhase');
    const dayTypeSelect = document.getElementById('carbonDayType');
    
    if (phaseSelect) appData.carbonSettings.phase = phaseSelect.value;
    if (dayTypeSelect) appData.carbonSettings.dayType = dayTypeSelect.value;
    
    saveData();
    updateCarbonDisplay();
}

function updateCarbonDisplay() {
    const config = CARBON_CONFIG[appData.carbonSettings.phase];
    const dayType = appData.carbonSettings.dayType;
    
    const targetCarbsEl = document.getElementById('carbonTargetCarbs');
    const targetProteinEl = document.getElementById('carbonTargetProtein');
    const targetFatEl = document.getElementById('carbonTargetFat');
    
    if (targetCarbsEl) targetCarbsEl.innerHTML = config[dayType] + '<span class="unit">g</span>';
    if (targetProteinEl) targetProteinEl.innerHTML = config.protein + '<span class="unit">g</span>';
    if (targetFatEl) targetFatEl.innerHTML = config.fat + '<span class="unit">g</span>';
    
    // 更新进度
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(function(r) {
        return new Date(r.time).toDateString() === today;
    });
    const totalCarbs = todayRecords.reduce((sum, r) => sum + (r.carbs || 0), 0);
    const progress = Math.min(totalCarbs / config[dayType], 1) * 100;
    
    const progressBar = document.getElementById('carbonProgress');
    const progressText = document.getElementById('carbonProgressText');
    
    if (progressBar) progressBar.style.width = progress + '%';
    if (progressText) progressText.textContent = '碳水摄入 ' + Math.round(totalCarbs) + '/' + config[dayType] + 'g';
}

// ===== 饮食记录 =====
function showDietInput(method) {
    document.querySelectorAll('.method-btn').forEach(function(btn) { btn.classList.remove('active'); });
    event.target.classList.add('active');
    
    const manualInput = document.getElementById('manualInput');
    const photoInput = document.getElementById('photoInput');
    
    if (method === 'manual') {
        if (manualInput) manualInput.classList.remove('hidden');
        if (photoInput) photoInput.classList.add('hidden');
    } else {
        if (manualInput) manualInput.classList.add('hidden');
        if (photoInput) photoInput.classList.remove('hidden');
    }
}

function handlePhotoUpload() {
    const input = document.getElementById('foodPhoto');
    const preview = document.getElementById('photoPreview');
    
    if (input && input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (preview) {
                preview.innerHTML = '<img src="' + e.target.result + '" style="max-width:100%;border-radius:var(--radius);">';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function addDietRecord() {
    const nameInput = document.getElementById('foodName');
    const carbsInput = document.getElementById('carbs');
    const proteinInput = document.getElementById('protein');
    const fatInput = document.getElementById('fat');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const carbs = parseFloat(carbsInput ? carbsInput.value : 0) || 0;
    const protein = parseFloat(proteinInput ? proteinInput.value : 0) || 0;
    const fat = parseFloat(fatInput ? fatInput.value : 0) || 0;
    
    if (!name) {
        showNotification('请输入食物名称');
        return;
    }
    
    const calories = carbs * 4 + protein * 4 + fat * 9;
    
    appData.dietRecords.push({
        id: Date.now(),
        name: name,
        carbs: carbs,
        protein: protein,
        fat: fat,
        calories: calories,
        time: new Date().toISOString()
    });
    
    saveData();
    updateUI();
    
    if (nameInput) nameInput.value = '';
    if (carbsInput) carbsInput.value = '';
    if (proteinInput) proteinInput.value = '';
    if (fatInput) fatInput.value = '';
    
    showNotification('记录添加成功！');
}

function updateDietList() {
    const list = document.getElementById('dietList');
    if (!list) return;
    
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(function(r) {
        return new Date(r.time).toDateString() === today;
    }).sort(function(a, b) { return new Date(b.time) - new Date(a.time); });
    
    if (todayRecords.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-5);">今天还没有记录</p>';
        return;
    }
    
    let html = '';
    for (let r of todayRecords) {
        html += '<div class="record-item">' +
            '<div class="record-icon">🍽️</div>' +
            '<div class="record-info">' +
                '<div class="record-title">' + r.name + '</div>' +
                '<div class="record-meta">' + new Date(r.time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) + '</div>' +
            '</div>' +
            '<div class="record-stats">' +
                '<div class="record-calories">' + Math.round(r.calories) + ' kcal</div>' +
                '<div class="record-macros">C:' + Math.round(r.carbs) + ' P:' + Math.round(r.protein) + ' F:' + Math.round(r.fat) + '</div>' +
            '</div>' +
        '</div>';
    }
    list.innerHTML = html;
}

// ===== 身体数据 =====
function addBodyRecord() {
    const weightInput = document.getElementById('bodyWeight');
    const fatInput = document.getElementById('bodyFat');
    const waistInput = document.getElementById('bodyWaist');
    const hipInput = document.getElementById('bodyHip');
    const chestInput = document.getElementById('bodyChest');
    const armInput = document.getElementById('bodyArm');
    const thighInput = document.getElementById('bodyThigh');
    
    const weight = parseFloat(weightInput ? weightInput.value : 0);
    
    if (!weight) {
        showNotification('请输入体重');
        return;
    }
    
    appData.bodyRecords.push({
        id: Date.now(),
        weight: weight,
        fat: parseFloat(fatInput ? fatInput.value : 0) || null,
        waist: parseFloat(waistInput ? waistInput.value : 0) || null,
        hip: parseFloat(hipInput ? hipInput.value : 0) || null,
        chest: parseFloat(chestInput ? chestInput.value : 0) || null,
        arm: parseFloat(armInput ? armInput.value : 0) || null,
        thigh: parseFloat(thighInput ? thighInput.value : 0) || null,
        time: new Date().toISOString()
    });
    
    saveData();
    updateUI();
    
    if (weightInput) weightInput.value = '';
    if (fatInput) fatInput.value = '';
    if (waistInput) waistInput.value = '';
    if (hipInput) hipInput.value = '';
    if (chestInput) chestInput.value = '';
    if (armInput) armInput.value = '';
    if (thighInput) thighInput.value = '';
    
    showNotification('身体数据记录成功！');
}

function updateBodyList() {
    const list = document.getElementById('bodyList');
    if (!list) return;
    
    const recentRecords = appData.bodyRecords.slice(-7).reverse();
    
    if (recentRecords.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-5);">还没有身体数据</p>';
        return;
    }
    
    let html = '';
    for (let r of recentRecords) {
        html += '<div class="record-item">' +
            '<div class="record-icon">📊</div>' +
            '<div class="record-info">' +
                '<div class="record-title">' + new Date(r.time).toLocaleDateString('zh-CN') + '</div>' +
                '<div class="record-meta">体重: ' + r.weight + 'kg' + (r.fat ? ' 体脂: ' + r.fat + '%' : '') + '</div>' +
            '</div>' +
        '</div>';
    }
    list.innerHTML = html;
}

// ===== 睡眠记录 =====
function addSleepRecord() {
    const startInput = document.getElementById('sleepStart');
    const endInput = document.getElementById('sleepEnd');
    const qualityInput = document.getElementById('sleepQuality');
    const noteInput = document.getElementById('sleepNote');
    
    const start = startInput ? startInput.value : '';
    const end = endInput ? endInput.value : '';
    const quality = qualityInput ? qualityInput.value : 3;
    const note = noteInput ? noteInput.value.trim() : '';
    
    if (!start || !end) {
        showNotification('请填写入睡和起床时间');
        return;
    }
    
    // 计算睡眠时长
    const startDate = new Date('2000-01-01T' + start);
    const endDate = new Date('2000-01-01T' + end);
    let duration = (endDate - startDate) / 1000 / 60; // 分钟
    if (duration < 0) duration += 24 * 60; // 跨夜
    
    appData.sleepRecords.push({
        id: Date.now(),
        start: start,
        end: end,
        duration: duration,
        quality: parseInt(quality),
        note: note,
        time: new Date().toISOString()
    });
    
    saveData();
    updateUI();
    
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
    if (qualityInput) qualityInput.value = '3';
    if (noteInput) noteInput.value = '';
    
    showNotification('睡眠记录成功！');
}

function updateSleepList() {
    const list = document.getElementById('sleepList');
    if (!list) return;
    
    const recentRecords = appData.sleepRecords.slice(-7).reverse();
    
    if (recentRecords.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-5);">还没有睡眠记录</p>';
        return;
    }
    
    const qualityEmoji = ['😫', '😕', '😐', '🙂', '😴'];
    
    let html = '';
    for (let r of recentRecords) {
        const hours = Math.floor(r.duration / 60);
        const mins = r.duration % 60;
        html += '<div class="record-item">' +
            '<div class="record-icon">' + qualityEmoji[r.quality - 1] + '</div>' +
            '<div class="record-info">' +
                '<div class="record-title">' + new Date(r.time).toLocaleDateString('zh-CN') + '</div>' +
                '<div class="record-meta">' + r.start + '-' + r.end + ' (' + hours + 'h' + mins + 'm)</div>' +
            '</div>' +
        '</div>';
    }
    list.innerHTML = html;
}

// ===== 运动记录 =====
function addExerciseRecord() {
    const typeInput = document.getElementById('exerciseType');
    const durationInput = document.getElementById('exerciseDuration');
    const caloriesInput = document.getElementById('exerciseCalories');
    const intensityInput = document.getElementById('exerciseIntensity');
    const noteInput = document.getElementById('exerciseNote');
    
    const type = typeInput ? typeInput.value : 'other';
    const duration = parseInt(durationInput ? durationInput.value : 0);
    const calories = parseInt(caloriesInput ? caloriesInput.value : 0);
    const intensity = intensityInput ? intensityInput.value : 'medium';
    const note = noteInput ? noteInput.value.trim() : '';
    
    if (!duration) {
        showNotification('请填写运动时长');
        return;
    }
    
    const typeNames = {
        cardio: '有氧运动',
        strength: '力量训练',
        hiit: 'HIIT',
        yoga: '瑜伽',
        swim: '游泳',
        run: '跑步',
        other: '其他'
    };
    
    appData.exerciseRecords.push({
        id: Date.now(),
        type: type,
        typeName: typeNames[type],
        duration: duration,
        calories: calories,
        intensity: intensity,
        note: note,
        time: new Date().toISOString()
    });
    
    saveData();
    updateUI();
    
    if (durationInput) durationInput.value = '';
    if (caloriesInput) caloriesInput.value = '';
    if (noteInput) noteInput.value = '';
    
    showNotification('运动记录成功！');
}

function updateExerciseList() {
    const list = document.getElementById('exerciseList');
    if (!list) return;
    
    const recentRecords = appData.exerciseRecords.slice(-7).reverse();
    
    if (recentRecords.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-5);">还没有运动记录</p>';
        return;
    }
    
    const intensityEmoji = { low: '🟢', medium: '🟡', high: '🔴' };
    
    let html = '';
    for (let r of recentRecords) {
        html += '<div class="record-item">' +
            '<div class="record-icon">💪</div>' +
            '<div class="record-info">' +
                '<div class="record-title">' + r.typeName + (r.note ? ' - ' + r.note : '') + '</div>' +
                '<div class="record-meta">' + r.duration + '分钟 ' + intensityEmoji[r.intensity] + ' ' + (r.calories ? r.calories + 'kcal' : '') + '</div>' +
            '</div>' +
        '</div>';
    }
    list.innerHTML = html;
}

// ===== 喝水记录 =====
function addWater(amount) {
    appData.waterConsumed += amount;
    
    appData.waterRecords.push({
        id: Date.now(),
        amount: amount,
        time: new Date().toISOString()
    });
    
    saveData();
    updateWaterStatus();
    showNotification('已添加 ' + amount + 'ml 喝水记录');
}

function resetWater() {
    appData.waterConsumed = 0;
    appData.waterRecords = [];
    saveData();
    updateWaterStatus();
    showNotification('喝水记录已重置');
}

function updateWaterStatus() {
    const consumedEl = document.getElementById('waterConsumed');
    const targetEl = document.getElementById('waterTarget');
    const progressBar = document.getElementById('waterProgress');
    
    if (consumedEl) consumedEl.textContent = appData.waterConsumed;
    if (targetEl) targetEl.textContent = appData.waterTarget;
    if (progressBar) {
        const progress = Math.min(appData.waterConsumed / appData.waterTarget, 1) * 100;
        progressBar.style.width = progress + '%';
    }
}

// ===== 图表 =====
function initChart() {
    const ctx = document.getElementById('dataChart');
    if (!ctx) return;
    
    dataChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '数据',
                data: [],
                borderColor: '#0D9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function switchChart(type) {
    document.querySelectorAll('.tab-btn').forEach(function(btn) { btn.classList.remove('active'); });
    event.target.classList.add('active');
    
    updateChart(type);
}

function updateChart(type) {
    if (!dataChart) return;
    
    const days = 7;
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        
        if (type === 'weight') {
            const record = appData.bodyRecords.find(function(r) {
                return new Date(r.time).toDateString() === dateStr;
            });
            data.push(record ? record.weight : null);
        } else if (type === 'calories') {
            const records = appData.dietRecords.filter(function(r) {
                return new Date(r.time).toDateString() === dateStr;
            });
            const total = records.reduce(function(sum, r) { return sum + (r.calories || 0); }, 0);
            data.push(total);
        } else if (type === 'water') {
            const records = appData.waterRecords.filter(function(r) {
                return new Date(r.time).toDateString() === dateStr;
            });
            const total = records.reduce(function(sum, r) { return sum + (r.amount || 0); }, 0);
            data.push(total);
        }
    }
    
    const labels2 = { weight: '体重(kg)', calories: '热量(kcal)', water: '喝水(ml)' };
    
    dataChart.data.labels = labels;
    dataChart.data.datasets[0].label = labels2[type];
    dataChart.data.datasets[0].data = data;
    dataChart.update();
}

// ===== 通知 =====
function showNotification(msg) {
    const notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--primary);color:white;padding:12px 24px;border-radius:8px;font-weight:500;z-index:10000;box-shadow:var(--shadow-md);';
    notif.textContent = msg;
    document.body.appendChild(notif);
    
    setTimeout(function() {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        setTimeout(function() { notif.remove(); }, 300);
    }, 3000);
}

function showSettingsModal() {
    alert('设置功能开发中...\n\n当前功能：\n- 饮食记录\n- 身体数据\n- 睡眠记录\n- 运动记录\n- 喝水记录\n- 碳循环计划');
}
