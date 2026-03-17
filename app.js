// ===== 饿魔 - 科学减脂应用 =====

// 数据存储键名
const STORAGE_KEY = 'emo_diet_data';
const AUTH_KEY = 'emo_auth_code';
const SHARE_AUTH_KEY = 'emo_share_auth';

// 全局数据
let appData = {
    dietRecords: [],
    bodyRecords: [],
    carbonSettings: null,
    waterTarget: 2000,
    waterConsumed: 0,
    sleepRecords: [],
    exerciseRecords: [],
    shareAuth: null
};

// 初始化
function init() {
    console.log('初始化开始...');
    loadData();
    console.log('数据加载完成，ownerCode:', appData.ownerCode);
    checkAuth();
}

// ===== 授权系统 =====
function checkAuth() {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    const shareAuth = localStorage.getItem(SHARE_AUTH_KEY);
    
    // 检查是否是分享用户
    if (shareAuth) {
        const auth = JSON.parse(shareAuth);
        if (auth.expires && new Date(auth.expires) > new Date()) {
            document.getElementById('authModal').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            updateUI();
            return;
        } else {
            localStorage.removeItem(SHARE_AUTH_KEY);
        }
    }
    
    // 检查是否已登录（主人）
    if (savedAuth === 'owner') {
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        updateUI();
        return;
    }
    
    // 显示授权弹窗
    document.getElementById('authModal').classList.remove('hidden');
}

function clearAuthAndReload() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(SHARE_AUTH_KEY);
    localStorage.removeItem(STORAGE_KEY);
    alert('缓存已清除，页面将刷新');
    location.reload();
}

function verifyAuthCode() {
    const code = document.getElementById('authCode').value.trim();
    const ownerCode = appData.ownerCode || 'EMO2024';
    
    console.log('输入的授权码:', code);
    console.log('正确的主人码:', ownerCode);
    
    // 检查是否是主人码
    if (code === ownerCode) {
        console.log('主人码验证成功');
        localStorage.setItem(AUTH_KEY, 'owner');
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        updateUI();
        return;
    }
    
    // 检查是否是分享授权码（格式：EMO + 6位字符）
    if (code.startsWith('EMO') && code.length === 9) {
        // 分享码验证成功，创建临时的分享授权数据
        const shareAuthData = {
            code: code,
            expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天有效期
            created: new Date().toISOString()
        };
        
        localStorage.setItem(SHARE_AUTH_KEY, JSON.stringify(shareAuthData));
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        updateUI();
        showNotification('欢迎！分享码有效期7天');
        return;
    }
    
    console.log('授权码验证失败');
    document.getElementById('authError').textContent = '授权码错误，请检查格式（主人码或EMO开头的分享码）';
}

// ===== 数据管理 =====
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        appData = JSON.parse(saved);
    }
    // 确保有默认主人码
    if (!appData.ownerCode) {
        appData.ownerCode = 'EMO2024';
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('存储空间不足，请备份并清理旧数据');
        } else {
            console.error('保存数据失败:', e);
        }
    }
}

// ===== 饮食记录 =====
function showDietInput(method) {
    document.querySelectorAll('.input-form').forEach(el => el.classList.add('hidden'));
    document.getElementById(method + 'Input').classList.remove('hidden');
}

// 自动计算热量
function calculateCalories() {
    const carbs = parseFloat(document.getElementById('carbs').value) || 0;
    const protein = parseFloat(document.getElementById('protein').value) || 0;
    const fat = parseFloat(document.getElementById('fat').value) || 0;
    const calories = carbs * 4 + protein * 4 + fat * 9;
    document.getElementById('calories').value = Math.round(calories);
}

// 监听营养素输入
['carbs', 'protein', 'fat'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', calculateCalories);
});

function addDietRecord() {
    const name = document.getElementById('foodName').value.trim();
    const carbs = parseFloat(document.getElementById('carbs').value) || 0;
    const protein = parseFloat(document.getElementById('protein').value) || 0;
    const fat = parseFloat(document.getElementById('fat').value) || 0;
    const calories = parseInt(document.getElementById('calories').value) || 0;
    
    if (!name) {
        alert('请输入食物名称');
        return;
    }
    
    const record = {
        id: Date.now(),
        name,
        carbs,
        protein,
        fat,
        calories,
        time: new Date().toISOString()
    };
    
    appData.dietRecords.push(record);
    saveData();
    updateDietList();
    updateTodaySummary();
    updateMacroChart();
    showFeedback();
    
    // 震动反馈
    vibrate([30, 50, 30]);
    
    // 清空表单
    document.getElementById('foodName').value = '';
    document.getElementById('carbs').value = '';
    document.getElementById('protein').value = '';
    document.getElementById('fat').value = '';
    document.getElementById('calories').value = '';
}

function deleteDietRecord(id) {
    showDeleteConfirm('确认删除这条记录？', () => {
        appData.dietRecords = appData.dietRecords.filter(r => r.id !== id);
        saveData();
        updateDietList();
        updateTodaySummary();
        updateMacroChart();
        vibrate(20);
    });
}

function deleteBodyRecord(id) {
    showDeleteConfirm('确认删除这条身体数据？', () => {
        appData.bodyRecords = appData.bodyRecords.filter(r => r.id !== id);
        saveData();
        updateBodyList();
        updateWeightChart();
        vibrate(20);
    });
}

function deleteSleepRecord(id) {
    showDeleteConfirm('确认删除这条睡眠记录？', () => {
        appData.sleepRecords = appData.sleepRecords.filter(r => r.id !== id);
        saveData();
        updateSleepList();
        vibrate(20);
    });
}

function deleteExerciseRecord(id) {
    showDeleteConfirm('确认删除这条运动记录？', () => {
        appData.exerciseRecords = appData.exerciseRecords.filter(r => r.id !== id);
        saveData();
        updateExerciseList();
        vibrate(20);
    });
}

function updateDietList() {
    const list = document.getElementById('dietList');
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    ).sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (todayRecords.length === 0) {
        const illust = getEmptyIllustration('diet');
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-illustration">${illust.emoji}</div>
                <div class="empty-title">${illust.title}</div>
                <div class="empty-desc">${illust.desc}</div>
            </div>
        `;
        return;
    }
    
    list.innerHTML = todayRecords.map(r => `
        <div class="record-item animate-slide-in">
            <div class="record-info">
                <div class="record-name">${r.name}</div>
                <div class="record-macros">碳水${r.carbs}g · 蛋白质${r.protein}g · 脂肪${r.fat}g</div>
            </div>
            <div class="record-calories">${r.calories}kcal</div>
            <button class="record-delete" onclick="deleteDietRecord(${r.id})">🗑️</button>
        </div>
    `).join('');
}

// ===== 今日概览 =====
function updateTodaySummary() {
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    );
    
    const totals = todayRecords.reduce((acc, r) => ({
        calories: acc.calories + r.calories,
        carbs: acc.carbs + r.carbs,
        protein: acc.protein + r.protein,
        fat: acc.fat + r.fat
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
    
    // 数字滚动动画
    animateNumber('todayCalories', totals.calories);
    animateNumber('todayCarbs', totals.carbs);
    animateNumber('todayProtein', totals.protein);
    animateNumber('todayFat', totals.fat);
    
    // 更新环形进度
    updateRingProgress('caloriesRingFill', totals.calories, 2500);
    
    // 更新碳循环进度联动
    updateCarbonProgress(totals);
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseFloat(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (targetValue - startValue) * easeProgress;
        
        element.textContent = Number.isInteger(targetValue) ? Math.round(currentValue) : currentValue.toFixed(1);
        element.classList.add('number-animate');
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            setTimeout(() => element.classList.remove('number-animate'), 500);
        }
    }
    
    requestAnimationFrame(update);
}

function updateRingProgress(elementId, current, max) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const circumference = 2 * Math.PI * 52;
    const percent = Math.min(current / max, 1);
    const offset = circumference * (1 - percent);
    
    element.style.strokeDasharray = circumference;
    element.style.strokeDashoffset = offset;
    
    // 颜色状态
    element.classList.remove('over', 'near');
    if (percent > 1) {
        element.classList.add('over');
    } else if (percent >= 0.8) {
        element.classList.add('near');
    }
}

function showFeedback() {
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    );
    
    const totalCalories = todayRecords.reduce((sum, r) => sum + r.calories, 0);
    const totalProtein = todayRecords.reduce((sum, r) => sum + r.protein, 0);
    
    let feedback = '';
    if (totalCalories > 2500) {
        feedback = '⚠️ 今日热量偏高，建议适当控制';
    } else if (totalCalories < 1200) {
        feedback = '💡 今日热量偏低，注意营养均衡';
    } else if (totalProtein < 50) {
        feedback = '🥩 蛋白质摄入不足，建议补充';
    } else {
        feedback = '✅ 今日饮食均衡，继续保持！';
    }
    
    document.getElementById('dailyFeedback').textContent = feedback;
}

// ===== 营养素图表 =====
function updateMacroChart() {
    // 检查 Chart.js 是否加载
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js 未加载');
        return;
    }
    
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    );
    
    const totals = todayRecords.reduce((acc, r) => ({
        carbs: acc.carbs + r.carbs,
        protein: acc.protein + r.protein,
        fat: acc.fat + r.fat
    }), { carbs: 0, protein: 0, fat: 0 });
    
    const ctx = document.getElementById('macroChart');
    if (!ctx) return;
    
    // 销毁旧图表
    if (window.macroChartInstance) {
        window.macroChartInstance.destroy();
    }
    
    window.macroChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['碳水', '蛋白质', '脂肪'],
            datasets: [{
                data: [totals.carbs || 1, totals.protein || 1, totals.fat || 1],
                backgroundColor: ['#5FB3A3', '#7ECDC0', '#4A9A8B'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { padding: 15, font: { size: 12 } }
                }
            },
            cutout: '60%'
        }
    });
}

// ===== 碳循环功能 =====
function saveCarbonSettings() {
    const settings = {
        baseWeight: parseFloat(document.getElementById('baseWeight').value) || 70,
        carbMultiplier: parseFloat(document.getElementById('carbMultiplier').value) || 2.0,
        proteinMultiplier: parseFloat(document.getElementById('proteinMultiplier').value) || 2.0,
        fatMultiplier: parseFloat(document.getElementById('fatMultiplier').value) || 0.8,
        lowCarbonDays: parseInt(document.getElementById('lowCarbonDays').value) || 3,
        highCarbonDays: parseInt(document.getElementById('highCarbonDays').value) || 1
    };
    
    appData.carbonSettings = settings;
    saveData();
    updateCarbonTargets();
    alert('碳循环设置已保存！');
}

function updateCarbonTargets() {
    if (!appData.carbonSettings) return;
    
    const s = appData.carbonSettings;
    const isHighCarbon = isHighCarbonDay();
    const multiplier = isHighCarbon ? 1.5 : 1;
    
    const targets = {
        carbs: s.baseWeight * s.carbMultiplier * multiplier,
        protein: s.baseWeight * s.proteinMultiplier,
        fat: s.baseWeight * s.fatMultiplier
    };
    
    // 显示碳循环卡片
    document.getElementById('carbonCard').style.display = 'block';
    document.getElementById('carbonDayType').textContent = isHighCarbon ? '今日: 高碳日 🔥' : '今日: 低碳日 ❄️';
    
    // 立即更新进度显示
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    );
    const totals = todayRecords.reduce((acc, r) => ({
        carbs: acc.carbs + r.carbs,
        protein: acc.protein + r.protein,
        fat: acc.fat + r.fat
    }), { carbs: 0, protein: 0, fat: 0 });
    
    updateProgressBar('carbs', totals.carbs, targets.carbs);
    updateProgressBar('protein', totals.protein, targets.protein);
    updateProgressBar('fat', totals.fat, targets.fat);
}

function isHighCarbonDay() {
    if (!appData.carbonSettings) return false;
    const startDate = new Date(appData.carbonSettings.startDate || Date.now());
    const daysSince = Math.floor((Date.now() - startDate) / 86400000);
    const cycle = appData.carbonSettings.lowCarbonDays + appData.carbonSettings.highCarbonDays;
    const dayInCycle = daysSince % cycle;
    return dayInCycle >= appData.carbonSettings.lowCarbonDays;
}

function updateCarbonProgress(totals) {
    if (!appData.carbonSettings) return;
    const s = appData.carbonSettings;
    const isHighCarbon = isHighCarbonDay();
    const multiplier = isHighCarbon ? 1.5 : 1;
    
    // 计算目标
    const targets = {
        carbs: s.baseWeight * s.carbMultiplier * multiplier,
        protein: s.baseWeight * s.proteinMultiplier,
        fat: s.baseWeight * s.fatMultiplier
    };
    
    // 更新首页进度
    updateProgressBar('carbs', totals.carbs, targets.carbs);
    updateProgressBar('protein', totals.protein, targets.protein);
    updateProgressBar('fat', totals.fat, targets.fat);
    
    // 更新碳循环卡片
    const carbsPercent = Math.min((totals.carbs / targets.carbs) * 100, 100);
    document.getElementById('carbonProgress').style.width = carbsPercent + '%';
    document.getElementById('carbonProgressText').textContent = `碳水 ${totals.carbs.toFixed(0)}/${targets.carbs.toFixed(0)}g`;
}

function updateProgressBar(type, current, target) {
    const percent = Math.round((current / target) * 100);
    const bar = document.getElementById(type + 'ProgressBar');
    const text = document.getElementById(type + 'ProgressText');
    const percentEl = document.getElementById(type + 'Percent');
    
    if (!bar || !text || !percentEl) return;
    
    // 更新数值
    text.textContent = `${current.toFixed(1)}/${target.toFixed(1)}g`;
    percentEl.textContent = percent + '%';
    
    // 更新进度条
    bar.style.width = Math.min(percent, 100) + '%';
    
    // 颜色状态
    bar.classList.remove('over', 'near');
    if (percent > 100) {
        bar.classList.add('over');
    } else if (percent >= 80) {
        bar.classList.add('near');
    }
}

function syncFromBodyData() {
    const latest = appData.bodyRecords[appData.bodyRecords.length - 1];
    if (latest) {
        document.getElementById('baseWeight').value = latest.weight;
    } else {
        alert('暂无身体数据，请先记录体重');
    }
}

// ===== 身体数据 =====
function addBodyRecord() {
    const record = {
        id: Date.now(),
        weight: parseFloat(document.getElementById('bodyWeight').value) || 0,
        fat: parseFloat(document.getElementById('bodyFat').value) || 0,
        head: parseFloat(document.getElementById('head').value) || 0,
        chest: parseFloat(document.getElementById('chest').value) || 0,
        waist: parseFloat(document.getElementById('waist').value) || 0,
        hip: parseFloat(document.getElementById('hip').value) || 0,
        upperArm: parseFloat(document.getElementById('upperArm').value) || 0,
        forearm: parseFloat(document.getElementById('forearm').value) || 0,
        thigh: parseFloat(document.getElementById('thigh').value) || 0,
        calf: parseFloat(document.getElementById('calf').value) || 0,
        date: new Date().toISOString()
    };
    
    if (!record.weight) {
        alert('请输入体重');
        return;
    }
    
    appData.bodyRecords.push(record);
    saveData();
    updateBodyList();
    updateWeightChart();
    
    // 清空表单
    document.getElementById('bodyWeight').value = '';
    document.getElementById('bodyFat').value = '';
    document.getElementById('head').value = '';
    document.getElementById('chest').value = '';
    document.getElementById('waist').value = '';
    document.getElementById('hip').value = '';
    document.getElementById('upperArm').value = '';
    document.getElementById('forearm').value = '';
    document.getElementById('thigh').value = '';
    document.getElementById('calf').value = '';
    
    alert('身体数据已记录！');
}

function updateBodyList() {
    const list = document.getElementById('bodyList');
    if (appData.bodyRecords.length === 0) {
        list.innerHTML = '<p class="empty">暂无记录</p>';
        return;
    }
    
    const sorted = [...appData.bodyRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = sorted.slice(0, 10).map(r => {
        const dimensions = [];
        if (r.head) dimensions.push(`头围${r.head}`);
        if (r.chest) dimensions.push(`胸围${r.chest}`);
        if (r.waist) dimensions.push(`腰围${r.waist}`);
        if (r.hip) dimensions.push(`臀围${r.hip}`);
        if (r.upperArm) dimensions.push(`大臂${r.upperArm}`);
        if (r.forearm) dimensions.push(`小臂${r.forearm}`);
        if (r.thigh) dimensions.push(`大腿${r.thigh}`);
        if (r.calf) dimensions.push(`小腿${r.calf}`);
        
        const dimText = dimensions.length > 0 ? ' · ' + dimensions.slice(0, 3).join(' ') + (dimensions.length > 3 ? '...' : '') : '';
        
        return `
        <div class="record-item">
            <div class="record-info">
                <div class="record-name">${new Date(r.date).toLocaleDateString()}</div>
                <div class="record-macros">体重${r.weight}kg${r.fat ? ' · 体脂' + r.fat + '%' : ''}${dimText}</div>
            </div>
            <button class="record-delete" onclick="deleteBodyRecord(${r.id})">🗑️</button>
        </div>
    `}).join('');
}

function deleteBodyRecord(id) {
    appData.bodyRecords = appData.bodyRecords.filter(r => r.id !== id);
    saveData();
    updateBodyList();
    updateWeightChart();
}

function updateWeightChart() {
    if (typeof Chart === 'undefined') return;
    
    const ctx = document.getElementById('weightChart');
    if (!ctx || appData.bodyRecords.length < 2) return;
    
    if (window.weightChartInstance) {
        window.weightChartInstance.destroy();
    }
    
    const sorted = [...appData.bodyRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(r => new Date(r.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    const weights = sorted.map(r => r.weight);
    
    window.weightChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '体重 (kg)',
                data: weights,
                borderColor: '#5FB3A3',
                backgroundColor: 'rgba(95, 179, 163, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#5FB3A3'
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
                    beginAtZero: false,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// ===== 喝水功能 =====
function updateWaterTarget() {
    appData.waterTarget = parseInt(document.getElementById('waterTarget').value) || 2000;
    saveData();
    renderWaterCups();
}

function renderWaterCups() {
    const container = document.getElementById('waterCups');
    const cupSize = 250;
    const totalCups = Math.min(Math.ceil(appData.waterTarget / cupSize), 8);
    const filledCups = Math.floor(appData.waterConsumed / cupSize);
    
    let html = '';
    for (let i = 0; i < totalCups; i++) {
        html += `<div class="water-cup ${i < filledCups ? 'filled' : ''}" onclick="setWater(${(i + 1) * cupSize})">💧</div>`;
    }
    container.innerHTML = html;
    
    const percent = Math.round((appData.waterConsumed / appData.waterTarget) * 100);
    document.getElementById('waterPercent').textContent = percent + '%';
    document.getElementById('waterAmount').textContent = `${appData.waterConsumed}/${appData.waterTarget}ml`;
    
    // 更新环形进度
    updateRingProgress('waterRingFill', appData.waterConsumed, appData.waterTarget);
}

function addWater(amount) {
    appData.waterConsumed = Math.min(appData.waterConsumed + amount, appData.waterTarget * 2);
    saveData();
    renderWaterCups();
}

function setWater(amount) {
    appData.waterConsumed = amount;
    saveData();
    renderWaterCups();
}

function resetWater() {
    appData.waterConsumed = 0;
    saveData();
    renderWaterCups();
}

// ===== 睡眠记录 =====
function addSleepRecord() {
    const record = {
        id: Date.now(),
        sleepTime: document.getElementById('sleepTime').value,
        wakeTime: document.getElementById('wakeTime').value,
        hours: parseFloat(document.getElementById('sleepHours').value) || 0,
        quality: parseInt(document.getElementById('sleepQuality').value) || 3,
        date: new Date().toISOString()
    };
    
    if (!record.hours) {
        alert('请输入睡眠时长');
        return;
    }
    
    appData.sleepRecords.push(record);
    saveData();
    updateSleepList();
    
    // 清空
    document.getElementById('sleepTime').value = '';
    document.getElementById('wakeTime').value = '';
    document.getElementById('sleepHours').value = '';
    document.getElementById('sleepQuality').value = '3';
}

function updateSleepList() {
    const list = document.getElementById('sleepList');
    const sorted = [...appData.sleepRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sorted.length === 0) {
        list.innerHTML = '<p class="empty">暂无记录</p>';
        return;
    }
    
    const qualityEmoji = ['😫', '😕', '😐', '🙂', '😴'];
    
    list.innerHTML = sorted.slice(0, 5).map(r => `
        <div class="record-item">
            <div class="record-info">
                <div class="record-name">${new Date(r.date).toLocaleDateString()} ${qualityEmoji[r.quality - 1]}</div>
                <div class="record-macros">睡眠 ${r.hours} 小时</div>
            </div>
            <button class="record-delete" onclick="deleteSleepRecord(${r.id})">🗑️</button>
        </div>
    `).join('');
}

function deleteSleepRecord(id) {
    appData.sleepRecords = appData.sleepRecords.filter(r => r.id !== id);
    saveData();
    updateSleepList();
}

// ===== 运动记录 =====
function addExerciseRecord() {
    const record = {
        id: Date.now(),
        type: document.getElementById('exerciseType').value,
        duration: parseInt(document.getElementById('exerciseDuration').value) || 0,
        calories: parseInt(document.getElementById('exerciseCalories').value) || 0,
        date: new Date().toISOString()
    };
    
    if (!record.duration) {
        alert('请输入运动时长');
        return;
    }
    
    appData.exerciseRecords.push(record);
    saveData();
    updateExerciseList();
    
    document.getElementById('exerciseDuration').value = '';
    document.getElementById('exerciseCalories').value = '';
}

function updateExerciseList() {
    const list = document.getElementById('exerciseList');
    const sorted = [...appData.exerciseRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sorted.length === 0) {
        list.innerHTML = '<p class="empty">暂无记录</p>';
        return;
    }
    
    list.innerHTML = sorted.slice(0, 5).map(r => `
        <div class="record-item">
            <div class="record-info">
                <div class="record-name">${r.type} · ${r.duration}分钟</div>
                <div class="record-macros">${new Date(r.date).toLocaleDateString()}</div>
            </div>
            <div class="record-calories">${r.calories || '--'}kcal</div>
            <button class="record-delete" onclick="deleteExerciseRecord(${r.id})">🗑️</button>
        </div>
    `).join('');
}

function deleteExerciseRecord(id) {
    appData.exerciseRecords = appData.exerciseRecords.filter(r => r.id !== id);
    saveData();
    updateExerciseList();
}

// ===== 分享功能 =====
function showShareModal() {
    document.getElementById('shareModal').classList.remove('hidden');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.add('hidden');
}

function generateShareCode() {
    const days = parseInt(document.getElementById('shareDays').value) || 7;
    const code = 'EMO' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    
    appData.shareAuth = {
        code: code,
        expires: expires.toISOString(),
        created: new Date().toISOString()
    };
    saveData();
    
    document.getElementById('shareCodeResult').innerHTML = `
        <div class="code">${code}</div>
        <div class="expiry">有效期至 ${expires.toLocaleDateString()}</div>
    `;
}

// ===== 导出功能 =====
function exportData() {
    document.getElementById('exportModal').classList.remove('hidden');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.add('hidden');
}

function exportJSON() {
    const data = JSON.stringify(appData, null, 2);
    downloadFile(data, `饿魔数据_${new Date().toLocaleDateString()}.json`, 'application/json');
    closeExportModal();
}

function exportCSV() {
    let csv = '日期,食物,碳水(g),蛋白质(g),脂肪(g),热量(kcal)\n';
    appData.dietRecords.forEach(r => {
        csv += `${new Date(r.time).toLocaleDateString()},${r.name},${r.carbs},${r.protein},${r.fat},${r.calories}\n`;
    });
    downloadFile(csv, `饿魔饮食记录_${new Date().toLocaleDateString()}.csv`, 'text/csv');
    closeExportModal();
}

function generateReport() {
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => new Date(r.time).toDateString() === today);
    
    const totals = todayRecords.reduce((acc, r) => ({
        calories: acc.calories + r.calories,
        carbs: acc.carbs + r.carbs,
        protein: acc.protein + r.protein,
        fat: acc.fat + r.fat
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
    
    let report = `# 饿魔减脂报告\n\n`;
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;
    report += `## 今日摄入\n`;
    report += `- 热量: ${totals.calories} kcal\n`;
    report += `- 碳水: ${totals.carbs.toFixed(1)}g\n`;
    report += `- 蛋白质: ${totals.protein.toFixed(1)}g\n`;
    report += `- 脂肪: ${totals.fat.toFixed(1)}g\n\n`;
    
    if (appData.bodyRecords.length > 0) {
        const latest = appData.bodyRecords[appData.bodyRecords.length - 1];
        report += `## 最新身体数据\n`;
        report += `- 体重: ${latest.weight}kg\n`;
        if (latest.fat) report += `- 体脂: ${latest.fat}%\n`;
        report += `\n`;
    }
    
    report += `## 喝水进度\n`;
    report += `${appData.waterConsumed}/${appData.waterTarget}ml (${Math.round(appData.waterConsumed/appData.waterTarget*100)}%)\n`;
    
    downloadFile(report, `饿魔报告_${new Date().toLocaleDateString()}.md`, 'text/markdown');
    closeExportModal();
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== 标签页切换 =====
function switchTab(tab) {
    // 更新底部导航
    document.querySelectorAll('.nav-item').forEach((btn, idx) => {
        btn.classList.remove('active');
        const tabs = ['diet', 'carbon', 'body', 'other'];
        if (tabs[idx] === tab) {
            btn.classList.add('active');
        }
    });
    
    // 更新内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // 震动反馈
    vibrate(10);
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 滚动隐藏标题栏（已禁用，解决频闪） =====
// 频闪问题已禁用此功能，标题栏始终显示
// 如需重新启用，取消下面代码的注释

/*
let scrollTimeout;
let lastScrollTop = 0;

window.addEventListener('scroll', function() {
    const header = document.getElementById('mainHeader');
    if (!header) return;
    
    const scrollTop = window.scrollY;
    
    if (Math.abs(scrollTop - lastScrollTop) < 30) return;
    
    clearTimeout(scrollTimeout);
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        if (!header.classList.contains('hidden')) {
            header.classList.add('hidden');
        }
    } else if (scrollTop < lastScrollTop) {
        if (header.classList.contains('hidden')) {
            header.classList.remove('hidden');
        }
    }
    
    lastScrollTop = scrollTop;
}, { passive: true });
*/

// ===== 震动反馈 =====
function vibrate(pattern) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// ===== 长按删除 =====
let longPressTimer;
let isLongPress = false;

function setupLongPress(element, callback) {
    element.addEventListener('touchstart', function(e) {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            vibrate(50);
            callback();
        }, 600);
    });
    
    element.addEventListener('touchend', function() {
        clearTimeout(longPressTimer);
    });
    
    element.addEventListener('touchmove', function() {
        clearTimeout(longPressTimer);
    });
    
    // 鼠标支持
    element.addEventListener('mousedown', function(e) {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            vibrate(50);
            callback();
        }, 600);
    });
    
    element.addEventListener('mouseup', function() {
        clearTimeout(longPressTimer);
    });
    
    element.addEventListener('mouseleave', function() {
        clearTimeout(longPressTimer);
    });
}

let pendingDeleteCallback = null;

function showDeleteConfirm(message, onConfirm) {
    // 移除已有的确认提示
    document.querySelectorAll('.delete-confirm').forEach(el => el.remove());
    
    // 保存回调函数
    pendingDeleteCallback = onConfirm;
    
    const confirmEl = document.createElement('div');
    confirmEl.className = 'delete-confirm';
    confirmEl.innerHTML = `${message} <button style="margin-left:10px;padding:4px 12px;background:white;color:var(--danger);border:none;border-radius:4px;font-weight:600;" onclick="this.parentElement.remove(); pendingDeleteCallback = null;">取消</button> <button style="margin-left:5px;padding:4px 12px;background:transparent;color:white;border:1px solid white;border-radius:4px;" onclick="this.parentElement.remove(); if(pendingDeleteCallback) { pendingDeleteCallback(); pendingDeleteCallback = null; }">确认</button>`;
    document.body.appendChild(confirmEl);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (confirmEl.parentElement) {
            confirmEl.remove();
            pendingDeleteCallback = null;
        }
    }, 3000);
}

// ===== 拍照输入 =====
function handlePhoto() {
    const file = document.getElementById('foodPhoto').files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('photoPreview').innerHTML = `
            <img src="${e.target.result}" style="max-width:100%;border-radius:10px;margin-top:10px;">
            <p class="hint">📷 照片已保存（模拟识别中...）</p>
        `;
        // 实际项目中这里会调用 AI 识别 API
        setTimeout(() => {
            alert('🍽️ 识别结果：建议手动输入营养数据');
            showDietInput('manual');
        }, 1000);
    };
    reader.readAsDataURL(file);
}

// ===== 语音输入 =====
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('您的浏览器不支持语音识别');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    document.getElementById('voiceResult').innerHTML = '<p class="hint">🎤 正在听...</p>';
    
    recognition.onresult = function(event) {
        const text = event.results[0][0].transcript;
        document.getElementById('voiceResult').innerHTML = `<p class="hint">识别: "${text}"</p>`;
        // 实际项目中这里会解析食物名称
        setTimeout(() => {
            alert('🍽️ 语音已记录，建议手动输入营养数据');
            showDietInput('manual');
        }, 500);
    };
    
    recognition.onerror = function() {
        document.getElementById('voiceResult').innerHTML = '<p class="hint error">识别失败，请重试</p>';
    };
    
    recognition.start();
}

// ===== UI 更新 =====
function updateUI() {
    updateDietList();
    updateTodaySummary();
    updateMacroChart();
    updateBodyList();
    updateWeightChart();
    updateSleepList();
    updateExerciseList();
    renderWaterCups();
    updateCarbonTargets();
    updateDietStats();
    updateBMI();
    updatePrediction();
    updateDimensionChart();
    updateCalorieBalance();
    
    // 设置喝水目标
    document.getElementById('waterTarget').value = appData.waterTarget;
    
    // 加载提醒设置
    loadReminderSettings();
    
    // 加载首页提醒
    loadHomeReminders();
    
    // 设置提醒
    setupReminders();
    
    // 检查目标达成
    checkGoalAchieved();
    
    // 更新徽章
    updateBadges();
}

// ===== 设置页面功能 =====
function showSettingsModal() {
    document.getElementById('currentOwnerCode').value = appData.ownerCode || 'EMO2024';
    updateActiveSharesList();
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function updateOwnerCode() {
    const newCode = document.getElementById('newOwnerCode').value.trim();
    if (!newCode) {
        alert('请输入新授权码');
        return;
    }
    if (newCode.length < 4) {
        alert('授权码至少需要4位');
        return;
    }
    
    appData.ownerCode = newCode;
    saveData();
    document.getElementById('currentOwnerCode').value = newCode;
    document.getElementById('newOwnerCode').value = '';
    alert('主人码已修改！');
}

function updateActiveSharesList() {
    const container = document.getElementById('activeSharesList');
    
    if (!appData.shareAuth || new Date(appData.shareAuth.expires) <= new Date()) {
        container.innerHTML = '<p class="empty">暂无有效分享码</p>';
        return;
    }
    
    const expires = new Date(appData.shareAuth.expires);
    const daysLeft = Math.ceil((expires - new Date()) / 86400000);
    
    container.innerHTML = `
        <div class="share-item">
            <div>
                <span class="code">${appData.shareAuth.code}</span>
                <span class="expiry">还剩 ${daysLeft} 天</span>
            </div>
            <button class="revoke-btn" onclick="revokeShare()">撤销</button>
        </div>
    `;
}

function revokeShare() {
    if (confirm('确定要撤销这个分享码吗？')) {
        appData.shareAuth = null;
        saveData();
        updateActiveSharesList();
    }
}

// ===== 数据备份/恢复 =====
function backupData() {
    const data = JSON.stringify(appData, null, 2);
    downloadFile(data, `饿魔备份_${new Date().toLocaleDateString()}.json`, 'application/json');
    alert('数据已备份！');
}

function showRestoreModal() {
    document.getElementById('restoreModal').classList.remove('hidden');
}

function closeRestoreModal() {
    document.getElementById('restoreModal').classList.add('hidden');
}

function restoreData() {
    const file = document.getElementById('restoreFile').files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('恢复数据将覆盖当前所有数据，确定继续吗？')) {
                appData = data;
                saveData();
                alert('数据恢复成功！');
                closeRestoreModal();
                location.reload();
            }
        } catch (err) {
            alert('文件格式错误，无法恢复');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('⚠️ 确定要清空所有数据吗？此操作不可恢复！')) {
        if (confirm('再次确认：真的要清空所有数据吗？')) {
            appData = {
                dietRecords: [],
                bodyRecords: [],
                carbonSettings: null,
                waterTarget: 2000,
                waterConsumed: 0,
                sleepRecords: [],
                exerciseRecords: [],
                ownerCode: appData.ownerCode,
                shareAuth: null
            };
            saveData();
            alert('所有数据已清空');
            location.reload();
        }
    }
}

// ===== 快捷操作功能 =====
function copyYesterdayDiet() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    const yesterdayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === yesterdayStr
    );
    
    if (yesterdayRecords.length === 0) {
        alert('昨天没有饮食记录');
        return;
    }
    
    if (confirm(`确定要复制昨天的 ${yesterdayRecords.length} 条记录吗？`)) {
        yesterdayRecords.forEach(r => {
            const newRecord = {
                ...r,
                id: Date.now() + Math.random(),
                time: new Date().toISOString()
            };
            appData.dietRecords.push(newRecord);
        });
        saveData();
        updateDietList();
        updateTodaySummary();
        updateMacroChart();
        alert('昨日记录已复制！');
    }
}

function showFavoriteFoods() {
    const list = document.getElementById('favoriteFoodsList');
    const container = document.getElementById('favoritesContainer');
    
    if (!appData.favoriteFoods || appData.favoriteFoods.length === 0) {
        // 从记录中自动生成常用食物
        const foodCount = {};
        appData.dietRecords.forEach(r => {
            const key = r.name.toLowerCase();
            if (!foodCount[key]) {
                foodCount[key] = { count: 0, record: r };
            }
            foodCount[key].count++;
        });
        
        appData.favoriteFoods = Object.values(foodCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(f => f.record);
        saveData();
    }
    
    if (appData.favoriteFoods.length === 0) {
        container.innerHTML = '<p class="empty">暂无常用食物，多记录一些饮食后会自动生成</p>';
    } else {
        container.innerHTML = appData.favoriteFoods.map((f, idx) => `
            <div class="favorite-item" onclick="addFavoriteFood(${idx})">
                <div class="food-info">
                    <div class="food-name">${f.name}</div>
                    <div class="food-macros">碳水${f.carbs}g · 蛋白质${f.protein}g · 脂肪${f.fat}g</div>
                </div>
                <span class="food-calories">${f.calories}kcal</span>
                <button class="remove-fav" onclick="event.stopPropagation(); removeFavorite(${idx})">×</button>
            </div>
        `).join('');
    }
    
    list.classList.toggle('hidden');
}

function addFavoriteFood(idx) {
    const food = appData.favoriteFoods[idx];
    const newRecord = {
        ...food,
        id: Date.now(),
        time: new Date().toISOString()
    };
    appData.dietRecords.push(newRecord);
    saveData();
    updateDietList();
    updateTodaySummary();
    updateMacroChart();
    showFeedback();
    alert(`已添加：${food.name}`);
}

function removeFavorite(idx) {
    appData.favoriteFoods.splice(idx, 1);
    saveData();
    showFavoriteFoods();
}

// ===== 分享卡片功能 =====
function showShareCard() {
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => new Date(r.time).toDateString() === today);
    
    const totals = todayRecords.reduce((acc, r) => ({
        calories: acc.calories + r.calories,
        carbs: acc.carbs + r.carbs,
        protein: acc.protein + r.protein,
        fat: acc.fat + r.fat
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
    
    document.getElementById('shareCalories').textContent = totals.calories;
    document.getElementById('shareCarbs').textContent = totals.carbs.toFixed(0);
    document.getElementById('shareProtein').textContent = totals.protein.toFixed(0);
    document.getElementById('shareFat').textContent = totals.fat.toFixed(0);
    document.getElementById('shareDate').textContent = new Date().toLocaleDateString('zh-CN', { 
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
    });
    
    document.getElementById('shareCardModal').classList.remove('hidden');
}

function closeShareCardModal() {
    document.getElementById('shareCardModal').classList.add('hidden');
}

function downloadShareCard() {
    const card = document.getElementById('shareCardPreview');
    alert('📸 分享卡片已生成！\n\n提示：实际项目中这里会生成图片下载。由于技术限制，请直接截图分享。');
}

// ===== 空状态插画 =====
function getEmptyIllustration(type) {
    const illustrations = {
        diet: { emoji: '🍽️', title: '还没有记录', desc: '点击上方按钮记录第一餐' },
        body: { emoji: '📏', title: '还没有身体数据', desc: '记录体重和围度，追踪变化' },
        exercise: { emoji: '🏃', title: '还没有运动记录', desc: '运动是减脂的好帮手' },
        sleep: { emoji: '😴', title: '还没有睡眠记录', desc: '充足睡眠有助于减脂' },
        water: { emoji: '💧', title: '还没有喝水记录', desc: '多喝水有助于代谢' }
    };
    return illustrations[type] || illustrations.diet;
}

// ===== 数据视图切换 =====
let currentDietView = 'day';

function switchDietView(view) {
    currentDietView = view;
    document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    updateDietStats();
}

function updateDietStats() {
    const now = new Date();
    let startDate, endDate;
    
    if (currentDietView === 'day') {
        startDate = new Date(now);
        endDate = new Date(now);
    } else if (currentDietView === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        endDate = new Date(now);
    } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
    }
    
    const records = appData.dietRecords.filter(r => {
        const date = new Date(r.time);
        return date >= startDate && date <= endDate;
    });
    
    if (records.length === 0) {
        document.getElementById('avgCalories').textContent = '--';
        document.getElementById('recordDays').textContent = '--';
        document.getElementById('compareSection').style.display = 'none';
        return;
    }
    
    // 按天分组
    const days = {};
    records.forEach(r => {
        const day = new Date(r.time).toDateString();
        if (!days[day]) days[day] = { calories: 0, count: 0 };
        days[day].calories += r.calories;
        days[day].count++;
    });
    
    const dayCount = Object.keys(days).length;
    const avgCalories = Math.round(records.reduce((sum, r) => sum + r.calories, 0) / dayCount);
    
    document.getElementById('avgCalories').textContent = avgCalories;
    document.getElementById('recordDays').textContent = dayCount;
    
    // 对比上周
    if (currentDietView === 'week') {
        const lastWeekStart = new Date(startDate);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        const lastWeekEnd = new Date(endDate);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
        
        const lastWeekRecords = appData.dietRecords.filter(r => {
            const date = new Date(r.time);
            return date >= lastWeekStart && date <= lastWeekEnd;
        });
        
        if (lastWeekRecords.length > 0) {
            const lastWeekDays = {};
            lastWeekRecords.forEach(r => {
                const day = new Date(r.time).toDateString();
                if (!lastWeekDays[day]) lastWeekDays[day] = { calories: 0 };
                lastWeekDays[day].calories += r.calories;
            });
            const lastWeekAvg = Math.round(lastWeekRecords.reduce((sum, r) => sum + r.calories, 0) / Object.keys(lastWeekDays).length);
            const diff = avgCalories - lastWeekAvg;
            const diffText = diff > 0 ? `+${diff}` : `${diff}`;
            const diffClass = diff > 0 ? 'up' : 'down';
            document.getElementById('compareCalories').textContent = diffText;
            document.getElementById('compareCalories').className = `compare-value ${diffClass}`;
            document.getElementById('compareSection').style.display = 'block';
        }
    } else {
        document.getElementById('compareSection').style.display = 'none';
    }
}

// ===== BMI 计算 =====
function calculateBMI(weight, heightCm) {
    if (!weight || !heightCm) return null;
    const heightM = heightCm / 100;
    return (weight / (heightM * heightM)).toFixed(1);
}

function getBMIStatus(bmi) {
    if (bmi < 18.5) return { text: '偏瘦', class: 'underweight' };
    if (bmi < 24) return { text: '正常', class: 'normal' };
    if (bmi < 28) return { text: '偏胖', class: 'overweight' };
    return { text: '肥胖', class: 'obese' };
}

function updateBMI() {
    const latest = appData.bodyRecords[appData.bodyRecords.length - 1];
    if (!latest || !latest.weight) {
        document.getElementById('bmiCard').style.display = 'none';
        return;
    }
    
    // 假设身高 170cm（可添加身高设置）
    const height = 170;
    const bmi = calculateBMI(latest.weight, height);
    if (!bmi) {
        document.getElementById('bmiCard').style.display = 'none';
        return;
    }
    
    const status = getBMIStatus(parseFloat(bmi));
    document.getElementById('bmiCard').style.display = 'block';
    document.getElementById('bmiValue').textContent = bmi;
    document.getElementById('bmiStatus').textContent = status.text;
    document.getElementById('bmiStatus').className = `bmi-status ${status.class}`;
    
    // 更新标记位置
    const percent = Math.min(Math.max((parseFloat(bmi) - 15) / 20 * 100, 0), 100);
    document.getElementById('bmiMarker').style.left = `${percent}%`;
}

// ===== 趋势预测 =====
function updatePrediction() {
    if (appData.bodyRecords.length < 3) {
        document.getElementById('predictionCard').style.display = 'none';
        return;
    }
    
    const sorted = [...appData.bodyRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1];
    const first = sorted[0];
    
    const daysDiff = (new Date(latest.date) - new Date(first.date)) / 86400000;
    if (daysDiff < 7) {
        document.getElementById('predictionCard').style.display = 'none';
        return;
    }
    
    const weightDiff = latest.weight - first.weight;
    const dailyChange = weightDiff / daysDiff;
    const predicted30Days = latest.weight + dailyChange * 30;
    
    document.getElementById('predictionCard').style.display = 'block';
    
    let trendText, trendClass;
    if (dailyChange < -0.05) {
        trendText = '⬇️ 下降中';
    } else if (dailyChange > 0.05) {
        trendText = '⬆️ 上升中';
    } else {
        trendText = '➡️ 平稳';
    }
    
    document.getElementById('weightTrend').textContent = trendText;
    document.getElementById('predictedWeight').textContent = predicted30Days.toFixed(1) + 'kg';
    document.getElementById('predictionText').textContent = `按当前趋势，30天后体重约为 ${predicted30Days.toFixed(1)}kg`;
}

// ===== 维度切换 =====
let currentDimension = 'weight';

function switchDimension(dim) {
    currentDimension = dim;
    document.querySelectorAll('.dim-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    updateDimensionChart();
}

function updateDimensionChart() {
    if (typeof Chart === 'undefined') return;
    
    const ctx = document.getElementById('dimensionChart');
    if (!ctx || appData.bodyRecords.length < 2) return;
    
    if (window.dimensionChartInstance) {
        window.dimensionChartInstance.destroy();
    }
    
    const sorted = [...appData.bodyRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(r => new Date(r.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    const data = sorted.map(r => r[currentDimension] || 0).filter(v => v > 0);
    
    if (data.length < 2) return;
    
    const dimNames = { weight: '体重', fat: '体脂率', waist: '腰围', hip: '臀围' };
    const colors = { weight: '#5FB3A3', fat: '#7ECDC0', waist: '#F39C12', hip: '#E74C3C' };
    
    window.dimensionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.slice(-data.length),
            datasets: [{
                label: dimNames[currentDimension] || currentDimension,
                data: data,
                borderColor: colors[currentDimension] || '#5FB3A3',
                backgroundColor: (colors[currentDimension] || '#5FB3A3') + '20',
                fill: true,
                tension: 0.4,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ===== 热量收支更新 =====
function updateCalorieBalance() {
    const today = new Date().toDateString();
    
    // 今日摄入
    const dietRecords = appData.dietRecords.filter(r => new Date(r.time).toDateString() === today);
    const intake = dietRecords.reduce((sum, r) => sum + r.calories, 0);
    
    // 今日消耗
    const exerciseRecords = appData.exerciseRecords.filter(r => new Date(r.date).toDateString() === today);
    const burn = exerciseRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    
    // 基础代谢（假设1500，可根据体重计算）
    const bmr = 1500;
    const totalBurn = burn + bmr;
    
    const diff = intake - totalBurn;
    
    document.getElementById('intakeCalories').textContent = intake;
    document.getElementById('burnCalories').textContent = totalBurn;
    document.getElementById('calorieDiff').textContent = (diff > 0 ? '+' : '') + diff;
    document.getElementById('calorieDiff').className = 'balance-diff ' + (diff > 0 ? 'positive' : 'negative');
    
    // 进度条
    const max = Math.max(intake, totalBurn, 3000);
    const percent = Math.min((intake / max) * 100, 100);
    document.getElementById('balanceFill').style.width = percent + '%';
    
    // 提示
    let hint = '';
    if (diff > 500) {
        hint = '🔥 热量盈余较多，建议增加运动';
    } else if (diff > 0) {
        hint = '⚖️ 热量轻微盈余';
    } else if (diff > -500) {
        hint = '✅ 热量控制良好';
    } else {
        hint = '💪 热量缺口较大，注意营养均衡';
    }
    document.getElementById('balanceHint').textContent = hint;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定授权弹窗按钮
    const verifyBtn = document.getElementById('verifyBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyAuthCode);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAuthAndReload);
    }
    
    init();
});

// ===== 提醒功能 =====
let reminderInterval;

function saveReminderSettings() {
    const settings = {
        diet: document.getElementById('dietReminder').value,
        water: document.getElementById('waterReminder').value,
        weight: document.getElementById('weightReminder').value
    };
    appData.reminderSettings = settings;
    saveData();
    setupReminders();
    showNotification('提醒设置已保存');
}

function loadReminderSettings() {
    if (appData.reminderSettings) {
        document.getElementById('dietReminder').value = appData.reminderSettings.diet || 'off';
        document.getElementById('waterReminder').value = appData.reminderSettings.water || 'off';
        document.getElementById('weightReminder').value = appData.reminderSettings.weight || 'off';
    }
}

function setupReminders() {
    // 清除旧提醒
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
    
    const settings = appData.reminderSettings || {};
    
    // 设置喝水提醒
    if (settings.water && settings.water !== 'off') {
        const interval = parseInt(settings.water) * 60 * 1000;
        reminderInterval = setInterval(() => {
            showNotification('💧 该喝水了！保持水分充足');
        }, interval);
    }
    
    // 检查是否需要饮食提醒（每小时检查一次）
    setInterval(() => {
        checkDietReminder();
        checkWeightReminder();
    }, 60 * 60 * 1000);
}

function checkDietReminder() {
    const settings = appData.reminderSettings || {};
    if (settings.diet === 'off') return;
    
    const hour = new Date().getHours();
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    );
    
    // 早餐提醒 (8-10点)
    if (hour >= 8 && hour <= 10 && todayRecords.length === 0) {
        showNotification('🍳 该记录早餐了！');
    }
    // 午餐提醒 (12-14点)
    else if (hour >= 12 && hour <= 14 && todayRecords.length < 2 && settings.diet === '3') {
        showNotification('🍱 该记录午餐了！');
    }
    // 晚餐提醒 (18-20点)
    else if (hour >= 18 && hour <= 20 && todayRecords.length < 3 && settings.diet === '3') {
        showNotification('🍽️ 该记录晚餐了！');
    }
}

function checkWeightReminder() {
    const settings = appData.reminderSettings || {};
    if (settings.weight === 'off') return;
    
    const today = new Date().toDateString();
    const lastRecord = appData.bodyRecords[appData.bodyRecords.length - 1];
    
    if (!lastRecord) {
        showNotification('📏 还没有体重记录，开始记录吧！');
        return;
    }
    
    const lastDate = new Date(lastRecord.date).toDateString();
    const daysSince = Math.floor((new Date() - new Date(lastRecord.date)) / 86400000);
    
    if (settings.weight === 'daily' && lastDate !== today) {
        showNotification('📏 今天还没有记录体重哦！');
    } else if (settings.weight === 'weekly' && daysSince >= 7) {
        showNotification('📏 已经一周没有记录体重了！');
    }
}

function showNotification(message) {
    // 移除已有通知
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.body.appendChild(notif);
    
    // 3秒后消失
    setTimeout(() => {
        if (notif.parentElement) {
            notif.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => notif.remove(), 300);
        }
    }, 3000);
}

// ===== 目标达成庆祝 =====
function checkGoalAchieved() {
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    );
    
    if (todayRecords.length === 0) return;
    
    const totals = todayRecords.reduce((acc, r) => ({
        calories: acc.calories + r.calories,
        carbs: acc.carbs + r.carbs,
        protein: acc.protein + r.protein,
        fat: acc.fat + r.fat
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
    
    // 检查是否达成目标（示例：热量在1200-2000之间算达标）
    if (totals.calories >= 1200 && totals.calories <= 2000) {
        showCelebration('🎉 今日热量达标！', '继续保持，你是最棒的！');
    }
    
    // 喝水目标达成
    if (appData.waterConsumed >= appData.waterTarget) {
        showCelebration('💧 喝水目标达成！', '身体水分充足，代谢棒棒哒！');
    }
}

function showCelebration(emoji, text) {
    // 检查今天是否已经庆祝过
    const today = new Date().toDateString();
    if (appData.lastCelebration === today) return;
    appData.lastCelebration = today;
    saveData();
    
    const celeb = document.createElement('div');
    celeb.className = 'celebration';
    celeb.innerHTML = `
        <div class="celebration-emoji">${emoji}</div>
        <div class="celebration-text">${text}</div>
    `;
    document.body.appendChild(celeb);
    
    // 震动反馈
    vibrate([50, 100, 50, 100, 50]);
    
    // 3秒后消失
    setTimeout(() => {
        if (celeb.parentElement) {
            celeb.style.opacity = '0';
            celeb.style.transition = 'opacity 0.5s';
            setTimeout(() => celeb.remove(), 500);
        }
    }, 3000);
}

// ===== 碳循环同步到饮食 =====
function syncCarbonToDiet() {
    if (!appData.carbonSettings) {
        alert('请先设置碳循环参数');
        return;
    }
    
    const s = appData.carbonSettings;
    const isHighCarbon = isHighCarbonDay();
    const multiplier = isHighCarbon ? 1.5 : 1;
    
    // 创建同步记录
    const syncRecord = {
        id: Date.now(),
        name: isHighCarbon ? '🔥 高碳日目标' : '❄️ 低碳日目标',
        carbs: Math.round(s.baseWeight * s.carbMultiplier * multiplier * 10) / 10,
        protein: Math.round(s.baseWeight * s.proteinMultiplier * 10) / 10,
        fat: Math.round(s.baseWeight * s.fatMultiplier * 10) / 10,
        calories: 0, // 自动计算
        time: new Date().toISOString(),
        isSyncTarget: true
    };
    
    // 计算热量
    syncRecord.calories = Math.round(syncRecord.carbs * 4 + syncRecord.protein * 4 + syncRecord.fat * 9);
    
    // 添加到饮食记录
    appData.dietRecords.push(syncRecord);
    saveData();
    
    // 更新UI
    updateDietList();
    updateTodaySummary();
    updateMacroChart();
    
    showNotification(`已同步${isHighCarbon ? '高碳' : '低碳'}日目标到饮食记录`);
}

// ===== 更新碳循环目标显示 =====
function updateCarbonTargets() {
    if (!appData.carbonSettings) return;
    
    const s = appData.carbonSettings;
    const isHighCarbon = isHighCarbonDay();
    const multiplier = isHighCarbon ? 1.5 : 1;
    
    // 计算目标
    const targets = {
        carbs: Math.round(s.baseWeight * s.carbMultiplier * multiplier * 10) / 10,
        protein: Math.round(s.baseWeight * s.proteinMultiplier * 10) / 10,
        fat: Math.round(s.baseWeight * s.fatMultiplier * 10) / 10
    };
    
    // 更新首页碳循环卡片的目标显示
    document.getElementById('carbonTargetCarbs').textContent = targets.carbs + 'g';
    document.getElementById('carbonTargetProtein').textContent = targets.protein + 'g';
    document.getElementById('carbonTargetFat').textContent = targets.fat + 'g';
    
    // 显示碳循环卡片
    document.getElementById('carbonCard').style.display = 'block';
    document.getElementById('carbonDayType').textContent = isHighCarbon ? '今日: 高碳日 🔥' : '今日: 低碳日 ❄️';
    
    // 立即更新进度显示
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today && !r.isSyncTarget
    );
    const totals = todayRecords.reduce((acc, r) => ({
        carbs: acc.carbs + r.carbs,
        protein: acc.protein + r.protein,
        fat: acc.fat + r.fat
    }), { carbs: 0, protein: 0, fat: 0 });
    
    updateProgressBar('carbs', totals.carbs, targets.carbs);
    updateProgressBar('protein', totals.protein, targets.protein);
    updateProgressBar('fat', totals.fat, targets.fat);
    
    // 更新碳循环页面进度
    const carbsPercent = Math.min((totals.carbs / targets.carbs) * 100, 100);
    document.getElementById('carbonProgress').style.width = carbsPercent + '%';
    document.getElementById('carbonProgressText').textContent = `碳水 ${totals.carbs.toFixed(0)}/${targets.carbs.toFixed(0)}g`;
}

// ===== 首页提醒控制 =====
function updateHomeReminder(type, value) {
    if (!appData.reminderSettings) {
        appData.reminderSettings = {};
    }
    appData.reminderSettings[type] = value;
    saveData();
    
    // 同步到设置页面的选择框
    if (type === 'water') {
        document.getElementById('waterReminder').value = value;
    } else if (type === 'diet') {
        document.getElementById('dietReminder').value = value;
    } else if (type === 'weight') {
        document.getElementById('weightReminder').value = value;
    }
    
    setupReminders();
    showNotification('提醒设置已更新');
}

function loadHomeReminders() {
    if (appData.reminderSettings) {
        document.getElementById('homeWaterReminder').value = appData.reminderSettings.water || 'off';
        document.getElementById('homeDietReminder').value = appData.reminderSettings.diet || 'off';
        document.getElementById('homeWeightReminder').value = appData.reminderSettings.weight || 'off';
    }
}

// ===== 成就徽章系统 =====
const BADGES = [
    { id: 'first_record', emoji: '📝', name: '初次记录', desc: '记录第一条饮食', condition: (data) => data.dietRecords.length >= 1 },
    { id: 'week_streak', emoji: '🔥', name: '连续7天', desc: '连续记录7天', condition: (data) => getConsecutiveDays(data) >= 7 },
    { id: 'month_streak', emoji: '💎', name: '连续30天', desc: '连续记录30天', condition: (data) => getConsecutiveDays(data) >= 30 },
    { id: 'water_master', emoji: '💧', name: '喝水达人', desc: '喝水达标7天', condition: (data) => getWaterGoalDays(data) >= 7 },
    { id: 'weight_down', emoji: '⬇️', name: '减重成功', desc: '体重减少5kg', condition: (data) => getWeightLoss(data) >= 5 },
    { id: 'perfect_week', emoji: '🌟', name: '完美一周', desc: '一周热量全部达标', condition: (data) => hasPerfectWeek(data) }
];

function getConsecutiveDays(data) {
    if (data.dietRecords.length === 0) return 0;
    const days = [...new Set(data.dietRecords.map(r => new Date(r.time).toDateString()))].sort();
    let maxStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < days.length; i++) {
        const prev = new Date(days[i-1]);
        const curr = new Date(days[i]);
        const diff = (curr - prev) / 86400000;
        if (diff === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    return maxStreak;
}

function getWaterGoalDays(data) {
    // 简化实现，实际应该按天统计
    return Math.floor(data.waterConsumed / data.waterTarget);
}

function getWeightLoss(data) {
    if (data.bodyRecords.length < 2) return 0;
    const first = data.bodyRecords[0].weight;
    const last = data.bodyRecords[data.bodyRecords.length - 1].weight;
    return Math.max(0, first - last);
}

function hasPerfectWeek(data) {
    // 简化实现
    return false;
}

function updateBadges() {
    const container = document.getElementById('badgesContainer');
    if (!container) return;
    
    const earnedBadges = BADGES.filter(badge => badge.condition(appData));
    
    if (earnedBadges.length === 0) {
        document.getElementById('badgesCard').style.display = 'none';
        return;
    }
    
    document.getElementById('badgesCard').style.display = 'block';
    
    container.innerHTML = earnedBadges.map(badge => `
        <div class="badge-item">
            <span class="badge-emoji">${badge.emoji}</span>
            <span class="badge-name">${badge.name}</span>
            <span class="badge-desc">${badge.desc}</span>
        </div>
    `).join('');
}

// ===== 食物 Emoji 自动匹配 =====
const FOOD_EMOJIS = {
    '米饭': '🍚', '面条': '🍜', '面包': '🍞', '馒头': '🥟',
    '鸡蛋': '🥚', '牛奶': '🥛', '豆浆': '🥛',
    '鸡肉': '🍗', '牛肉': '🥩', '猪肉': '🥓', '鱼肉': '🐟',
    '苹果': '🍎', '香蕉': '🍌', '橙子': '🍊', '葡萄': '🍇',
    '西红柿': '🍅', '黄瓜': '🥒', '胡萝卜': '🥕', '土豆': '🥔',
    '咖啡': '☕', '茶': '🍵', '水': '💧',
    '蛋糕': '🍰', '冰淇淋': '🍦', '巧克力': '🍫'
};

function getFoodEmoji(foodName) {
    for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
        if (foodName.includes(key)) return emoji;
    }
    return '🍽️';
}

// ===== PWA 安装 =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // 显示安装按钮（安卓）
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.textContent = '📲 安装到桌面';
    }
    
    // 显示安装提示
    const installHint = document.getElementById('installHint');
    if (installHint) {
        installHint.textContent = '点击上方按钮安装到主屏幕';
    }
});

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showNotification('已添加到桌面！');
                // 隐藏安装按钮
                const installBtn = document.getElementById('installBtn');
                if (installBtn) installBtn.style.display = 'none';
            }
            deferredPrompt = null;
        });
    } else {
        // 安卓Chrome：提示用户如何添加
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (isAndroid) {
            showNotification('请点击浏览器菜单 → 添加到主屏幕');
        } else {
            showNotification('请使用浏览器菜单添加到主屏幕');
        }
    }
}

// 检测是否已安装
window.addEventListener('appinstalled', () => {
    showNotification('饿魔已安装到主屏幕！');
    deferredPrompt = null;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.style.display = 'none';
});

// ===== 数据导入 =====
function importFromCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const lines = event.target.result.split('\n');
                let imported = 0;
                
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',');
                    if (cols.length >= 5) {
                        appData.dietRecords.push({
                            id: Date.now() + i,
                            name: cols[1] || '导入记录',
                            carbs: parseFloat(cols[2]) || 0,
                            protein: parseFloat(cols[3]) || 0,
                            fat: parseFloat(cols[4]) || 0,
                            calories: parseInt(cols[5]) || 0,
                            time: new Date(cols[0] || Date.now()).toISOString()
                        });
                        imported++;
                    }
                }
                
                saveData();
                updateUI();
                showNotification(`成功导入 ${imported} 条记录`);
            } catch (err) {
                alert('导入失败，请检查CSV格式');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function importFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm(`将导入 ${data.dietRecords?.length || 0} 条饮食记录，${data.bodyRecords?.length || 0} 条身体数据。确定继续吗？`)) {
                    if (data.dietRecords) {
                        data.dietRecords.forEach(r => {
                            r.id = Date.now() + Math.random();
                            appData.dietRecords.push(r);
                        });
                    }
                    if (data.bodyRecords) {
                        data.bodyRecords.forEach(r => {
                            r.id = Date.now() + Math.random();
                            appData.bodyRecords.push(r);
                        });
                    }
                    
                    saveData();
                    updateUI();
                    showNotification('导入成功！');
                }
            } catch (err) {
                alert('导入失败，请检查JSON格式');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
