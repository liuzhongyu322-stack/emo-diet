// ===== 饿魔 - 科学减脂应用 =====

// 数据存储键名
const STORAGE_KEY = 'emo_diet_data';
const AUTH_KEY = 'emo_auth_code';
const SHARE_AUTH_KEY = 'emo_share_auth';
const USER_KEY = 'emo_current_user';
const USERS_KEY = 'emo_users';

// 飞书 Webhook 地址
const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/8a4b0195-5aad-4c33-be71-351985af8cbe';

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

// 当前用户
let currentUser = null;

// 初始化
function init() {
    console.log('初始化开始...');
    loadData();
    console.log('数据加载完成，ownerCode:', appData.ownerCode);
    checkAuth();
}

// ===== 用户认证系统 =====
function checkAuth() {
    // 检查是否已登录用户
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserData();
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        updateUI();
        return;
    }
    
    // 显示登录弹窗
    document.getElementById('authModal').classList.remove('hidden');
}

// 切换登录/注册视图
function showLoginView() {
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('registerView').style.display = 'none';
}

function showRegisterView() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('registerView').style.display = 'block';
}

// 切换登录方式
function switchAuthTab(tab) {
    const emailBtn = document.getElementById('authTabEmail');
    const phoneBtn = document.getElementById('authTabPhone');
    const emailForm = document.getElementById('emailAuthForm');
    const phoneForm = document.getElementById('phoneAuthForm');
    
    if (tab === 'email') {
        emailBtn.style.background = 'var(--primary)';
        emailBtn.style.color = 'white';
        emailBtn.style.border = 'none';
        phoneBtn.style.background = 'var(--bg)';
        phoneBtn.style.color = 'var(--text)';
        phoneBtn.style.border = '1px solid var(--border)';
        emailForm.style.display = 'block';
        phoneForm.style.display = 'none';
    } else {
        emailBtn.style.background = 'var(--bg)';
        emailBtn.style.color = 'var(--text)';
        emailBtn.style.border = '1px solid var(--border)';
        phoneBtn.style.background = 'var(--primary)';
        phoneBtn.style.color = 'white';
        phoneBtn.style.border = 'none';
        emailForm.style.display = 'none';
        phoneForm.style.display = 'block';
    }
}

// 切换注册方式
function switchRegTab(tab) {
    const emailBtn = document.getElementById('regTabEmail');
    const phoneBtn = document.getElementById('regTabPhone');
    const emailForm = document.getElementById('emailRegForm');
    const phoneForm = document.getElementById('phoneRegForm');
    
    if (tab === 'email') {
        emailBtn.style.background = 'var(--primary)';
        emailBtn.style.color = 'white';
        emailBtn.style.border = 'none';
        phoneBtn.style.background = 'var(--bg)';
        phoneBtn.style.color = 'var(--text)';
        phoneBtn.style.border = '1px solid var(--border)';
        emailForm.style.display = 'block';
        phoneForm.style.display = 'none';
    } else {
        emailBtn.style.background = 'var(--bg)';
        emailBtn.style.color = 'var(--text)';
        emailBtn.style.border = '1px solid var(--border)';
        phoneBtn.style.background = 'var(--primary)';
        phoneBtn.style.color = 'white';
        phoneBtn.style.border = 'none';
        emailForm.style.display = 'none';
        phoneForm.style.display = 'block';
    }
}// 发送验证码
let codeTimer = null;
function sendLoginCode() {
    const phone = document.getElementById('loginPhone').value;
    if (!phone || phone.length !== 11) {
        showError('请输入正确的11位手机号');
        return;
    }
    
    const btn = document.getElementById('sendCodeBtn');
    let seconds = 60;
    btn.disabled = true;
    btn.textContent = seconds + 's';
    
    // 模拟验证码
    const mockCode = '123456';
    sessionStorage.setItem('verifyCode_' + phone, mockCode);
    showNotification('验证码已发送：' + mockCode + '（演示用）');
    
    codeTimer = setInterval(() => {
        seconds--;
        btn.textContent = seconds + 's';
        if (seconds <= 0) {
            clearInterval(codeTimer);
            btn.disabled = false;
            btn.textContent = '获取验证码';
        }
    }, 1000);
}

function sendRegCode() {
    const phone = document.getElementById('regPhone').value;
    if (!phone || phone.length !== 11) {
        showError('请输入正确的11位手机号', 'reg');
        return;
    }
    
    const btn = document.getElementById('sendRegCodeBtn');
    let seconds = 60;
    btn.disabled = true;
    btn.textContent = seconds + 's';
    
    const mockCode = '123456';
    sessionStorage.setItem('verifyCode_' + phone, mockCode);
    showNotification('验证码已发送：' + mockCode + '（演示用）');
    
    codeTimer = setInterval(() => {
        seconds--;
        btn.textContent = seconds + 's';
        if (seconds <= 0) {
            clearInterval(codeTimer);
            btn.disabled = false;
            btn.textContent = '获取验证码';
        }
    }, 1000);
}

// 邮箱登录
function doEmailLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('请输入邮箱和密码');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = {
            id: user.id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            loginAt: new Date().toISOString()
        };
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        loadUserData();
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        updateUI();
        showNotification('登录成功！');
    } else {
        showError('邮箱或密码错误');
    }
}

// 手机登录
function doPhoneLogin() {
    const phone = document.getElementById('loginPhone').value;
    const code = document.getElementById('loginCode').value;
    
    if (!phone || phone.length !== 11) {
        showError('请输入正确的手机号');
        return;
    }
    
    if (!code || code.length !== 6) {
        showError('请输入6位验证码');
        return;
    }
    
    const storedCode = sessionStorage.getItem('verifyCode_' + phone);
    if (code !== storedCode && code !== '123456') {
        showError('验证码错误');
        return;
    }
    
    // 查找或创建用户
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let user = users.find(u => u.phone === phone);
    
    if (!user) {
        // 自动注册
        user = {
            id: 'user_' + Date.now(),
            name: '用户' + phone.slice(-4),
            phone: phone,
            email: phone + '@phone.user',
            password: 'phone_' + phone,
            createdAt: new Date().toISOString()
        };
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        
        // 发送飞书通知
        sendToFeishu({
            type: '手机登录（自动注册）',
            name: user.name,
            phone: phone,
            time: new Date().toLocaleString('zh-CN')
        });
    }
    
    currentUser = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        loginAt: new Date().toISOString()
    };
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    loadUserData();
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUI();
    showNotification('登录成功！');
}// 邮箱注册
function doEmailRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    
    if (!name || !email || !password) {
        showError('请填写完整信息', 'reg');
        return;
    }
    
    if (password.length < 6) {
        showError('密码至少6位', 'reg');
        return;
    }
    
    if (password !== password2) {
        showError('两次密码不一致', 'reg');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.email === email)) {
        showError('该邮箱已注册', 'reg');
        return;
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // 发送飞书通知
    sendToFeishu({
        type: '邮箱注册',
        name: name,
        email: email,
        time: new Date().toLocaleString('zh-CN')
    });
    
    // 自动登录
    currentUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        loginAt: new Date().toISOString()
    };
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    initUserData();
    
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUI();
    showNotification('注册成功！');
}

// 手机注册
function doPhoneRegister() {
    const name = document.getElementById('regPhoneName').value;
    const phone = document.getElementById('regPhone').value;
    const code = document.getElementById('regCode').value;
    
    if (!name) {
        showError('请输入昵称', 'reg');
        return;
    }
    
    if (!phone || phone.length !== 11) {
        showError('请输入正确的手机号', 'reg');
        return;
    }
    
    if (!code || code.length !== 6) {
        showError('请输入6位验证码', 'reg');
        return;
    }
    
    const storedCode = sessionStorage.getItem('verifyCode_' + phone);
    if (code !== storedCode && code !== '123456') {
        showError('验证码错误', 'reg');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.phone === phone)) {
        showError('该手机号已注册', 'reg');
        return;
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        name: name,
        phone: phone,
        email: phone + '@phone.user',
        password: 'phone_' + phone,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // 发送飞书通知
    sendToFeishu({
        type: '手机注册',
        name: name,
        phone: phone,
        time: new Date().toLocaleString('zh-CN')
    });
    
    // 自动登录
    currentUser = {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        name: newUser.name,
        loginAt: new Date().toISOString()
    };
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    initUserData();
    
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUI();
    showNotification('注册成功！');
}

// 游客登录
function guestLogin() {
    const guestId = 'guest_' + Date.now();
    currentUser = {
        id: guestId,
        email: 'guest@demo.com',
        name: '游客',
        isGuest: true,
        loginAt: new Date().toISOString()
    };
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    initUserData();
    
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    updateUI();
    showNotification('已以游客身份进入');
}

// 初始化用户数据
function initUserData() {
    if (!appData.carbonSettings) {
        appData.carbonSettings = {
            weight: 70,
            carbRatio: 2,
            proteinRatio: 1.5,
            fatRatio: 0.8
        };
    }
    saveData();
}

// 加载用户数据
function loadUserData() {
    if (!currentUser) return;
    console.log('加载用户数据:', currentUser.name);
}

// 发送飞书通知
function sendToFeishu(data) {
    fetch(FEISHU_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            msg_type: 'text',
            content: {
                text: `🎉 新用户注册！\n类型：${data.type}\n昵称：${data.name}\n${data.email ? '邮箱：' + data.email : '手机号：' + data.phone}\n时间：${data.time}`
            }
        })
    }).then(() => {
        console.log('Feishu notification sent');
    }).catch(err => {
        console.log('Feishu send failed:', err);
    });
}

// 显示错误信息
function showError(msg, type) {
    const errorId = type === 'reg' ? 'regError' : 'authError';
    document.getElementById(errorId).textContent = msg;
    setTimeout(() => {
        document.getElementById(errorId).textContent = '';
    }, 3000);
}

// 退出登录
function logout() {
    localStorage.removeItem(USER_KEY);
    currentUser = null;
    location.reload();
}

// 旧的授权码系统已替换为用户注册/登录系统// ===== 数据管理 =====
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// 生成分享授权码
function generateShareCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'EMO';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// 创建分享
function createShare(days) {
    const shareCode = generateShareCode();
    const shareData = {
        code: shareCode,
        expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
        created: new Date().toISOString()
    };
    
    if (!appData.shares) appData.shares = [];
    appData.shares.push(shareData);
    saveData();
    
    return shareCode;
}

// 清除缓存
function clearCache() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USERS_KEY);
    appData = {
        dietRecords: [],
        bodyRecords: [],
        carbonSettings: null,
        waterTarget: 2000,
        waterConsumed: 0,
        sleepRecords: [],
        exerciseRecords: [],
        shareAuth: null
    };
    currentUser = null;
    saveData();
    showNotification('缓存已清除');
    setTimeout(() => location.reload(), 1000);
}

// ===== 饮食记录 =====
function addDietRecord(meal, foods, note) {
    const record = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        meal: meal,
        foods: foods,
        note: note,
        calories: foods.reduce((sum, f) => sum + (f.calories || 0), 0),
        carbs: foods.reduce((sum, f) => sum + (f.carbs || 0), 0),
        protein: foods.reduce((sum, f) => sum + (f.protein || 0), 0),
        fat: foods.reduce((sum, f) => sum + (f.fat || 0), 0)
    };
    
    appData.dietRecords.push(record);
    saveData();
    updateUI();
    showNotification('记录添加成功！');
    
    // 检查成就
    checkAchievements();
}

function deleteDietRecord(id) {
    const index = appData.dietRecords.findIndex(r => r.id === id);
    if (index > -1) {
        appData.dietRecords.splice(index, 1);
        saveData();
        updateUI();
        showNotification('记录已删除');
    }
}

function getTodayRecords() {
    const today = new Date().toISOString().split('T')[0];
    return appData.dietRecords.filter(r => r.date === today);
}

function getTodayNutrition() {
    const records = getTodayRecords();
    return records.reduce((sum, r) => ({
        calories: sum.calories + r.calories,
        carbs: sum.carbs + r.carbs,
        protein: sum.protein + r.protein,
        fat: sum.fat + r.fat
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
}// ===== 身体数据记录 =====
function addBodyRecord(data) {
    const record = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        weight: data.weight,
        bodyFat: data.bodyFat,
        chest: data.chest,
        waist: data.waist,
        hip: data.hip,
        thigh: data.thigh,
        calf: data.calf,
        arm: data.arm,
        note: data.note
    };
    
    // 检查今天是否已有记录
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = appData.bodyRecords.findIndex(r => r.date === today);
    
    if (existingIndex > -1) {
        // 更新今天的记录
        appData.bodyRecords[existingIndex] = record;
    } else {
        // 添加新记录
        appData.bodyRecords.push(record);
    }
    
    // 按日期排序
    appData.bodyRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    saveData();
    updateUI();
    showNotification('身体数据已记录！');
}

function getLatestBodyRecord() {
    if (appData.bodyRecords.length === 0) return null;
    return appData.bodyRecords[appData.bodyRecords.length - 1];
}

function getBodyRecordTrend(days = 7) {
    const records = appData.bodyRecords.slice(-days);
    if (records.length < 2) return null;
    
    const latest = records[records.length - 1];
    const previous = records[0];
    
    return {
        weight: latest.weight - previous.weight,
        bodyFat: latest.bodyFat - previous.bodyFat,
        waist: latest.waist - previous.waist
    };
}

// ===== 碳循环设置 =====
function saveCarbonSettings(settings) {
    appData.carbonSettings = settings;
    saveData();
    updateUI();
    showNotification('碳循环设置已保存！');
}

function getCarbonTargets() {
    if (!appData.carbonSettings) {
        return { carbs: 150, protein: 80, fat: 50, calories: 1500 };
    }
    
    const { weight, carbRatio, proteinRatio, fatRatio } = appData.carbonSettings;
    return {
        carbs: Math.round(weight * carbRatio),
        protein: Math.round(weight * proteinRatio),
        fat: Math.round(weight * fatRatio),
        calories: Math.round(weight * (carbRatio * 4 + proteinRatio * 4 + fatRatio * 9))
    };
}

// ===== 喝水记录 =====
function addWater(amount) {
    appData.waterConsumed += amount;
    saveData();
    updateUI();
    showNotification(`已添加 ${amount}ml 饮水记录`);
}

function resetWater() {
    appData.waterConsumed = 0;
    saveData();
    updateUI();
}

// ===== 睡眠记录 =====
function addSleepRecord(bedTime, wakeTime, quality) {
    const record = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        bedTime: bedTime,
        wakeTime: wakeTime,
        quality: quality,
        duration: calculateSleepDuration(bedTime, wakeTime)
    };
    
    appData.sleepRecords.push(record);
    saveData();
    updateUI();
    showNotification('睡眠记录已添加！');
}

function calculateSleepDuration(bedTime, wakeTime) {
    const bed = new Date('2000-01-01 ' + bedTime);
    let wake = new Date('2000-01-01 ' + wakeTime);
    
    if (wake < bed) {
        wake.setDate(wake.getDate() + 1);
    }
    
    const diff = wake - bed;
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10; // 小时，保留1位小数
}

// ===== 运动记录 =====
function addExerciseRecord(type, duration, calories) {
    const record = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: type,
        duration: duration,
        calories: calories
    };
    
    appData.exerciseRecords.push(record);
    saveData();
    updateUI();
    showNotification('运动记录已添加！');
}

function getTodayExercise() {
    const today = new Date().toISOString().split('T')[0];
    return appData.exerciseRecords
        .filter(r => r.date === today)
        .reduce((sum, r) => sum + r.calories, 0);
}// ===== 成就系统 =====
const ACHIEVEMENTS = [
    { id: 'first_record', name: '初次记录', icon: '📝', desc: '完成第一次饮食记录' },
    { id: 'three_days', name: '三日坚持', icon: '🔥', desc: '连续记录3天' },
    { id: 'seven_days', name: '一周达人', icon: '⭐', desc: '连续记录7天' },
    { id: 'water_master', name: '水牛达人', icon: '💧', desc: '单日喝水超过2000ml' },
    { id: 'carbon_master', name: '碳循环大师', icon: '🔄', desc: '完成7天碳循环' },
    { id: 'weight_loss', name: '减重先锋', icon: '📉', desc: '体重下降2kg' },
    { id: 'early_bird', name: '早起鸟', icon: '🌅', desc: '连续7天8点前起床' },
    { id: 'exercise_streak', name: '运动达人', icon: '💪', desc: '连续运动7天' }
];

function checkAchievements() {
    if (!appData.achievements) appData.achievements = [];
    
    const today = new Date().toISOString().split('T')[0];
    const records = getTodayRecords();
    
    // 检查初次记录
    if (records.length >= 1 && !hasAchievement('first_record')) {
        unlockAchievement('first_record');
    }
    
    // 检查连续记录
    const streak = getRecordStreak();
    if (streak >= 3 && !hasAchievement('three_days')) {
        unlockAchievement('three_days');
    }
    if (streak >= 7 && !hasAchievement('seven_days')) {
        unlockAchievement('seven_days');
    }
    
    // 检查喝水
    if (appData.waterConsumed >= 2000 && !hasAchievement('water_master')) {
        unlockAchievement('water_master');
    }
    
    // 检查体重下降
    const weightTrend = getBodyRecordTrend(30);
    if (weightTrend && weightTrend.weight <= -2 && !hasAchievement('weight_loss')) {
        unlockAchievement('weight_loss');
    }
}

function hasAchievement(id) {
    return appData.achievements && appData.achievements.includes(id);
}

function unlockAchievement(id) {
    if (!appData.achievements) appData.achievements = [];
    appData.achievements.push(id);
    saveData();
    
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
        showNotification(`🏆 解锁成就：${achievement.name}！`);
    }
}

function getRecordStreak() {
    if (appData.dietRecords.length === 0) return 0;
    
    const dates = [...new Set(appData.dietRecords.map(r => r.date))].sort();
    let streak = 1;
    
    for (let i = dates.length - 1; i > 0; i--) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i - 1]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);
        
        if (diff === 1) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// ===== UI更新 =====
function updateUI() {
    updateDietTab();
    updateCarbonTab();
    updateBodyTab();
    updateOtherTab();
    updateBadges();
}

function updateDietTab() {
    const nutrition = getTodayNutrition();
    const targets = getCarbonTargets();
    
    // 更新热量圆环
    const caloriesPercent = Math.min((nutrition.calories / targets.calories) * 100, 100);
    document.getElementById('todayCalories').textContent = Math.round(nutrition.calories);
    const ringFill = document.getElementById('caloriesRingFill');
    if (ringFill) {
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (caloriesPercent / 100) * circumference;
        ringFill.style.strokeDashoffset = offset;
    }
    
    // 更新营养素
    document.getElementById('todayCarbs').textContent = Math.round(nutrition.carbs);
    document.getElementById('todayProtein').textContent = Math.round(nutrition.protein);
    document.getElementById('todayFat').textContent = Math.round(nutrition.fat);
    
    // 更新今日记录列表
    updateTodayDietList();
}

function updateTodayDietList() {
    const records = getTodayRecords();
    const container = document.getElementById('todayDietList');
    if (!container) return;
    
    if (records.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px;">今天还没有记录，点击下方按钮添加</p>';
        return;
    }
    
    container.innerHTML = records.map(r => `
        <div class="diet-item" onclick="showDietDetail(${r.id})">
            <div class="diet-meal">${getMealName(r.meal)}</div>
            <div class="diet-foods">${r.foods.map(f => f.name).join('、')}</div>
            <div class="diet-calories">${Math.round(r.calories)} kcal</div>
        </div>
    `).join('');
}

function getMealName(meal) {
    const names = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
    return names[meal] || meal;
}

function updateCarbonTab() {
    if (!appData.carbonSettings) return;
    
    const { weight, carbRatio, proteinRatio, fatRatio } = appData.carbonSettings;
    const targets = getCarbonTargets();
    
    // 更新显示
    const weightEl = document.getElementById('carbonWeight');
    const carbEl = document.getElementById('carbTarget');
    const proteinEl = document.getElementById('proteinTarget');
    const fatEl = document.getElementById('fatTarget');
    
    if (weightEl) weightEl.textContent = weight;
    if (carbEl) carbEl.textContent = targets.carbs;
    if (proteinEl) proteinEl.textContent = targets.protein;
    if (fatEl) fatEl.textContent = targets.fat;
}function updateBodyTab() {
    const latest = getLatestBodyRecord();
    if (!latest) return;
    
    // 更新最新数据
    const weightEl = document.getElementById('latestWeight');
    const bodyFatEl = document.getElementById('latestBodyFat');
    const waistEl = document.getElementById('latestWaist');
    
    if (weightEl) weightEl.textContent = latest.weight;
    if (bodyFatEl) bodyFatEl.textContent = latest.bodyFat || '--';
    if (waistEl) waistEl.textContent = latest.waist || '--';
    
    // 更新趋势
    const trend = getBodyRecordTrend(7);
    if (trend) {
        const weightTrendEl = document.getElementById('weightTrend');
        if (weightTrendEl) {
            const sign = trend.weight > 0 ? '+' : '';
            weightTrendEl.textContent = `${sign}${trend.weight.toFixed(1)}kg`;
            weightTrendEl.className = trend.weight > 0 ? 'trend-up' : 'trend-down';
        }
    }
    
    // 更新图表
    updateBodyCharts();
}

function updateBodyCharts() {
    updateWeightChart();
    updateDimensionChart();
}

function updateWeightChart() {
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const records = appData.bodyRecords.slice(-30); // 最近30天
    
    if (records.length < 2) return;
    
    const labels = records.map(r => r.date.slice(5)); // MM-DD
    const data = records.map(r => r.weight);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '体重',
                data: data,
                borderColor: '#5FB3A3',
                backgroundColor: 'rgba(95, 179, 163, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: false,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { 
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

let currentDimension = 'weight';
function updateDimensionChart() {
    const canvas = document.getElementById('dimensionChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const records = appData.bodyRecords.slice(-30);
    
    if (records.length < 2) return;
    
    const labels = records.map(r => r.date.slice(5));
    let data, label, color;
    
    switch(currentDimension) {
        case 'fat':
            data = records.map(r => r.bodyFat);
            label = '体脂率';
            color = '#FF6B6B';
            break;
        case 'waist':
            data = records.map(r => r.waist);
            label = '腰围';
            color = '#4ECDC4';
            break;
        case 'hip':
            data = records.map(r => r.hip);
            label = '臀围';
            color = '#95E1D3';
            break;
        default:
            data = records.map(r => r.weight);
            label = '体重';
            color = '#5FB3A3';
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { 
                    beginAtZero: false,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { 
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

function switchDimension(dim) {
    currentDimension = dim;
    
    // 更新按钮样式
    document.querySelectorAll('.dim-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateDimensionChart();
}

function updateOtherTab() {
    // 更新喝水进度
    const waterPercent = Math.min((appData.waterConsumed / appData.waterTarget) * 100, 100);
    const waterProgress = document.getElementById('waterProgress');
    const waterText = document.getElementById('waterText');
    
    if (waterProgress) {
        waterProgress.style.width = waterPercent + '%';
    }
    if (waterText) {
        waterText.textContent = `${appData.waterConsumed}/${appData.waterTarget}ml`;
    }
    
    // 更新睡眠数据
    const todaySleep = appData.sleepRecords.filter(r => r.date === new Date().toISOString().split('T')[0]);
    const sleepDuration = todaySleep.reduce((sum, r) => sum + r.duration, 0);
    const sleepEl = document.getElementById('todaySleep');
    if (sleepEl) {
        sleepEl.textContent = sleepDuration > 0 ? `${sleepDuration}小时` : '--';
    }
    
    // 更新运动数据
    const exerciseCalories = getTodayExercise();
    const exerciseEl = document.getElementById('todayExercise');
    if (exerciseEl) {
        exerciseEl.textContent = exerciseCalories > 0 ? `${exerciseCalories}kcal` : '--';
    }
}

function updateBadges() {
    const container = document.getElementById('badgesContainer');
    if (!container) return;
    
    if (!appData.achievements || appData.achievements.length === 0) {
        document.getElementById('badgesCard').style.display = 'none';
        return;
    }
    
    document.getElementById('badgesCard').style.display = 'block';
    container.innerHTML = appData.achievements.map(id => {
        const badge = ACHIEVEMENTS.find(a => a.id === id);
        if (!badge) return '';
        return `
            <div class="badge-item" title="${badge.desc}">
                <span class="badge-icon">${badge.icon}</span>
                <span class="badge-name">${badge.name}</span>
            </div>
        `;
    }).join('');
}// ===== 页面切换 =====
let currentTab = 'diet';
function switchTab(tab) {
    currentTab = tab;
    
    // 更新导航按钮
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // 显示对应内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // 更新图表（如果是身体页）
    if (tab === 'body') {
        setTimeout(() => {
            updateWeightChart();
            updateDimensionChart();
        }, 100);
    }
}

// ===== 模态框 =====
function showModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function hideModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// 饮食详情
function showDietDetail(id) {
    const record = appData.dietRecords.find(r => r.id === id);
    if (!record) return;
    
    const detailHtml = `
        <div class="modal-header">
            <h3>${getMealName(record.meal)} - ${record.date}</h3>
            <button onclick="hideModal('dietDetailModal')" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <div class="nutrition-summary">
                <div class="nutrition-item">
                    <span class="label">热量</span>
                    <span class="value">${Math.round(record.calories)} kcal</span>
                </div>
                <div class="nutrition-item">
                    <span class="label">碳水</span>
                    <span class="value">${Math.round(record.carbs)}g</span>
                </div>
                <div class="nutrition-item">
                    <span class="label">蛋白质</span>
                    <span class="value">${Math.round(record.protein)}g</span>
                </div>
                <div class="nutrition-item">
                    <span class="label">脂肪</span>
                    <span class="value">${Math.round(record.fat)}g</span>
                </div>
            </div>
            <h4>食物清单</h4>
            <div class="food-list">
                ${record.foods.map(f => `
                    <div class="food-item">
                        <span>${f.name}</span>
                        <span>${f.calories} kcal</span>
                    </div>
                `).join('')}
            </div>
            ${record.note ? `<div class="note"><strong>备注：</strong>${record.note}</div>` : ''}
        </div>
        <div class="modal-footer">
            <button onclick="deleteDietRecord(${record.id}); hideModal('dietDetailModal');" class="btn-danger">删除记录</button>
        </div>
    `;
    
    document.getElementById('dietDetailContent').innerHTML = detailHtml;
    showModal('dietDetailModal');
}

// 设置模态框
function showSettingsModal() {
    showModal('settingsModal');
}

// 分享模态框
function showShareModal() {
    const shareCode = createShare(7);
    document.getElementById('shareCode').textContent = shareCode;
    showModal('shareModal');
}

// 身体数据记录模态框
function showBodyRecordModal() {
    const latest = getLatestBodyRecord();
    if (latest) {
        document.getElementById('bodyWeight').value = latest.weight;
        document.getElementById('bodyFat').value = latest.bodyFat || '';
        document.getElementById('bodyChest').value = latest.chest || '';
        document.getElementById('bodyWaist').value = latest.waist || '';
        document.getElementById('bodyHip').value = latest.hip || '';
        document.getElementById('bodyThigh').value = latest.thigh || '';
        document.getElementById('bodyCalf').value = latest.calf || '';
        document.getElementById('bodyArm').value = latest.arm || '';
    }
    showModal('bodyRecordModal');
}

function saveBodyRecord() {
    const data = {
        weight: parseFloat(document.getElementById('bodyWeight').value),
        bodyFat: parseFloat(document.getElementById('bodyFat').value) || null,
        chest: parseFloat(document.getElementById('bodyChest').value) || null,
        waist: parseFloat(document.getElementById('bodyWaist').value) || null,
        hip: parseFloat(document.getElementById('bodyHip').value) || null,
        thigh: parseFloat(document.getElementById('bodyThigh').value) || null,
        calf: parseFloat(document.getElementById('bodyCalf').value) || null,
        arm: parseFloat(document.getElementById('bodyArm').value) || null,
        note: document.getElementById('bodyNote').value
    };
    
    if (!data.weight || data.weight < 30 || data.weight > 200) {
        showNotification('请输入有效的体重（30-200kg）');
        return;
    }
    
    addBodyRecord(data);
    hideModal('bodyRecordModal');
}

// 碳循环设置模态框
function showCarbonSettingsModal() {
    if (appData.carbonSettings) {
        document.getElementById('carbonWeight').value = appData.carbonSettings.weight;
        document.getElementById('carbRatio').value = appData.carbonSettings.carbRatio;
        document.getElementById('proteinRatio').value = appData.carbonSettings.proteinRatio;
        document.getElementById('fatRatio').value = appData.carbonSettings.fatRatio;
    }
    showModal('carbonSettingsModal');
}

function saveCarbonSettingsFromModal() {
    const settings = {
        weight: parseFloat(document.getElementById('carbonWeight').value),
        carbRatio: parseFloat(document.getElementById('carbRatio').value),
        proteinRatio: parseFloat(document.getElementById('proteinRatio').value),
        fatRatio: parseFloat(document.getElementById('fatRatio').value)
    };
    
    if (!settings.weight || settings.weight < 30 || settings.weight > 200) {
        showNotification('请输入有效的体重');
        return;
    }
    
    saveCarbonSettings(settings);
    hideModal('carbonSettingsModal');
}

// ===== 通知 =====
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}// ===== 添加饮食记录 =====
let currentMeal = 'breakfast';
function showAddDietModal(meal) {
    currentMeal = meal;
    document.getElementById('addDietTitle').textContent = '添加' + getMealName(meal);
    document.getElementById('selectedFoods').innerHTML = '';
    document.getElementById('dietNote').value = '';
    showModal('addDietModal');
}

// 食物库
const FOOD_DATABASE = [
    // 主食
    { name: '米饭', unit: '碗', calories: 174, carbs: 39, protein: 3.9, fat: 0.4, icon: '🍚' },
    { name: '馒头', unit: '个', calories: 223, carbs: 47, protein: 7, fat: 1.1, icon: '🥯' },
    { name: '面条', unit: '碗', calories: 280, carbs: 56, protein: 9, fat: 1.5, icon: '🍜' },
    { name: '燕麦粥', unit: '碗', calories: 145, carbs: 25, protein: 5, fat: 3, icon: '🥣' },
    { name: '全麦面包', unit: '片', calories: 75, carbs: 13, protein: 4, fat: 1, icon: '🍞' },
    { name: '红薯', unit: '个', calories: 130, carbs: 30, protein: 2, fat: 0.2, icon: '🍠' },
    { name: '玉米', unit: '根', calories: 86, carbs: 19, protein: 3.2, fat: 1.2, icon: '🌽' },
    // 肉蛋
    { name: '鸡蛋', unit: '个', calories: 70, carbs: 0.6, protein: 6, fat: 5, icon: '🥚' },
    { name: '鸡胸肉', unit: '100g', calories: 165, carbs: 0, protein: 31, fat: 3.6, icon: '🍗' },
    { name: '牛肉', unit: '100g', calories: 250, carbs: 0, protein: 26, fat: 15, icon: '🥩' },
    { name: '猪肉', unit: '100g', calories: 263, carbs: 0, protein: 17, fat: 21, icon: '🥓' },
    { name: '鱼肉', unit: '100g', calories: 206, carbs: 0, protein: 22, fat: 12, icon: '🐟' },
    { name: '虾', unit: '100g', calories: 85, carbs: 0, protein: 20, fat: 0.5, icon: '🦐' },
    // 蔬菜
    { name: '西兰花', unit: '100g', calories: 34, carbs: 7, protein: 2.8, fat: 0.4, icon: '🥦' },
    { name: '菠菜', unit: '100g', calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, icon: '🥬' },
    { name: '生菜', unit: '100g', calories: 15, carbs: 2.9, protein: 1.4, fat: 0.2, icon: '🥬' },
    { name: '黄瓜', unit: '根', calories: 16, carbs: 3.6, protein: 0.7, fat: 0.1, icon: '🥒' },
    { name: '番茄', unit: '个', calories: 22, carbs: 4.8, protein: 1.1, fat: 0.2, icon: '🍅' },
    { name: '胡萝卜', unit: '根', calories: 41, carbs: 9.6, protein: 0.9, fat: 0.2, icon: '🥕' },
    // 水果
    { name: '苹果', unit: '个', calories: 104, carbs: 28, protein: 0.5, fat: 0.3, icon: '🍎' },
    { name: '香蕉', unit: '根', calories: 105, carbs: 27, protein: 1.3, fat: 0.4, icon: '🍌' },
    { name: '橙子', unit: '个', calories: 62, carbs: 15, protein: 1.2, fat: 0.2, icon: '🍊' },
    { name: '葡萄', unit: '100g', calories: 62, carbs: 16, protein: 0.6, fat: 0.3, icon: '🍇' },
    { name: '草莓', unit: '100g', calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3, icon: '🍓' },
    // 饮品
    { name: '牛奶', unit: '杯', calories: 120, carbs: 17, protein: 4, fat: 4, icon: '🥛' },
    { name: '酸奶', unit: '杯', calories: 120, carbs: 17, protein: 4, fat: 4, icon: '🥛' },
    { name: '豆浆', unit: '杯', calories: 80, carbs: 10, protein: 5, fat: 2.5, icon: '🥛' },
    { name: '咖啡', unit: '杯', calories: 5, carbs: 0, protein: 0.3, fat: 0, icon: '☕' },
    // 零食
    { name: '坚果', unit: '30g', calories: 180, carbs: 6, protein: 6, fat: 15, icon: '🥜' },
    { name: '巧克力', unit: '块', calories: 150, carbs: 16, protein: 2, fat: 9, icon: '🍫' },
    { name: '薯片', unit: '包', calories: 260, carbs: 26, protein: 3, fat: 16, icon: '🥔' }
];

let selectedFoods = [];

function searchFood(keyword) {
    const results = FOOD_DATABASE.filter(f => 
        f.name.includes(keyword) || 
        f.icon.includes(keyword)
    );
    
    const container = document.getElementById('foodSearchResults');
    if (results.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:20px;">没有找到相关食物</p>';
        return;
    }
    
    container.innerHTML = results.map(f => `
        <div class="food-result-item" onclick="selectFood('${f.name}')">
            <span class="food-icon">${f.icon}</span>
            <div class="food-info">
                <span class="food-name">${f.name}</span>
                <span class="food-cal">${f.calories} kcal/${f.unit}</span>
            </div>
            <button class="add-btn">+</button>
        </div>
    `).join('');
}

function selectFood(foodName) {
    const food = FOOD_DATABASE.find(f => f.name === foodName);
    if (!food) return;
    
    const quantity = prompt(`请输入${food.name}的数量（${food.unit}）：`, '1');
    if (!quantity || quantity <= 0) return;
    
    const qty = parseFloat(quantity);
    selectedFoods.push({
        ...food,
        quantity: qty,
        totalCalories: food.calories * qty,
        totalCarbs: food.carbs * qty,
        totalProtein: food.protein * qty,
        totalFat: food.fat * qty
    });
    
    updateSelectedFoods();
}

function updateSelectedFoods() {
    const container = document.getElementById('selectedFoods');
    if (selectedFoods.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);">还没有选择食物</p>';
        return;
    }
    
    const total = selectedFoods.reduce((sum, f) => ({
        calories: sum.calories + f.totalCalories,
        carbs: sum.carbs + f.totalCarbs,
        protein: sum.protein + f.totalProtein,
        fat: sum.fat + f.totalFat
    }), { calories: 0, carbs: 0, protein: 0, fat: 0 });
    
    container.innerHTML = `
        <div class="selected-foods-list">
            ${selectedFoods.map((f, i) => `
                <div class="selected-food-item">
                    <span>${f.icon} ${f.name} x${f.quantity}</span>
                    <span>${Math.round(f.totalCalories)} kcal</span>
                    <button onclick="removeSelectedFood(${i})" class="remove-btn">×</button>
                </div>
            `).join('')}
        </div>
        <div class="selected-total">
            <span>总计：${Math.round(total.calories)} kcal</span>
            <span>碳水${Math.round(total.carbs)}g 蛋白质${Math.round(total.protein)}g 脂肪${Math.round(total.fat)}g</span>
        </div>
    `;
}

function removeSelectedFood(index) {
    selectedFoods.splice(index, 1);
    updateSelectedFoods();
}

function saveDietRecord() {
    if (selectedFoods.length === 0) {
        showNotification('请至少选择一种食物');
        return;
    }
    
    const note = document.getElementById('dietNote').value;
    addDietRecord(currentMeal, selectedFoods, note);
    
    selectedFoods = [];
    hideModal('addDietModal');
}// ===== 数据导入导出 =====
function exportData() {
    const data = {
        ...appData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `饿魔数据_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showNotification('数据已导出！');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.dietRecords && data.bodyRecords) {
                    if (confirm('导入数据将覆盖当前数据，是否继续？')) {
                        appData = {
                            dietRecords: data.dietRecords || [],
                            bodyRecords: data.bodyRecords || [],
                            carbonSettings: data.carbonSettings,
                            waterTarget: data.waterTarget || 2000,
                            waterConsumed: data.waterConsumed || 0,
                            sleepRecords: data.sleepRecords || [],
                            exerciseRecords: data.exerciseRecords || [],
                            achievements: data.achievements || [],
                            shares: data.shares || []
                        };
                        saveData();
                        updateUI();
                        showNotification('导入成功！');
                    }
                } else {
                    alert('文件格式错误');
                }
            } catch (err) {
                alert('导入失败，请检查文件格式');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== 同步身体数据到碳循环 =====
function syncFromBodyData() {
    const latest = getLatestBodyRecord();
    if (!latest) {
        showNotification('请先记录身体数据');
        return;
    }
    
    if (appData.carbonSettings) {
        appData.carbonSettings.weight = latest.weight;
        saveData();
        updateUI();
        showNotification('已同步体重到碳循环设置');
    } else {
        showNotification('请先设置碳循环参数');
    }
}

// ===== 快速添加 =====
function quickAddWater(amount) {
    addWater(amount);
}

function quickAddSleep() {
    const bedTime = document.getElementById('bedTime').value;
    const wakeTime = document.getElementById('wakeTime').value;
    const quality = document.getElementById('sleepQuality').value;
    
    if (!bedTime || !wakeTime) {
        showNotification('请输入睡觉和起床时间');
        return;
    }
    
    addSleepRecord(bedTime, wakeTime, parseInt(quality));
    hideModal('addSleepModal');
}

function quickAddExercise() {
    const type = document.getElementById('exerciseType').value;
    const duration = parseInt(document.getElementById('exerciseDuration').value);
    const calories = parseInt(document.getElementById('exerciseCalories').value);
    
    if (!type || !duration) {
        showNotification('请输入运动类型和时长');
        return;
    }
    
    addExerciseRecord(type, duration, calories || 0);
    hideModal('addExerciseModal');
}

// ===== 工具函数 =====
function formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(time) {
    return time;
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', init);

// 防止页面滚动时底部导航被遮挡
window.addEventListener('resize', () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
});

// 监听离线/在线状态
window.addEventListener('online', () => {
    showNotification('已连接到网络');
});

window.addEventListener('offline', () => {
    showNotification('已离线，数据将保存在本地');
});

// 定期自动保存（每30秒）
setInterval(() => {
    if (appData.dietRecords.length > 0 || appData.bodyRecords.length > 0) {
        saveData();
        console.log('自动保存完成');
    }
}, 30000);

// 页面可见性变化时保存
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        saveData();
    }
});

// 监听 beforeunload 事件
window.addEventListener('beforeunload', (e) => {
    saveData();
});

// ===== 反馈和建议 =====
function showFeedbackModal() {
    showModal('feedbackModal');
}

function submitFeedback() {
    const content = document.getElementById('feedbackContent').value;
    const contact = document.getElementById('feedbackContact').value;
    
    if (!content) {
        showNotification('请输入反馈内容');
        return;
    }
    
    // 保存到本地（可选发送到服务器）
    const feedback = {
        id: Date.now(),
        content: content,
        contact: contact,
        date: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    let feedbacks = JSON.parse(localStorage.getItem('emo_feedbacks') || '[]');
    feedbacks.push(feedback);
    localStorage.setItem('emo_feedbacks', JSON.stringify(feedbacks));
    
    hideModal('feedbackModal');
    document.getElementById('feedbackContent').value = '';
    document.getElementById('feedbackContact').value = '';
    showNotification('感谢您的反馈！');
}

// ===== 关于 =====
function showAboutModal() {
    showModal('aboutModal');
}

// ===== 清除数据 =====
function clearAllData() {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(USERS_KEY);
        appData = {
            dietRecords: [],
            bodyRecords: [],
            carbonSettings: null,
            waterTarget: 2000,
            waterConsumed: 0,
            sleepRecords: [],
            exerciseRecords: [],
            shareAuth: null,
            achievements: [],
            shares: []
        };
        currentUser = null;
        saveData();
        showNotification('所有数据已清除');
        setTimeout(() => location.reload(), 1000);
    }
}

// ===== 主题切换 =====
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('emo_theme', newTheme);
}

// 加载主题
function loadTheme() {
    const savedTheme = localStorage.getItem('emo_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// 初始化时加载主题
loadTheme();
