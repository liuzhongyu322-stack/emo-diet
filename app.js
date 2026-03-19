// 配置
const USER_KEY = 'emo_user';
const USERS_KEY = 'emo_users';
const FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/8a4b0195-5aad-4c33-be71-351985af8cbe';

// 检查登录
function checkAuth() {
    const user = localStorage.getItem(USER_KEY);
    if (user) {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('mainApp').classList.remove('hidden');
    } else {
        document.getElementById('authModal').style.display = 'flex';
    }
}

// 切换视图
function showLoginView() {
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('registerView').style.display = 'none';
}

function showRegisterView() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('registerView').style.display = 'block';
}

// 切换标签
function switchAuthTab(tab) {
    document.getElementById('emailAuthForm').style.display = tab === 'email' ? 'block' : 'none';
    document.getElementById('phoneAuthForm').style.display = tab === 'phone' ? 'block' : 'none';
}

function switchRegTab(tab) {
    document.getElementById('emailRegForm').style.display = tab === 'email' ? 'block' : 'none';
    document.getElementById('phoneRegForm').style.display = tab === 'phone' ? 'block' : 'none';
}

// 发送验证码
function sendLoginCode() {
    alert('验证码：123456（演示用）');
}

function sendRegCode() {
    alert('验证码：123456（演示用）');
}

// 登录
function doEmailLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return alert('请输入邮箱和密码');
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        location.reload();
    } else {
        alert('邮箱或密码错误');
    }
}

function doPhoneLogin() {
    const phone = document.getElementById('loginPhone').value;
    const code = document.getElementById('loginCode').value;
    if (!phone || !code) return alert('请输入手机号和验证码');
    if (code !== '123456') return alert('验证码错误');
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let user = users.find(u => u.phone === phone);
    
    if (!user) {
        user = { id: Date.now(), name: '用户' + phone.slice(-4), phone: phone, email: phone + '@phone.user', password: 'phone_' + phone };
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        sendToFeishu({ type: '手机登录（自动注册）', name: user.name, phone: phone });
    }
    
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    location.reload();
}

// 注册
function doEmailRegister() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    
    if (!name || !email || !password) return alert('请填写完整信息');
    if (password.length < 6) return alert('密码至少6位');
    if (password !== password2) return alert('两次密码不一致');
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.email === email)) return alert('该邮箱已注册');
    
    const user = { id: Date.now(), name: name, email: email, password: password };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    sendToFeishu({ type: '邮箱注册', name: name, email: email });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    location.reload();
}

function doPhoneRegister() {
    const name = document.getElementById('regPhoneName').value;
    const phone = document.getElementById('regPhone').value;
    const code = document.getElementById('regCode').value;
    
    if (!name || !phone || !code) return alert('请填写完整信息');
    if (code !== '123456') return alert('验证码错误');
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (users.find(u => u.phone === phone)) return alert('该手机号已注册');
    
    const user = { id: Date.now(), name: name, phone: phone, email: phone + '@phone.user', password: 'phone_' + phone };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    sendToFeishu({ type: '手机注册', name: name, phone: phone });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    location.reload();
}

// 游客模式
function guestLogin() {
    const user = { id: 'guest_' + Date.now(), name: '游客', email: 'guest@demo.com', isGuest: true };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    location.reload();
}

// 退出
function logout() {
    localStorage.removeItem(USER_KEY);
    location.reload();
}

// 飞书通知
function sendToFeishu(data) {
    fetch(FEISHU_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            msg_type: 'text',
            content: { text: `🎉 新用户！\n类型：${data.type}\n昵称：${data.name}\n${data.email ? '邮箱：' + data.email : '手机：' + data.phone}\n时间：${new Date().toLocaleString('zh-CN')}` }
        })
    }).catch(() => {});
}

// 初始化
checkAuth();
