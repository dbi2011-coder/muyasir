// ============================================
// 📁 الملف: assets/js/dashboard.js
// الوصف: إدارة منطق لوحة التحكم والقائمة الجانبية
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const currentUser = getCurrentUser();
    
    // إعداد القائمة المتنقلة (النسخة المحسنة)
    setupMobileMenu();

    if (!currentUser) {
        return;
    }

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
// 📱 منطق القائمة الجانبية (تم الإصلاح)
// ----------------------------------------------------------------
function toggleSidebar() {
    // 1. العثور على القائمة
    let sidebar = document.getElementById('sidebar');
    if (!sidebar) sidebar = document.querySelector('.sidebar');
    
    if (!sidebar) {
        console.error("القائمة الجانبية غير موجودة");
        return;
    }

    // 2. العثور على زر الإغلاق (إن وجد)
    const closeBtn = document.querySelector('.close-sidebar-btn');

    // 3. إدارة طبقة التعتيم (Overlay)
    let overlay = document.querySelector('.sidebar-overlay');
    
    // إذا لم تكن الطبقة موجودة، نقوم بإنشائها برمجياً
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1099;';
        overlay.onclick = toggleSidebar; // إغلاق عند الضغط عليها
        document.body.appendChild(overlay);
    }

    // 4. التبديل (فتح/إغلاق)
    sidebar.classList.toggle('active');
    
    // التحكم في ظهور الطبقة وزر الإغلاق
    if (sidebar.classList.contains('active')) {
        overlay.style.display = 'block';
        if(closeBtn) closeBtn.style.display = 'block';
    } else {
        overlay.style.display = 'none';
        if(closeBtn) closeBtn.style.display = 'none';
    }
}

// جعل الدالة عامة لتعمل مع onclick في HTML
window.toggleSidebar = toggleSidebar;

function setupMobileMenu() {
    // هذه الدالة تتأكد فقط من أن زر القائمة يعمل
    // لم نعد بحاجة لاستبدال الزر (cloneNode) لأنه يسبب المشاكل
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        // نتأكد أن الزر لا يملك مستمعات أحداث قديمة، لكن لا نستبدله
        // الاعتماد الأساسي الآن على onclick="toggleSidebar()" في الـ HTML
    }
}

// ----------------------------------------------------------------
// 1. إحصائيات الطالب
// ----------------------------------------------------------------
function updateStudentStats(studentId) {
    if (!document.getElementById('pendingTests')) return;

    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');

    const pendingTestsCount = studentTests.filter(t => t.studentId == studentId && t.status === 'pending').length;
    document.getElementById('pendingTests').textContent = pendingTestsCount;

    const currentLessonsCount = studentLessons.filter(l => l.studentId == studentId && (l.status === 'pending' || l.status === 'started')).length;
    document.getElementById('currentLessons').textContent = currentLessonsCount;

    const pendingAssignmentsCount = studentAssignments.filter(a => a.studentId == studentId && a.status === 'pending').length;
    document.getElementById('pendingAssignments').textContent = pendingAssignmentsCount;

    const myLessons = studentLessons.filter(l => l.studentId == studentId);
    const completedLessons = myLessons.filter(l => l.status === 'completed' || l.status === 'accelerated').length;
    
    let progress = 0;
    if (myLessons.length > 0) {
        progress = Math.round((completedLessons / myLessons.length) * 100);
    }
    document.getElementById('progressPercentage').textContent = progress + '%';
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

// ----------------------------------------------------------------
// واجهة المستخدم
// ----------------------------------------------------------------

function updateUserInterface(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        if (user.role === 'teacher') {
            userNameElement.textContent = `أ/ ${user.name}`;
        } else if (user.role === 'admin') {
            userNameElement.textContent = 'مدير النظام';
        } else if (user.role === 'student') {
            userNameElement.textContent = user.name;
        } else {
            userNameElement.textContent = user.name;
        }
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }

    updatePageTitle(user.role);
}

function updatePageTitle(role) {
    const titles = {
        'admin': 'لوحة تحكم المدير',
        'teacher': 'لوحة تحكم المعلم',
        'student': 'لوحة تحكم الطالب',
        'committee': 'لوحة تحكم اللجنة'
    };
    
    const title = titles[role] || 'لوحة التحكم';
    if (document.title === 'ميسر التعلم') {
        document.title = `${title} - ميسر التعلم`;
    }
}

// ----------------------------------------------------------------
// دوال مساعدة عامة
// ----------------------------------------------------------------

function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('currentUser');
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../../index.html';
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../../index.html';
        return null;
    }
    return user;
}

function generateId() {
    return Math.floor(Math.random() * 1000000) + 1;
}

function setupSessionWarning() {
    setInterval(() => {
        const loginTime = sessionStorage.getItem('loginTime');
        if (loginTime) {
            const now = new Date();
            const loginDate = new Date(loginTime);
            const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
            
            if (hoursDiff > 7.5) {
                showSessionWarningUI();
            }
        }
    }, 60000); 
}

function showSessionWarningUI() {
    if (!document.getElementById('sessionWarning')) {
        const warning = document.createElement('div');
        warning.id = 'sessionWarning';
        warning.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; right: 20px;
            background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;
            padding: 15px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            display: flex; justify-content: space-between; align-items: center; color: #856404;
        `;
        warning.innerHTML = `
            <span>⚠️ جلسة العمل ستنتهي قريباً. يرجى حفظ العمل الحالي.</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">✕</button>
        `;
        document.body.appendChild(warning);
        
        setTimeout(() => {
            if (warning.parentElement) warning.remove();
        }, 30000);
    }
}
