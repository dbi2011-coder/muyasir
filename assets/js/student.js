// ============================================
// 📁 المسار: assets/js/student.js
// الوصف: الدوال الرئيسية لواجهة الطالب (تم إصلاح خطأ الأفاتار والاسم)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeStudentDashboard();
    setupStudentTabs();
});

function initializeStudentDashboard() {
    let currentStudent = null;
    
    // محاولة جلب المستخدم بأكثر من طريقة لضمان النجاح
    try {
        if (typeof getCurrentUser === 'function') {
            currentStudent = getCurrentUser();
        }
        if (!currentStudent && sessionStorage.getItem('currentUser')) {
            currentStudent = JSON.parse(sessionStorage.getItem('currentUser')).user;
        }
    } catch(e) { console.log('Error fetching user', e); }
    
    if (currentStudent) {
        // ✅ إصلاح الخطأ: التأكد من وجود الاسم، أو استخدام بديل
        const studentName = currentStudent.name || 'طالب';
        
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');

        if(userNameEl) userNameEl.textContent = studentName;
        if(userAvatarEl) userAvatarEl.textContent = studentName.charAt(0);
        
        // تحديث الإحصائيات
        updateStudentStats();
        
        // تحميل النشاط الأخير
        loadRecentActivity();
    }
}

function setupStudentTabs() {
    const tabBtns = document.querySelectorAll('.tests-tabs .tab-btn, .lessons-tabs .tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة النشاط من جميع الأزرار في نفس المجموعة
            const parentTabs = this.closest('.tests-tabs, .lessons-tabs');
            if(parentTabs) {
                parentTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                parentTabs.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // إضافة النشاط للزر والتبويب المحدد
                this.classList.add('active');
                const targetPane = parentTabs.querySelector(`#${tabId}-tab`);
                if(targetPane) targetPane.classList.add('active');
            }
        });
    });
}

function updateStudentStats() {
    const currentStudent = getCurrentUser();
    if(!currentStudent) return;

    const pendingTests = getPendingTestsCount(currentStudent.id);
    const currentLessons = getCurrentLessonsCount(currentStudent.id);
    const pendingAssignments = getPendingAssignmentsCount(currentStudent.id);
    const progressPercentage = getStudentProgress(currentStudent.id);
    
    if(document.getElementById('pendingTests')) document.getElementById('pendingTests').textContent = pendingTests;
    if(document.getElementById('currentLessons')) document.getElementById('currentLessons').textContent = currentLessons;
    if(document.getElementById('pendingAssignments')) document.getElementById('pendingAssignments').textContent = pendingAssignments;
    if(document.getElementById('progressPercentage')) document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if(!activityList) return;

    const currentStudent = getCurrentUser();
    if(!currentStudent) return;

    const activities = getStudentRecentActivities(currentStudent.id);
    
    if (activities.length === 0) {
        activityList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
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

// دوال التنقل
function openMyTests() { window.location.href = 'my-tests.html'; }
function openMyLessons() { window.location.href = 'my-lessons.html'; }
function openMyAssignments() { window.location.href = 'my-assignments.html'; }
function openMyIEP() { window.location.href = 'my-iep.html'; }
function openMessages() { window.location.href = 'messages.html'; }

// دوال مساعدة
function getPendingTestsCount(studentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    return studentTests.filter(test => String(test.studentId) === String(studentId) && test.status === 'pending').length;
}

function getCurrentLessonsCount(studentId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    // نعتبر الدروس غير المكتملة هي الحالية
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

function getActivityIcon(activityType) {
    const icons = { 'test': '📝', 'lesson': '📚', 'assignment': '📋', 'message': '💬', 'progress': '📊' };
    return icons[activityType] || '📄';
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `قبل ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `قبل ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `قبل ${diffInDays} يوم`;
}

// تصدير الدوال
window.openMyTests = openMyTests;
window.openMyLessons = openMyLessons;
window.openMyAssignments = openMyAssignments;
window.openMyIEP = openMyIEP;
window.openMessages = openMessages;
