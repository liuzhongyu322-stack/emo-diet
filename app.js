// ===== 饿魔 - 科学减脂应用 v2.0 =====

// 配置
const STORAGE_KEY = 'emo_diet_data';
const USER_KEY = 'emo_user';
const USERS_KEY = 'emo_users';
const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/8a4b0195-5aad-4c33-be71-351985af8cbe';

// 全局数据
let appData = {
    dietRecords: [],
    bodyRecords: [],
    waterTarget: 2000,
    waterConsumed: 0,
    currentUser: null
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    init();
    bindEvents();
});

function init() {
    console.log('初始化开始...');
    loadData();
    checkAuth();
    console.log('初始化完成');
}

function bindEvents() {
    console.log('绑定事件...');
    
    // 登录/注册切换
    const switchToReg = document.getElementById('switchToReg');
    const switchToLogin = document.getElementById('switchToLogin');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const guestBtn = document.getElementById('guestBtn');
    
    console.log('switchToReg:', switchToReg);
    console.log('switchToLogin:', switchToLogin);
    console.log('loginBtn:', loginBtn);
    console.log('registerBtn:', registerBtn);
    console.log('guestBtn:', guestBtn);
    
    if (switchToReg) switchToReg.addEventListener('click', () => switchAuthMode('register'));
    if (switchToLogin) switchToLogin.addEventListener('click', () => switchAuthMode('login'));
    if (loginBtn) loginBtn.addEventListener('click', doLogin);
    if (registerBtn) registerBtn.addEventListener('click', doRegister);
    if (guestBtn) guestBtn.addEventListener('click', guestLogin);
    
    // 回车提交
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    if (loginEmail) loginEmail.addEventListener('keypress', (e) => e.key === 'Enter' && doLogin());
    if (loginPassword) loginPassword.addEventListener('keypress', (e) => e.key === 'Enter' && doLogin());
    
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
    document.getElementById('authModal')?.classList.remove('hidden');
    document.getElementById('mainApp')?.classList.add('hidden');
}

function showMainApp() {
    document.getElementById('authModal')?.classList.add('hidden');
    document.getElementById('mainApp')?.classList.remove('hidden');
}

function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (mode === 'login') {
        loginForm?.classList.remove('hidden');
        registerForm?.classList.add('hidden');
    } else {
        loginForm?.classList.add('hidden');
        registerForm?.classList.remove('hidden');
    }
}

function doLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    
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
    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirmPassword = document.getElementById('regConfirmPassword')?.value;
    
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
    
    // 发送飞书通知
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

function showError(msg, type = 'login') {
    const errorEl = type === 'reg' ? document.getElementById('regError') : document.getElementById('authError');
    if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
        setTimeout(() => errorEl.style.display = 'none', 3000);
    }
}

// ===== 飞书通知 =====
function sendToFeishu(data) {
    const text = `🎉 饿魔新用户注册！\n\n类型：${data.type}\n昵称：${data.name}\n邮箱：${data.email}\n时间：${new Date().toLocaleString('zh-CN')}`;
    
    fetch(FEISHU_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            msg_type: 'text',
            content: { text: text }
        })
    }).catch(err => console.log('飞书通知失败:', err));
}

// ===== 数据管理 =====
function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        appData = { ...appData, ...JSON.parse(saved) };
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
    updateWaterStatus();
}

function updateTodaySummary() {
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    );
    
    const totalCalories = todayRecords.reduce((sum, r) => sum + (r.calories || 0), 0);
    const totalCarbs = todayRecords.reduce((sum, r) => sum + (r.carbs || 0), 0);
    const totalProtein = todayRecords.reduce((sum, r) => sum + (r.protein || 0), 0);
    const totalFat = todayRecords.reduce((sum, r) => sum + (r.fat || 0), 0);
    
    const caloriesEl = document.getElementById('todayCalories');
    const carbsEl = document.getElementById('todayCarbs');
    const proteinEl = document.getElementById('todayProtein');
    const fatEl = document.getElementById('todayFat');
    
    if (caloriesEl) caloriesEl.textContent = Math.round(totalCalories);
    if (carbsEl) carbsEl.textContent = Math.round(totalCarbs);
    if (proteinEl) proteinEl.textContent = Math.round(totalProtein);
    if (fatEl) fatEl.textContent = Math.round(totalFat);
    
    // 更新环形进度
    const ringFill = document.getElementById('caloriesRingFill');
    if (ringFill) {
        const target = 2000;
        const progress = Math.min(totalCalories / target, 1);
        const offset = 327 - (327 * progress);
        ringFill.style.strokeDashoffset = offset;
    }
}

function updateDietList() {
    const list = document.getElementById('dietList');
    if (!list) return;
    
    const today = new Date().toDateString();
    const todayRecords = appData.dietRecords.filter(r => 
        new Date(r.time).toDateString() === today
    ).sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (todayRecords.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-5);">今天还没有记录</p>';
        return;
    }
    
    list.innerHTML = todayRecords.map(r => `
        <div class="record-item">
            <div class="record-icon">🍽️</div>
            <div class="record-info">
                <div class="record-title">${r.name}</div>
                <div class="record-meta">${new Date(r.time).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
            <div class="record-stats">
                <div class="record-calories">${Math.round(r.calories)} kcal</div>
                <div class="record-macros">C:${Math.round(r.carbs)} P:${Math.round(r.protein)} F:${Math.round(r.fat)}</div>
            </div>
        </div>
    `).join('');
}

function updateBodyList() {
    const list = document.getElementById('bodyList');
    if (!list) return;
    
    const recentRecords = appData.bodyRecords.slice(-7).reverse();
    
    if (recentRecords.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-5);">还没有身体数据</p>';
        return;
    }
    
    list.innerHTML = recentRecords.map(r => `
        <div class="record-item">
            <div class="record-icon">📊</div>
            <div class="record-info">
                <div class="record-title">${new Date(r.time).toLocaleDateString('zh-CN')}</div>
                <div class="record-meta">体重: ${r.weight}kg ${r.fat ? '体脂: ' + r.fat + '%' : ''}</div>
            </div>
        </div>
    `).join('');
}

function updateWaterStatus() {
    const waterConsumedEl = document.getElementById('waterConsumed');
    const waterTargetEl = document.getElementById('waterTarget');
    if (waterConsumedEl) waterConsumedEl.textContent = appData.waterConsumed;
    if (waterTargetEl) waterTargetEl.textContent = appData.waterTarget;
}

// ===== 功能操作 =====
function showDietInput(method) {
    document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    // 简化版只支持手动输入
}

function addDietRecord() {
    const name = document.getElementById('foodName')?.value.trim();
    const carbs = parseFloat(document.getElementById('carbs')?.value) || 0;
    const protein = parseFloat(document.getElementById('protein')?.value) || 0;
    const fat = parseFloat(document.getElementById('fat')?.value) || 0;
    
    if (!name) {
        showNotification('请输入食物名称');
        return;
    }
    
    const calories = carbs * 4 + protein * 4 + fat * 9;
    
    const record = {
        id: Date.now(),
        name: name,
        carbs: carbs,
        protein: protein,
        fat: fat,
        calories: calories,
        time: new Date().toISOString()
    };
    
    appData.dietRecords.push(record);
    saveData();
    updateUI();
    
    // 清空表单
    document.getElementById('foodName').value = '';
    document.getElementById('carbs').value = '';
    document.getElementById('protein').value = '';
    document.getElementById('fat').value = '';
    
    showNotification('记录添加成功！');
}

function addBodyRecord() {
    const weight = parseFloat(document.getElementById('bodyWeight')?.value);
    const fat = parseFloat(document.getElementById('bodyFat')?.value) || null;
    
    if (!weight) {
        showNotification('请输入体重');
        return;
    }
    
    const record = {
        id: Date.now(),
        weight: weight,
        fat: fat,
        time: new Date().toISOString()
    };
    
    appData.bodyRecords.push(record);
    saveData();
    updateUI();
    
    document.getElementById('bodyWeight').value = '';
    document.getElementById('bodyFat').value = '';
    
    showNotification('身体数据记录成功！');
}

function addWater(amount) {
    appData.waterConsumed += amount;
    saveData();
    updateWaterStatus();
    showNotification(`已添加 ${amount}ml 喝水记录`);
}

function showSettingsModal() {
    alert('设置功能开发中...');
}

// ===== 通知 =====
function showNotification(msg) {
    // 创建通知元素
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--primary);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        animation: slideDown 0.3s ease;
    `;
    notif.textContent = msg;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);
