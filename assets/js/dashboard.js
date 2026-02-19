// 📁 الملف: assets/js/dashboard.js

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    
    // إعداد القائمة المتنقلة
    setupMobileMenu();

    if (!currentUser) return;

    updateUserInterface(currentUser);

    // تحديث الإحصائيات بناءً على الرتبة
    if (currentUser.role === 'student') {
        updateStudentStats(currentUser.id);
    } else if (currentUser.role === 'teacher') {
        updateTeacherStats(currentUser.id);
    } else if (currentUser.role === 'admin') {
        updateAdminStats();
    }

    setupSessionWarning();
});

// إعداد القائمة الجانبية للجوال
function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });

        // إغلاق القائمة عند الضغط في أي مكان خارجها
        document.addEventListener('click', function(event) {
            if (sidebar.classList.contains('active')) {
                const isClickInside = sidebar.contains(event.target);
                const isClickOnBtn = mobileMenuBtn.contains(event.target);
                if (!isClickInside && !isClickOnBtn) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
}

// تحديث الواجهة
function updateUserInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = (user.role === 'teacher') ? `أ/ ${user.name}` : user.name;
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }
}

// إحصائيات المعلم
function updateTeacherStats(teacherId) {
    if (!document.getElementById('studentsCount')) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');

    document.getElementById('studentsCount').textContent = users.filter(u => u.role === 'student').length;
    document.getElementById('lessonsCount').textContent = lessons.length;
    document.getElementById('unreadMessages').textContent = messages.filter(m => m.toId == teacherId && !m.isRead).length;
}

// تسجيل الخروج
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('currentUser'));
    } catch (e) { return null; }
}

function setupSessionWarning() {
    // منطق التنبيه (اختياري)
}
