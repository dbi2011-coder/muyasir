/* ============================================================
   ملف التحكم في لوحة القيادة - dashboard.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // ---------------------------------------------------------
    // 1. كود تفعيل القائمة الجانبية في الجوال (جديد)
    // ---------------------------------------------------------
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    // إنشاء طبقة التعتيم (Overlay) ديناميكياً
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (mobileBtn && sidebar) {
        // عند الضغط على زر القائمة
        mobileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // عند الضغط خارج القائمة لإغلاقها
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
        
        // إغلاق القائمة عند اختيار رابط (اختياري لتحسين التجربة)
        sidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if(window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });
    }

    // ---------------------------------------------------------
    // 2. الكود الأصلي الخاص بك (التحقق من الدخول والبيانات)
    // ---------------------------------------------------------
    checkAuth();
    loadUserInfo();
    
    if (document.getElementById('totalStudents')) {
        loadDashboardStats();
    }
});

// دوال المصادقة والعرض (كما هي في ملفك الأصلي)
function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) window.location.href = '../../index.html';
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../../index.html';
    }
}

function loadUserInfo() {
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        const user = JSON.parse(userStr).user;
        const nameEl = document.getElementById('userName');
        if (nameEl) nameEl.textContent = user.name;
    }
}

function loadDashboardStats() {
    // منطق تحميل الإحصائيات الأصلي الخاص بك
    const user = JSON.parse(sessionStorage.getItem('currentUser')).user;
    const students = JSON.parse(localStorage.getItem('students') || '[]').filter(s => s.teacherId === user.id);
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === user.id);
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === user.id);
    
    if(document.getElementById('totalStudents')) document.getElementById('totalStudents').textContent = students.length;
    if(document.getElementById('activeLessons')) document.getElementById('activeLessons').textContent = lessons.length;
    if(document.getElementById('completedTests')) document.getElementById('completedTests').textContent = tests.length;
}

// دوال مساعدة للنوافذ المنبثقة
function showSuccess(msg) { alert('✅ ' + msg); }
function showError(msg) { alert('❌ ' + msg); }
function showConfirmModal(msg, callback) { if(confirm(msg)) callback(); }
