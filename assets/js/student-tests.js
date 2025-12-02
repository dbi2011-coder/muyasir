// إدارة اختبارات الطالب
let currentTestId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-tests.html')) {
        loadStudentTests();
        setupTestsTabs();
    }
});

function setupTestsTabs() {
    const tabBtns = document.querySelectorAll('.tests-tabs .tab-btn');
    const tabPanes = document.querySelectorAll('.tests-tabs .tab-pane');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // إزالة النشاط من جميع الأزرار
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // إضافة النشاط للزر والتبويب المحدد
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

function loadStudentTests() {
    loadPendingTests();
    loadCompletedTests();
}

function loadPendingTests() {
    const pendingTestsList = document.getElementById('pendingTestsList');
    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    const pendingTests = studentTests.filter(test => 
        test.studentId === currentStudent.id && test.status === 'pending'
    );
    
    if (pendingTests.length === 0) {
        pendingTestsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>لا توجد اختبارات معلقة</h3>
                <p>جميع الاختبارات المطلوبة مكتملة</p>
            </div>
        `;
        return;
    }
    
    pendingTestsList.innerHTML = pendingTests.map(test => `
        <div class="test-card pending">
            <div class="card-header">
                <h3 class="card-title">${test.title}</h3>
                <span class="card-status status-pending">معلقة</span>
            </div>
            <div class="card-meta">
                <div class="meta-item">
                    <span>المادة:</span>
                    <strong>${test.subject}</strong>
                </div>
                <div class="meta-item">
                    <span>موعد التسليم:</span>
                    <strong>${formatDate(test.dueDate)}</strong>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-success" onclick="startTest(${test.id})">بدء الاختبار</button>
                <button class="btn btn-outline-primary" onclick="viewTestDetails(${test.id})">عرض التفاصيل</button>
            </div>
        </div>
    `).join('');
}

function loadCompletedTests() {
    const completedTestsList = document.getElementById('completedTestsList');
    const currentStudent = getCurrentUser();
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    const completedTests = studentTests.filter(test => 
        test.studentId === currentStudent.id && test.status === 'completed'
    );
    
    if (completedTests.length === 0) {
        completedTestsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>لا توجد اختبارات مكتملة</h3>
                <p>سيظهر هنا تاريخ اختباراتك بعد إكمالها</p>
            </div>
        `;
        return;
    }
    
    completedTestsList.innerHTML = completedTests.map(test => `
        <div class="test-card completed">
            <div class="card-header">
                <h3 class="card-title">${test.title}</h3>
                <span class="card-status status-completed">مكتملة</span>
            </div>
            <div class="card-meta">
                <div class="meta-item">
                    <span>المادة:</span>
                    <strong>${test.subject}</strong>
                </div>
                <div class="meta-item">
                    <span>تاريخ الإكمال:</span>
                    <strong>${formatDate(test.completedDate)}</strong>
                </div>
                <div class="meta-item">
                    <span>النتيجة:</span>
                    <strong>${test.score}%</strong>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="viewTestResults(${test.id})">عرض النتائج</button>
                <button class="btn btn-outline-secondary" onclick="printTest(${test.id})">🖨️ طباعة</button>
            </div>
        </div>
    `).join('');
}

function startTest(testId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const test = studentTests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    currentTestId = testId;
    
    document.getElementById('testModalTitle').textContent = test.title;
    document.getElementById('testInstructions').innerHTML = `
        <div class="test-info">
            <h4>تعليمات الاختبار:</h4>
            <ul>
                <li>يجب إكمال الاختبار في جلسة واحدة</li>
                <li>لا يمكنك الخروج من الاختبار بعد البدء</li>
                <li>الوقت المقدر: 60 دقيقة</li>
                <li>يجب تحقيق ${test.passingScore || 60}% للنجاح</li>
            </ul>
            <div class="alert alert-warning">
                <strong>ملاحظة:</strong> تأكد من وجود اتصال إنترنت مستقر قبل البدء
            </div>
        </div>
    `;
    
    document.getElementById('startTestModal').classList.add('show');
}

function closeStartTestModal() {
    document.getElementById('startTestModal').classList.remove('show');
    currentTestId = null;
}

function startSelectedTest() {
    if (!currentTestId) {
        showAuthNotification('لم يتم تحديد اختبار', 'error');
        return;
    }
    
    // في تطبيق حقيقي، سيتم توجيه الطالب إلى صفحة حل الاختبار
    showAuthNotification('سيتم بدء الاختبار قريباً', 'info');
    closeStartTestModal();
    
    // محاكاة بدء الاختبار
    setTimeout(() => {
        // تحديث حالة الاختبار
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const testIndex = studentTests.findIndex(t => t.id === currentTestId);
        
        if (testIndex !== -1) {
            studentTests[testIndex].status = 'in-progress';
            studentTests[testIndex].startedAt = new Date().toISOString();
            localStorage.setItem('studentTests', JSON.stringify(studentTests));
            
            // إضافة نشاط
            addStudentActivity({
                type: 'test',
                title: 'بدأت اختباراً',
                description: studentTests[testIndex].title
            });
        }
    }, 2000);
}

function viewTestDetails(testId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const test = studentTests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    const detailsMessage = `
        تفاصيل الاختبار:
        العنوان: ${test.title}
        المادة: ${test.subject}
        الحالة: ${test.status === 'pending' ? 'معلقة' : 'مكتملة'}
        ${test.dueDate ? `موعد التسليم: ${formatDate(test.dueDate)}` : ''}
        ${test.instructions ? `التعليمات: ${test.instructions}` : ''}
    `;
    
    alert(detailsMessage);
}

function viewTestResults(testId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const test = studentTests.find(t => t.id === testId);
    
    if (!test) {
        showAuthNotification('الاختبار غير موجود', 'error');
        return;
    }
    
    const resultsMessage = `
        نتائج الاختبار:
        العنوان: ${test.title}
        المادة: ${test.subject}
        النتيجة: ${test.score}%
        تاريخ الإكمال: ${formatDate(test.completedDate)}
        الحالة: ${test.score >= (test.passingScore || 60) ? 'ناجح' : 'راسب'}
    `;
    
    alert(resultsMessage);
}

function printTest(testId) {
    // في تطبيق حقيقي، سيتم إنشاء نسخة PDF من الاختبار
    showAuthNotification('جاري تحضير نسخة للطباعة...', 'info');
    
    setTimeout(() => {
        showAuthNotification('تم إنشاء نسخة للطباعة', 'success');
        // هنا سيتم فتح نافذة الطباعة
        window.print();
    }, 1500);
}

function addStudentActivity(activity) {
    const currentStudent = getCurrentUser();
    const activities = JSON.parse(localStorage.getItem('studentActivities') || '[]');
    
    const newActivity = {
        id: generateId(),
        studentId: currentStudent.id,
        ...activity,
        timestamp: new Date().toISOString()
    };
    
    activities.push(newActivity);
    localStorage.setItem('studentActivities', JSON.stringify(activities));
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// تصدير الدوال للاستخدام العالمي
window.startTest = startTest;
window.closeStartTestModal = closeStartTestModal;
window.startSelectedTest = startSelectedTest;
window.viewTestDetails = viewTestDetails;
window.viewTestResults = viewTestResults;
window.printTest = printTest;