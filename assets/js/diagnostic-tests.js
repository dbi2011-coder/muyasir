// نظام مبسط للاختبارات التشخيصية

// دالة عرض إشعار
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // إضافة الأنماط
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 10000;
                border-right: 4px solid #3498db;
                animation: slideIn 0.3s ease;
            }
            
            .notification-success {
                border-right-color: #27ae60;
                background: #d4edda;
            }
            
            .notification-error {
                border-right-color: #e74c3c;
                background: #f8d7da;
            }
            
            .notification-warning {
                border-right-color: #f39c12;
                background: #fff3cd;
            }
            
            .notification-info {
                border-right-color: #3498db;
                background: #d1ecf1;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .notification-content button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                width: 25px;
                height: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .notification-content button:hover {
                background: rgba(0,0,0,0.1);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 5 ثواني
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// دالة التحقق من تسجيل الدخول
function checkAuth() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = '../../index.html';
        return null;
    }
    
    try {
        const session = JSON.parse(userData);
        return session.user;
    } catch (error) {
        window.location.href = '../../index.html';
        return null;
    }
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const user = checkAuth();
    if (!user || user.role !== 'teacher') {
        window.location.href = '../../index.html';
        return;
    }
    
    // تحديث واجهة المستخدم
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').textContent = user.name.charAt(0);
    
    // تحميل الاختبارات
    loadDiagnosticTests();
    
    console.log('✅ نظام الاختبارات التشخيصية جاهز');
});

// تحميل الاختبارات
function loadDiagnosticTests() {
    const tests = getDiagnosticTests();
    const arabicTests = tests.filter(test => test.subject === 'لغتي');
    const mathTests = tests.filter(test => test.subject === 'رياضيات');
    
    displayTestsBySubject('arabicTestsList', arabicTests, '📚', 'لغتي');
    displayTestsBySubject('mathTestsList', mathTests, '🔢', 'رياضيات');
}

function displayTestsBySubject(containerId, tests, icon, subjectName) {
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    if (tests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <h3>لا توجد اختبارات لمادة ${subjectName}</h3>
                <p>قم بإنشاء أول اختبار تشخيصي</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tests.map(test => {
        const objectivesStatus = test.objectivesLinked ? 
            '<span class="objectives-status status-linked">تم الربط</span>' :
            '<span class="objectives-status status-not-linked">لم يتم الربط</span>';
        
        return `
            <div class="test-card">
                <div class="test-header">
                    <div class="test-title">${test.title}</div>
                    <div class="test-meta">
                        <span class="test-subject-badge ${test.subject === 'لغتي' ? 'subject-arabic' : 'subject-math'}">
                            ${test.subject}
                        </span>
                        ${objectivesStatus}
                        <span>${formatDateShort(test.createdAt)}</span>
                    </div>
                </div>
                ${test.description ? `<p>${test.description}</p>` : ''}
                <div class="test-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">
                        عرض
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editTest(${test.id})">
                        تعديل
                    </button>
                    <button class="btn btn-sm btn-info" onclick="linkObjectives(${test.id})">
                        ربط الأهداف
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="exportTest(${test.id})">
                        تصدير
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTest(${test.id})">
                        حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// دوال التخزين المحلي
function getDiagnosticTests() {
    return JSON.parse(localStorage.getItem('diagnosticTests') || '[]');
}

function getDiagnosticTestById(id) {
    const tests = getDiagnosticTests();
    return tests.find(test => test.id === id);
}

function saveDiagnosticTest(test) {
    const tests = getDiagnosticTests();
    const index = tests.findIndex(t => t.id === test.id);
    
    if (index >= 0) {
        tests[index] = test;
    } else {
        tests.push(test);
    }
    
    localStorage.setItem('diagnosticTests', JSON.stringify(tests));
    return test;
}

// دوال النوافذ المنبثقة
function showCreateTestModal() {
    console.log('فتح نافذة إنشاء اختبار');
    document.getElementById('createTestModal').classList.add('show');
}

function closeCreateTestModal() {
    document.getElementById('createTestModal').classList.remove('show');
    document.getElementById('createTestForm').reset();
}

function showImportTestModal() {
    document.getElementById('importTestModal').classList.add('show');
}

function closeImportTestModal() {
    document.getElementById('importTestModal').classList.remove('show');
}

function closeViewTestModal() {
    document.getElementById('viewTestModal').classList.remove('show');
}

function closeLinkObjectivesModal() {
    document.getElementById('linkObjectivesModal').classList.remove('show');
}

// دالة إنشاء اختبار جديد
function createNewTest() {
    const title = document.getElementById('testTitle').value.trim();
    const subject = document.getElementById('testSubject').value;
    const description = document.getElementById('testDescription').value.trim();
    
    if (!title || !subject) {
        showNotification('يرجى إدخال عنوان الاختبار وتحديد المادة', 'error');
        return;
    }
    
    const user = checkAuth();
    if (!user) return;
    
    const test = {
        id: Date.now(),
        title: title,
        subject: subject,
        description: description,
        questions: [],
        passCriteria: 70,
        objectivesLinked: false,
        createdAt: new Date().toISOString(),
        createdBy: user.id
    };
    
    saveDiagnosticTest(test);
    
    showNotification('تم إنشاء الاختبار بنجاح', 'success');
    closeCreateTestModal();
    
    // تحميل الاختبارات مرة أخرى
    loadDiagnosticTests();
    
    // الانتقال إلى صفحة التحرير
    setTimeout(() => {
        editTest(test.id);
    }, 1000);
}

// دالة التعديل
function editTest(testId) {
    window.location.href = `test-editor.html?id=${testId}`;
}

// دوال أخرى...
function formatDateShort(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

// تصدير الدوال للاستخدام العالمي
window.showCreateTestModal = showCreateTestModal;
window.closeCreateTestModal = closeCreateTestModal;
window.showImportTestModal = showImportTestModal;
window.closeImportTestModal = closeImportTestModal;
window.createNewTest = createNewTest;
window.editTest = editTest;
// ... إضافة الدوال الأخرى هنا
