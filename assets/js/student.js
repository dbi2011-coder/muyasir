// ============================================
// 📁 المسار: assets/js/student.js
// الوصف: النسخة المحدثة والمتوافقة مع نظام الدخول الجديد Zooro12500
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeStudentDashboard();
    setupStudentTabs();
});

function initializeStudentDashboard() {
    let currentStudent = null;
    
    try {
        // جلب البيانات من الجلسة (متوافق مع auth.js المحدث)
        const sessionData = sessionStorage.getItem('currentUser');
        if (sessionData) {
            currentStudent = JSON.parse(sessionData);
        }
    } catch(e) { 
        console.error('Error fetching user', e); 
    }
    
    // التأكد أن المستخدم موجود ودوره "طالب"
    if (currentStudent && (currentStudent.role === 'student' || currentStudent.role === 'طالب')) {
        const studentName = currentStudent.name || 'طالب';
        
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');

        if(userNameEl) userNameEl.textContent = studentName;
        if(userAvatarEl) userAvatarEl.textContent = studentName.charAt(0);
        
        // إخفاء حالة التحميل إذا وجدت
        const loadingState = document.getElementById('loadingState');
        if(loadingState) loadingState.style.display = 'none';

        // تحديث الإحصائيات وتحميل النشاط
        updateStudentStats(currentStudent.id);
        loadRecentActivity(currentStudent.id);
    } else {
        // إذا لم يكن طالباً أو لم يسجل الدخول، يتم توجيهه للرئيسية
        console.warn('لم يتم العثور على بيانات طالب صحيحة');
        // window.location.href = '../../index.html'; 
    }
}

function updateStudentStats(studentId) {
    const pendingTests = getPendingTestsCount(studentId);
    const currentLessons = getCurrentLessonsCount(studentId);
    const pendingAssignments = getPendingAssignmentsCount(studentId);
    const progressPercentage = getStudentProgress(studentId);
    
    if(document.getElementById('pendingTests')) document.getElementById('pendingTests').textContent = pendingTests;
    if(document.getElementById('currentLessons')) document.getElementById('currentLessons').textContent = currentLessons;
    if(document.getElementById('pendingAssignments')) document.getElementById('pendingAssignments').textContent = pendingAssignments;
    if(document.getElementById('progressPercentage')) document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;
}

function loadRecentActivity(studentId) {
    const activityList = document.getElementById('activityList');
    if(!activityList) return;

    const activities = getStudentRecentActivities(studentId);
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 20px;">
                <div class="empty-icon" style="font-size: 3rem;">📊</div>
                <h3>لا يوجد نشاط حديث</h3>
                <p>سيظهر نشاطك هنا عند بدء استخدام النظام</p>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(activity.type)}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
            </div>
            <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
        </div>
    `).join('');
}

// --- الدوال المساعدة لجلب البيانات من الذاكرة المحلية ---

function getPendingTestsCount(studentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    return studentTests.filter(test => String(test.studentId) === String(studentId) && test.status === 'pending').length;
}

function getCurrentLessonsCount(studentId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    return studentLessons.filter(lesson => String(lesson.studentId) === String(studentId) && lesson.status !== 'completed').length;
}

function getPendingAssignmentsCount(studentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    return studentAssignments.filter(assignment => String(assignment.studentId) === String(studentId) && assignment.status === 'pending').length;
}

function getStudentProgress(studentId) {
    const studentProgress = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const progress = studentProgress.find(p => String(p.studentId) === String(studentId));
    return progress ? progress.percentage : 0;
}

function getStudentRecentActivities(studentId) {
    const activities = JSON.parse(localStorage.getItem('studentActivities') || '[]');
    return activities
        .filter(activity => String(activity.studentId) === String(studentId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
}

// --- دوال التحكم بالتبويبات والتنقل ---

function setupStudentTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            const parent = this.closest('.tab-container') || document;
            
            parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parent.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            const target = document.getElementById(`${tabId}-tab`);
            if(target) target.classList.add('active');
        });
    });
}

function getActivityIcon(type) {
    const icons = { 'test': '📝', 'lesson': '📚', 'assignment': '📋', 'message': '💬', 'progress': '📊' };
    return icons[type] || '📄';
}

function formatTimeAgo(timestamp) {
    const diff = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60));
    if (diff < 1) return 'الآن';
    if (diff < 60) return `قبل ${diff} دقيقة`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    return `قبل ${Math.floor(hours / 24)} يوم`;
}

// تصدير الدوال للوصول إليها من HTML
window.openMyTests = () => window.location.href = 'my-tests.html';
window.openMyLessons = () => window.location.href = 'my-lessons.html';
window.openMyAssignments = () => window.location.href = 'my-assignments.html';
window.openMyIEP = () => window.location.href = 'my-iep.html';
window.openMessages = () => window.location.href = 'messages.html';
