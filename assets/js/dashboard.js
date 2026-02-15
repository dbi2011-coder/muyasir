/* ============================================================
   ملف التحكم في لوحة القيادة - Dashboard JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. تفعيل زر القائمة للجوال (Mobile Menu Toggle)
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    // إنشاء طبقة التعتيم (Overlay) ديناميكياً إذا لم تكن موجودة
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // منع انتقال النقرة
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        // إغلاق القائمة عند الضغط على طبقة التعتيم
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });

        // إغلاق القائمة عند اختيار عنصر منها (للجوال)
        const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });
    }

    // 2. التحقق من تسجيل الدخول (Auth Check)
    checkAuth();
    
    // 3. تحميل اسم المستخدم
    loadUserInfo();
    
    // 4. تحميل الإحصائيات (إذا كنا في الصفحة الرئيسية للوحة التحكم)
    if (document.getElementById('totalStudents')) {
        loadDashboardStats();
    }
});

// وظيفة التحقق من تسجيل الدخول
function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (!user) {
        window.location.href = '../../index.html';
    }
}

// وظيفة تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../../index.html';
    }
}

// تحميل بيانات المستخدم
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

// تحميل إحصائيات لوحة التحكم (وهمية للعرض أو حقيقية من التخزين)
function loadDashboardStats() {
    const user = JSON.parse(sessionStorage.getItem('currentUser')).user;
    
    // جلب البيانات من LocalStorage
    const students = JSON.parse(localStorage.getItem('students') || '[]').filter(s => s.teacherId === user.id);
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]').filter(l => l.teacherId === user.id);
    const tests = JSON.parse(localStorage.getItem('tests') || '[]').filter(t => t.teacherId === user.id);
    
    // تحديث الأرقام في الواجهة
    updateStat('totalStudents', students.length);
    updateStat('activeLessons', lessons.length);
    updateStat('completedTests', tests.length);
}

function updateStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// دوال مساعدة عامة (تستخدم في صفحات أخرى)
function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

function showConfirmModal(message, onConfirm) {
    if(confirm(message)) {
        onConfirm();
    }
}
