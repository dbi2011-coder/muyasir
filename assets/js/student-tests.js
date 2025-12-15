// ============================================
// 📁 المسار: assets/js/student-tests.js
// ============================================

let currentTestId = null;
let currentOriginalTest = null;

document.addEventListener('DOMContentLoaded', function() {
    // التأكد من وجود الحاوية قبل التحميل
    if (document.getElementById('pendingTestsList')) {
        loadStudentTests();
        setupTestsTabs();
    }
});

function setupTestsTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            const pane = document.getElementById(`${tabId}-tab`);
            if(pane) pane.classList.add('active');
        });
    });
}

function loadStudentTests() {
    loadPendingTests();
    loadCompletedTests();
}

function loadPendingTests() {
    const container = document.getElementById('pendingTestsList');
    if (!container) return;

    try {
        const currentStudent = getCurrentUser();
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');

        // التصفية بحذر
        const myTests = studentTests.filter(t => 
            t.studentId === currentStudent.id && 
            (t.status === 'pending' || t.status === 'in-progress')
        );

        if (myTests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎉</div>
                    <h3>لا توجد اختبارات جديدة</h3>
                </div>`;
            return;
        }

        container.innerHTML = myTests.map(assignment => {
            const testDetails = allTests.find(t => t.id === assignment.testId);
            
            // إذا كان الاختبار الأصلي محذوفاً، لا نعرض البطاقة لتجنب الأخطاء
            if (!testDetails) return '';

            const btnText = assignment.status === 'in-progress' ? '🔄 استكمال' : '🚀 ابدأ';
            const badgeClass = assignment.status === 'in-progress' ? 'status-accelerated' : 'status-pending';
            const qCount = testDetails.questions ? testDetails.questions.length : 0;

            return `
                <div class="test-card pending">
                    <div class="card-header">
                        <h3 class="card-title">${testDetails.title}</h3>
                        <span class="card-status ${badgeClass}">${assignment.status === 'in-progress' ? 'قيد التنفيذ' : 'جديد'}</span>
                    </div>
                    <div class="card-meta">
                        <div class="meta-item"><span>📚 المادة:</span><strong>${testDetails.subject}</strong></div>
                        <div class="meta-item"><span>❓ الأسئلة:</span><strong>${qCount}</strong></div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-success btn-block" onclick="openTestFocusMode(${assignment.id})">
                            ${btnText}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error loading pending tests:", e);
        container.innerHTML = '<p>حدث خطأ في تحميل الاختبارات.</p>';
    }
}

// ... (باقي كود العرض والكانفاس والصوت كما تم تقديمه في الرد السابق - مهم جداً أن تستخدم الكود الكامل من الرد السابق ليعمل النظام الجديد) ...
// (للاختصار، قم بدمج كود renderQuestions, initCanvas, speakText, startSpeechRecognition من الرد السابق هنا)

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}
