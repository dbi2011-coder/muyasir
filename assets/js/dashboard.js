/**
 * ============================================================
 * 📁 الملف: assets/js/dashboard.js
 * الوصف: إدارة منطق لوحة التحكم والتجاوب مع جميع الشاشات
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    
    // 1. إعداد القائمة المتنقلة (للجوال والايباد)
    setupMobileMenu();
    
    if (!currentUser) {
        // إذا لم يكن هناك مستخدم، يتم التوجيه لصفحة الدخول
        if (!window.location.href.includes('login.html') && !window.location.href.includes('index.html')) {
            window.location.href = '../../index.html';
        }
        return;
    }

    // 2. تحديث واجهة المستخدم بالبيانات الشخصية
    updateUserInterface(currentUser);

    // 3. تحديث الإحصائيات بناءً على دور المستخدم
    if (currentUser.role === 'student') {
        updateStudentStats(currentUser.id);
    } else if (currentUser.role === 'teacher') {
        updateTeacherStats(currentUser.id);
    } else if (currentUser.role === 'admin') {
        updateAdminStats();
    }

    // 4. إعداد تحذير انتهاء الجلسة
    setupSessionWarning();
});

/**
 * دالة إعداد القائمة الجانبية في الجوال والايباد
 */
function setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content-dashboard');

    if (menuBtn && sidebar) {
        // فتح وإغلاق القائمة عند الضغط على الزر
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // إغلاق القائمة عند الضغط على المحتوى الرئيسي (في الجوال فقط)
        if (mainContent) {
            mainContent.addEventListener('click', function() {
                if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                    sidebar.classList.remove('active');
                }
            });
        }

        // إغلاق القائمة عند الضغط على أي رابط بداخلها
        const navLinks = sidebar.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }
}

/**
 * تحديث عناصر الواجهة (الاسم، الصورة الرمزية، الخ)
 */
function updateUserInterface(user) {
    const userNameElements = document.querySelectorAll('#userName, #headerStudentName');
    const userAvatarElements = document.querySelectorAll('#userAvatar, #sideAvatar');

    userNameElements.forEach(el => {
        el.textContent = user.name || 'مستخدم ميسر';
    });

    userAvatarElements.forEach(el => {
        if (user.name) {
            el.textContent = user.name.charAt(0);
        }
    });

    // تحديث الصف الدراسي للطالب في القائمة الجانبية إذا وجد
    const sideGrade = document.getElementById('sideGrade');
    if (sideGrade && user.grade) {
        sideGrade.textContent = user.grade;
    }
}

/**
 * إحصائيات المعلم (تلقائية التوزيع)
 */
function updateTeacherStats(teacherId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student' && u.teacherId == teacherId);
    
    if (document.getElementById('studentsCount')) {
        document.getElementById('studentsCount').textContent = students.length;
    }
    
    // يمكن إضافة المزيد من الإحصائيات هنا (الاختبارات، الدروس المكتملة)
}

/**
 * إحصائيات الطالب
 */
function updateStudentStats(studentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    
    const pendingTests = studentTests.filter(t => t.studentId == studentId && t.status === 'pending');
    const completedLessons = studentLessons.filter(l => l.studentId == studentId && l.status === 'completed');

    if (document.getElementById('pendingTests')) {
        document.getElementById('pendingTests').textContent = pendingTests.length;
    }
    if (document.getElementById('completedLessons')) {
        document.getElementById('completedLessons').textContent = completedLessons.length;
    }
}

/**
 * إحصائيات المدير
 */
function updateAdminStats() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const teachers = users.filter(u => u.role === 'teacher');
    
    if (document.getElementById('teachersCount')) {
        document.getElementById('teachersCount').textContent = teachers.length;
    }
}

/**
 * نظام الجلسة والخروج
 */
function setupSessionWarning() {
    // يمكن إضافة منطق تنبيه المستخدم قبل انتهاء الجلسة هنا
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../../index.html';
    }
}

// جعل الدوال متاحة عالمياً
window.logout = logout;
window.setupMobileMenu = setupMobileMenu;
