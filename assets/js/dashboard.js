// ============================================
// 📁 الملف: assets/js/dashboard.js
// الوصف: إدارة منطق لوحة التحكم (توحيد حساب نسبة التقدم)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    setupMobileMenu();

    if (!currentUser) return;

    updateUserInterface(currentUser);

    if (currentUser.role === 'student') {
        updateStudentStats(currentUser.id);
    } else if (currentUser.role === 'teacher') {
        updateTeacherStats(currentUser.id);
    } else if (currentUser.role === 'admin') {
        updateAdminStats();
    }

    setupSessionWarning();
});

// ----------------------------------------------------------------
// 1. إحصائيات الطالب (توحيد نسبة التقدم)
// ----------------------------------------------------------------
function updateStudentStats(studentId) {
    if (!document.getElementById('pendingTests')) return;

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');

    const pendingTestsCount = studentTests.filter(t => t.studentId == studentId && t.status === 'pending').length;
    document.getElementById('pendingTests').textContent = pendingTestsCount;

    const currentLessonsCount = studentLessons.filter(l => l.studentId == studentId && (l.status === 'pending' || l.status === 'started' || l.status === 'struggling' || l.status === 'returned')).length;
    document.getElementById('currentLessons').textContent = currentLessonsCount;

    const pendingAssignmentsCount = studentAssignments.filter(a => a.studentId == studentId && a.status === 'pending').length;
    document.getElementById('pendingAssignments').textContent = pendingAssignmentsCount;

    // 🔥 حساب وتحديث نسبة التقدم لتتطابق مع تقرير الإنجاز 🔥
    const myLessons = studentLessons.filter(l => l.studentId == studentId);
    let progress = 0;
    if (myLessons.length > 0) {
        const completedLessons = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
        progress = Math.round((completedLessons / myLessons.length) * 100);
    }
    
    // تحديث النص
    const progressText = document.getElementById('progressPercentage');
    if (progressText) progressText.textContent = progress + '%';

    // تحديث الشريط البصري
    const progressBar = document.getElementById('studentProgressBar') || document.querySelector('.progress-bar-fill');
    if (progressBar) {
        progressBar.style.width = progress + '%';
        if (progress >= 80) progressBar.style.backgroundColor = '#28a745';
        else if (progress >= 50) progressBar.style.backgroundColor = '#17a2b8';
        else progressBar.style.backgroundColor = '#ffc107';
    }
}

// ----------------------------------------------------------------
// 2. إحصائيات المعلم
// ----------------------------------------------------------------
function updateTeacherStats(teacherId) {
    if (!document.getElementById('studentsCount')) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const lessons = JSON.parse(localStorage.getItem('lessons') || '[]');
    const assignments = JSON.parse(localStorage.getItem('assignments') || '[]');
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');

    const myStudentsCount = users.filter(u => u.role === 'student').length; 
    document.getElementById('studentsCount').textContent = myStudentsCount;

    const myLessonsCount = lessons.length; 
    document.getElementById('lessonsCount').textContent = myLessonsCount;

    const myAssignmentsCount = assignments.length;
    document.getElementById('assignmentsCount').textContent = myAssignmentsCount;

    const unreadMsgCount = messages.filter(m => m.toId == teacherId && !m.isRead).length;
    document.getElementById('unreadMessages').textContent = unreadMsgCount;
}

// ----------------------------------------------------------------
// 3. إحصائيات المدير
// ----------------------------------------------------------------
function updateAdminStats() {
    if (!document.getElementById('teachersCount')) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const teachersCount = users.filter(u => u.role === 'teacher').length;
    document.getElementById('teachersCount').textContent = teachersCount;

    const studentsCount = users.filter(u => u.role === 'student').length;
    if(document.getElementById('studentsCount')) {
        document.getElementById('studentsCount').textContent = studentsCount;
    }

    const activeSessions = Math.floor(Math.random() * 5) + 1; 
    if(document.getElementById('activeSessions')) {
        document.getElementById('activeSessions').textContent = activeSessions;
    }

    const pendingActions = users.filter(u => u.status === 'suspended' || u.status === 'pending').length;
    if(document.getElementById('pendingActions')) {
        document.getElementById('pendingActions').textContent = pendingActions;
    }
}

function updateUserInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        if (user.role === 'teacher') userNameElement.textContent = `أ/ ${user.name}`;
        else if (user.role === 'admin') userNameElement.textContent = 'مدير النظام';
        else if (user.role === 'student') userNameElement.textContent = user.name;
        else userNameElement.textContent = user.name;
    }
    
    if (userAvatarElement) userAvatarElement.textContent = user.name.charAt(0);
    updatePageTitle(user.role);
}

function updatePageTitle(role) {
    const titles = { 'admin': 'لوحة تحكم المدير', 'teacher': 'لوحة تحكم المعلم', 'student': 'لوحة تحكم الطالب', 'committee': 'لوحة تحكم اللجنة' };
    const title = titles[role] || 'لوحة التحكم';
    if (document.title === 'ميسر التعلم') document.title = `${title} - ميسر التعلم`;
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuBtn && sidebar) {
        const newBtn = mobileMenuBtn.cloneNode(true);
        mobileMenuBtn.parentNode.replaceChild(newBtn, mobileMenuBtn);
        
        newBtn.addEventListener('click', function(e) { e.stopPropagation(); sidebar.classList.toggle('active'); });

        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnMenuBtn = newBtn.contains(event.target);
                if (!isClickInsideSidebar && !isClickOnMenuBtn && sidebar.classList.contains('active')) { sidebar.classList.remove('active'); }
            }
        });
    }
}

function getCurrentUser() {
    try { const session = sessionStorage.getItem('currentUser'); return session ? JSON.parse(session) : null; } 
    catch (e) { return null; }
}

function logout() { sessionStorage.removeItem('currentUser'); window.location.href = '../../index.html'; }

function checkAuth() {
    const user = getCurrentUser();
    if (!user) { window.location.href = '../../index.html'; return null; }
    return user;
}

function generateId() { return Math.floor(Math.random() * 1000000) + 1; }

function setupSessionWarning() {
    setInterval(() => {
        const loginTime = sessionStorage.getItem('loginTime');
        if (loginTime) {
            const now = new Date(); const loginDate = new Date(loginTime); const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            if (hoursDiff > 7.5) showSessionWarningUI();
        }
    }, 60000); 
}

function showSessionWarningUI() {
    if (!document.getElementById('sessionWarning')) {
        const warning = document.createElement('div'); warning.id = 'sessionWarning';
        warning.style.cssText = `position: fixed; bottom: 20px; left: 20px; right: 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; color: #856404;`;
        warning.innerHTML = `<span>⚠️ جلسة العمل ستنتهي قريباً. يرجى حفظ العمل الحالي.</span><button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">✕</button>`;
        document.body.appendChild(warning);
        setTimeout(() => { if (warning.parentElement) warning.remove(); }, 30000);
    }
}

function showNotifications() { /* يمكن تفعيلها لاحقاً */ }
