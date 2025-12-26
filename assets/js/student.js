// الدوال الرئيسية لواجهة الطالب
document.addEventListener('DOMContentLoaded', function() {
    initializeStudentDashboard();
    setupStudentTabs();
});

function initializeStudentDashboard() {
    const currentStudent = getCurrentUser();
    
    if (currentStudent) {
        document.getElementById('userName').textContent = currentStudent.name;
        document.getElementById('userAvatar').textContent = currentStudent.name.charAt(0);
        
        // تحديث الإحصائيات
        updateStudentStats();
        
        // تحميل النشاط الأخير
        loadRecentActivity();
    }
}

function setupStudentTabs() {
    const tabBtns = document.querySelectorAll('.tests-tabs .tab-btn, .lessons-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.tests-tabs .tab-pane, .lessons-tabs .tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة النشاط من جميع الأزرار في نفس المجموعة
            const parentTabs = this.closest('.tests-tabs, .lessons-tabs');
            parentTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            parentTabs.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            // إضافة النشاط للزر والتبويب المحدد
            this.classList.add('active');
            parentTabs.querySelector(`#${tabId}-tab`).classList.add('active');
        });
    });
}

function updateStudentStats() {
    const currentStudent = getCurrentUser();
    
    // في تطبيق حقيقي، سيتم جلب هذه البيانات من قاعدة البيانات
    const pendingTests = getPendingTestsCount(currentStudent.id);
    const currentLessons = getCurrentLessonsCount(currentStudent.id);
    const pendingAssignments = getPendingAssignmentsCount(currentStudent.id);
    const progressPercentage = getStudentProgress(currentStudent.id);
    
    document.getElementById('pendingTests').textContent = pendingTests;
    document.getElementById('currentLessons').textContent = currentLessons;
    document.getElementById('pendingAssignments').textContent = pendingAssignments;
    document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    const currentStudent = getCurrentUser();
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
function openMyTests() {
    window.location.href = 'my-tests.html';
}

function openMyLessons() {
    window.location.href = 'my-lessons.html';
}

function openMyAssignments() {
    window.location.href = 'my-assignments.html';
}

function openMyIEP() {
    window.location.href = 'my-iep.html';
}

function openMessages() {
    window.location.href = 'messages.html';
}

// دوال مساعدة
function getPendingTestsCount(studentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    return studentTests.filter(test => 
        test.studentId === studentId && test.status === 'pending'
    ).length;
}

function getCurrentLessonsCount(studentId) {
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');
    return studentLessons.filter(lesson => 
        lesson.studentId === studentId && lesson.status === 'current'
    ).length;
}

function getPendingAssignmentsCount(studentId) {
    const studentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
    return studentAssignments.filter(assignment => 
        assignment.studentId === studentId && assignment.status === 'pending'
    ).length;
}

function getStudentProgress(studentId) {
    const studentProgress = JSON.parse(localStorage.getItem('studentProgress') || '[]');
    const progress = studentProgress.find(p => p.studentId === studentId);
    return progress ? progress.percentage : 0;
}

function getStudentRecentActivities(studentId) {
    const activities = JSON.parse(localStorage.getItem('studentActivities') || '[]');
    return activities
        .filter(activity => activity.studentId === studentId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
}

function getActivityIcon(activityType) {
    const icons = {
        'test': '📝',
        'lesson': '📚',
        'assignment': '📋',
        'message': '💬',
        'progress': '📊'
    };
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

// إنشاء بيانات تجريبية للطالب (للتطوير)
function createSampleStudentData() {
    const currentStudent = getCurrentUser();
    
    // بيانات الاختبارات
    const sampleTests = [
        {
            id: generateId(),
            studentId: currentStudent.id,
            title: 'الاختبار التشخيصي - مادة لغتي',
            subject: 'لغتي',
            status: 'pending',
            assignedDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            studentId: currentStudent.id,
            title: 'الاختبار التشخيصي - مادة الرياضيات',
            subject: 'رياضيات',
            status: 'completed',
            assignedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            score: 85
        }
    ];
    
    localStorage.setItem('studentTests', JSON.stringify(sampleTests));
    
    // بيانات الدروس
    const sampleLessons = [
        {
            id: generateId(),
            studentId: currentStudent.id,
            title: 'الدرس الأول: مهارات القراءة',
            subject: 'لغتي',
            status: 'current',
            assignedDate: new Date().toISOString(),
            progress: 0
        },
        {
            id: generateId(),
            studentId: currentStudent.id,
            title: 'الدرس الثاني: العمليات الحسابية',
            subject: 'رياضيات',
            status: 'upcoming',
            assignedDate: new Date().toISOString()
        },
        {
            id: generateId(),
            studentId: currentStudent.id,
            title: 'الدرس التمهيدي',
            subject: 'لغتي',
            status: 'completed',
            assignedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    localStorage.setItem('studentLessons', JSON.stringify(sampleLessons));
    
    // بيانات الواجبات
    const sampleAssignments = [
        {
            id: generateId(),
            studentId: currentStudent.id,
            title: 'الواجب الأول: تمارين القراءة',
            subject: 'لغتي',
            status: 'pending',
            assignedDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            studentId: currentStudent.id,
            title: 'الواجب التمهيدي',
            subject: 'رياضيات',
            status: 'completed',
            assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            score: 90
        }
    ];
    
    localStorage.setItem('studentAssignments', JSON.stringify(sampleAssignments));
    
    // بيانات التقدم
    const sampleProgress = [
        {
            studentId: currentStudent.id,
            percentage: 35,
            lastUpdated: new Date().toISOString()
        }
    ];
    
    localStorage.setItem('studentProgress', JSON.stringify(sampleProgress));
    
    // بيانات النشاط
    const sampleActivities = [
        {
            id: generateId(),
            studentId: currentStudent.id,
            type: 'lesson',
            title: 'أكملت درساً',
            description: 'الدرس التمهيدي - مادة لغتي',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            studentId: currentStudent.id,
            type: 'assignment',
            title: 'سلمت واجباً',
            description: 'الواجب التمهيدي - مادة الرياضيات',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: generateId(),
            studentId: currentStudent.id,
            type: 'test',
            title: 'أكملت اختباراً',
            description: 'الاختبار التشخيصي - مادة الرياضيات',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    localStorage.setItem('studentActivities', JSON.stringify(sampleActivities));
    
    showAuthNotification('تم إنشاء بيانات تجريبية للطالب', 'success');
    updateStudentStats();
    loadRecentActivity();
}

// تصدير الدوال للاستخدام العالمي
window.openMyTests = openMyTests;
window.openMyLessons = openMyLessons;
window.openMyAssignments = openMyAssignments;
window.openMyIEP = openMyIEP;
window.openMessages = openMessages;
window.createSampleStudentData = createSampleStudentData;