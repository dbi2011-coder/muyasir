// ============================================
// 📁 المسار: assets/js/student.js
// الوصف: الدوال الرئيسية لواجهة الطالب + جلب الإحصائيات من Supabase
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeStudentDashboard();
    setupStudentTabs();
});

function initializeStudentDashboard() {
    let currentStudent = null;
    try {
        if (typeof getCurrentUser === 'function') {
            currentStudent = getCurrentUser();
        }
        if (!currentStudent && sessionStorage.getItem('currentUser')) {
            currentStudent = JSON.parse(sessionStorage.getItem('currentUser')).user;
        }
    } catch(e) { console.log('Error fetching user', e); }
    
    if (currentStudent) {
        const studentName = currentStudent.name || 'طالب';
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.getElementById('userAvatar');

        if(userNameEl) userNameEl.textContent = studentName;
        if(userAvatarEl) userAvatarEl.textContent = studentName.charAt(0);
        
        updateStudentStats();
        loadRecentActivity();
    }
}

function setupStudentTabs() {
    const tabBtns = document.querySelectorAll('.tests-tabs .tab-btn, .lessons-tabs .tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            const parentTabs = this.closest('.tests-tabs, .lessons-tabs');
            if(parentTabs) {
                parentTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                parentTabs.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                const targetPane = parentTabs.querySelector(`#${tabId}-tab`);
                if(targetPane) targetPane.classList.add('active');
            }
        });
    });
}

// 🔥 دالة إحصائيات الطالب محدثة لتعمل مع Supabase
async function updateStudentStats() {
    const currentStudent = JSON.parse(sessionStorage.getItem('currentUser'))?.user || JSON.parse(sessionStorage.getItem('currentUser'));
    if(!currentStudent) return;

    try {
        const [testsRes, lessonsRes, assignmentsRes] = await Promise.all([
            window.supabase.from('student_tests').select('status').eq('studentId', currentStudent.id),
            window.supabase.from('student_lessons').select('status, passedByAlternative').eq('studentId', currentStudent.id),
            window.supabase.from('student_assignments').select('status').eq('studentId', currentStudent.id)
        ]);

        const studentTests = testsRes.data || [];
        const studentLessons = lessonsRes.data || [];
        const studentAssignments = assignmentsRes.data || [];

        const pendingTests = studentTests.filter(t => t.status === 'pending').length;
        const currentLessons = studentLessons.filter(l => ['pending', 'started', 'struggling', 'returned'].includes(l.status)).length;
        const pendingAssignments = studentAssignments.filter(a => a.status === 'pending').length;

        let progressPercentage = 0;
        if (studentLessons.length > 0) {
            const completed = studentLessons.filter(l => l.status === 'completed' || l.status === 'accelerated' || l.passedByAlternative).length;
            progressPercentage = Math.round((completed / studentLessons.length) * 100);
        }

        if(document.getElementById('pendingTests')) document.getElementById('pendingTests').textContent = pendingTests;
        if(document.getElementById('currentLessons')) document.getElementById('currentLessons').textContent = currentLessons;
        if(document.getElementById('pendingAssignments')) document.getElementById('pendingAssignments').textContent = pendingAssignments;
        
        if(document.getElementById('progressPercentage')) document.getElementById('progressPercentage').textContent = `${progressPercentage}%`;
        
        const progressBar = document.getElementById('studentProgressBar') || document.querySelector('.progress-bar-fill');
        if (progressBar) {
            progressBar.style.width = progressPercentage + '%';
            if (progressPercentage >= 80) progressBar.style.backgroundColor = '#28a745';
            else if (progressPercentage >= 50) progressBar.style.backgroundColor = '#17a2b8';
            else progressBar.style.backgroundColor = '#ffc107';
        }
    } catch (e) {
        console.error("Error updating stats from cloud:", e);
    }
}

function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if(!activityList) return;
    activityList.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><h3>لا يوجد نشاط حديث</h3><p>سيظهر نشاطك هنا عند بدء استخدام النظام</p></div>`;
}

function openMyTests() { window.location.href = 'my-tests.html'; }
function openMyLessons() { window.location.href = 'my-lessons.html'; }
function openMyAssignments() { window.location.href = 'my-assignments.html'; }
function openMyIEP() { window.location.href = 'my-iep.html'; }
function openMessages() { window.location.href = 'messages.html'; }

window.openMyTests = openMyTests;
window.openMyLessons = openMyLessons;
window.openMyAssignments = openMyAssignments;
window.openMyIEP = openMyIEP;
window.openMessages = openMessages;
