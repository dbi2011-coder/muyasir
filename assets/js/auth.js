// ============================================
// 📁 الملف: assets/js/auth.js
// الوصف: نظام الدخول مع بوابة الطوارئ للمدير
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. ربط زر الدخول
    const loginBtn = document.querySelector('button');
    if(loginBtn && (loginBtn.innerText.includes('دخول') || loginBtn.innerText.includes('Login'))) {
        const newBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newBtn, loginBtn);
        newBtn.type = 'button';
        newBtn.addEventListener('click', login);
    }
    
    // 2. التحقق من الجلسة
    if (!window.location.href.includes('index.html') && !window.location.href.includes('login.html')) {
        checkAuth();
    }
});

// دالة تسجيل الدخول
function login() {
    const userInp = document.getElementById('username').value.trim();
    const passInp = document.getElementById('password').value.trim();

    if (!userInp || !passInp) {
        showAuthNotification("الرجاء إدخال البيانات", "error");
        return;
    }

    // ============================================
    // 🚨 بوابة الطوارئ (Emergency Backdoor) 🚨
    // ============================================
    // البيانات الثابتة: rescue / help999
    if (userInp === 'rescue' && passInp === 'help999') {
        showEmergencyModal(); // فتح نافذة الاستعادة
        return; // إيقاف عملية الدخول العادية
    }
    // ============================================

    // أ) تسجيل الدخول العادي
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // التأكد من وجود بيانات المدير في localStorage
    const adminData = JSON.parse(localStorage.getItem('adminData') || 'null');
    
    // تحديث/إنشاء مستخدم المدير في مصفوفة المستخدمين بناء على adminData
    if (adminData) {
        let adminIdx = users.findIndex(u => u.role === 'admin');
        if (adminIdx === -1) {
            users.push({ id: 1, name: "مدير النظام", username: adminData.username, password: adminData.password, role: "admin", status: "active" });
        } else {
            // تحديث البيانات إذا تغيرت
            users[adminIdx].username = adminData.username;
            users[adminIdx].password = adminData.password;
        }
    } else {
        // إنشاء افتراضي إذا لم يوجد
        if (!users.some(u => u.role === 'admin')) {
            users.push({ id: 1, name: "مدير النظام", username: "admin", password: "123", role: "admin", status: "active" });
            localStorage.setItem('adminData', JSON.stringify({ username: 'admin', password: '123' }));
        }
    }
    localStorage.setItem('users', JSON.stringify(users));

    // البحث عن المستخدم
    let user = users.find(u => u.username == userInp && u.password == passInp);

    if (user) {
        if (user.status === 'suspended' || user.status === 'موقوف') {
            showAuthNotification("⛔ عذراً، تم إيقاف حسابك.", "error");
            return;
        }
    }

    // ب) البحث في أعضاء اللجنة
    if (!user) {
        const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
        const member = committeeMembers.find(m => m.username === userInp && m.password === passInp);
        if (member) {
            user = { id: member.id, name: member.name, username: member.username, role: 'committee_member', title: member.role, status: 'active' };
        }
    }

    // ج) التوجيه
    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        let prefix = window.location.href.includes('/pages/') ? '../' : 'pages/';

        if (user.role === 'admin') window.location.href = prefix + 'admin/dashboard.html';
        else if (user.role === 'teacher') window.location.href = prefix + 'teacher/dashboard.html';
        else if (user.role === 'committee_member') window.location.href = prefix + 'member/dashboard.html';
        else window.location.href = prefix + 'student/dashboard.html';
    } else {
        showAuthNotification("بيانات الدخول غير صحيحة!", "error");
    }
}

// ============================================
// 🛡️ دوال الطوارئ واستعادة الحساب
// ============================================
function showEmergencyModal() {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    
    if (!adminData || (!adminData.q1 && !adminData.q2)) {
        showAuthNotification("لم يتم إعداد أسئلة الأمان للمدير بعد!", "error");
        return;
    }

    // عرض الأسئلة في النافذة
    const q1Label = document.getElementById('displayQ1');
    const q2Label = document.getElementById('displayQ2');
    
    if(q1Label) q1Label.innerText = adminData.q1 || "السؤال الأول غير محدد";
    if(q2Label) q2Label.innerText = adminData.q2 || "السؤال الثاني غير محدد";

    // إظهار النافذة
    const modal = document.getElementById('emergencyModal');
    if(modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
    }
}

function verifyEmergencyAnswers() {
    const adminData = JSON.parse(localStorage.getItem('adminData'));
    
    const ans1 = document.getElementById('inputA1').value.trim();
    const ans2 = document.getElementById('inputA2').value.trim();

    // التحقق من الإجابات (تجاهل المسافات الزائدة)
    if (ans1 === adminData.a1 && ans2 === adminData.a2) {
        // ✅ نجاح
        document.getElementById('emergencyForm').style.display = 'none';
        const resultDiv = document.getElementById('emergencyResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div style="text-align: center; color: green;">
                <h3><i class="fas fa-check-circle"></i> تم التحقق بنجاح!</h3>
                <p>بيانات الدخول الخاصة بك هي:</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #ddd; margin-top: 10px;">
                    <p><strong>اسم المستخدم:</strong> <span style="color: #2980b9">${adminData.username}</span></p>
                    <p><strong>كلمة المرور:</strong> <span style="color: #c0392b">${adminData.password}</span></p>
                </div>
                <button onclick="fillAndClose('${adminData.username}', '${adminData.password}')" class="btn btn-primary" style="margin-top: 15px; width: 100%;">
                    تعبئة البيانات والدخول
                </button>
            </div>
        `;
    } else {
        // ❌ فشل
        showAuthNotification("الإجابات غير صحيحة! حاول مرة أخرى.", "error");
    }
}

function closeEmergencyModal() {
    const modal = document.getElementById('emergencyModal');
    if(modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
    // إعادة تعيين الحقول
    document.getElementById('inputA1').value = '';
    document.getElementById('inputA2').value = '';
    document.getElementById('emergencyForm').style.display = 'block';
    document.getElementById('emergencyResult').style.display = 'none';
}

function fillAndClose(u, p) {
    document.getElementById('username').value = u;
    document.getElementById('password').value = p;
    closeEmergencyModal();
}

// دوال مساعدة أخرى
function showAuthNotification(message, type = 'info') {
    const div = document.createElement('div');
    div.innerText = message;
    div.style.position = 'fixed';
    div.style.top = '20px';
    div.style.left = '50%';
    div.style.transform = 'translateX(-50%)';
    div.style.padding = '15px 30px';
    div.style.borderRadius = '8px';
    div.style.color = '#fff';
    div.style.backgroundColor = type === 'error' ? '#e74c3c' : '#2ecc71';
    div.style.zIndex = '99999';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function checkAuth() {
    const session = sessionStorage.getItem('currentUser');
    if (!session) {
        window.location.href = '../../index.html';
        return null;
    }
    return JSON.parse(session);
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
}

// تصدير الدوال
window.login = login;
window.checkAuth = checkAuth;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.showEmergencyModal = showEmergencyModal;
window.closeEmergencyModal = closeEmergencyModal;
window.verifyEmergencyAnswers = verifyEmergencyAnswers;
window.fillAndClose = fillAndClose;
