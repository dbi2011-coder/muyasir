/* ============================================================
   ملف التحكم في لوحة القيادة - dashboard.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // --- [جديد] كود تفعيل القائمة للجوال والآيباد ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    // إنشاء طبقة التعتيم الخلفية تلقائياً
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (mobileBtn && sidebar) {
        // فتح/إغلاق القائمة
        mobileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // إغلاق عند الضغط خارج القائمة
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
        
        // إغلاق القائمة عند اختيار رابط (لراحة المستخدم في الجوال)
        sidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if(window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });
    }

    // --- [أصلي] الكود الخاص بك كما هو ---
    
    checkAuth();
    loadUserInfo();
    
    if (document.getElementById('totalStudents')) {
        loadDashboardStats();
    }
});

// --- الدوال الأصلية (لم يتم تغييرها) ---

function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        // يمكن تعديل المسار حسب هيكلة ملفاتك
        window.location.href = '../../index.html';
    }
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
        const nameElement = document.getElementById('userName');
        if (nameElement) {
            nameElement.textContent = user.name;
        }
    }
}

function loadDashboardStats() {
    const user = JSON.parse(sessionStorage.getItem('currentUser')).user;
    
    // جلب البيانات مع التعامل مع الاحتمالات الفارغة
    const students = JSON.parse(localStorage.getItem('students') || '[]').filter(s => s.teacherId === user.id);
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === user.id);
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === user.id);
    
    if(document.getElementById('totalStudents')) document.getElementById('totalStudents').textContent = students.length;
    if(document.getElementById('activeLessons')) document.getElementById('activeLessons').textContent = lessons.length;
    if(document.getElementById('completedTests')) document.getElementById('completedTests').textContent = tests.length;
}

// دوال مساعدة
function showSuccess(message) { alert('✅ ' + message); }
function showError(message) { alert('❌ ' + message); }
function showConfirmModal(message, onConfirm) { if(confirm(message)) onConfirm(); }
