// مكتبة المحتوى التعليمي - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من المصادقة
    const user = checkAuth();
    if (!user) return;
    
    // تحميل البيانات
    loadLibraryData();
    updateUserInfo();
    
    // تهيئة الأزرار
    initLibraryButtons();
});

// تحميل بيانات المكتبة
async function loadLibraryData() {
    try {
        // تحميل الدروس
        const lessonsResponse = await fetch('../../data/lessons.json');
        const lessonsData = await lessonsResponse.json();
        displayLessons(lessonsData.lessons);
        
        // تحميل الاختبارات
        const testsResponse = await fetch('../../data/tests.json');
        const testsData = await testsResponse.json();
        displayTests(testsData.tests);
        
        // تحميل الواجبات
        const assignmentsResponse = await fetch('../../data/assignments.json');
        const assignmentsData = await assignmentsResponse.json();
        displayAssignments(assignmentsData.assignments);
        
    } catch (error) {
        console.error('Error loading library data:', error);
        showAlert('حدث خطأ في تحميل البيانات', 'error');
    }
}

// عرض الدروس
function displayLessons(lessons) {
    const container = document.getElementById('lessonsGrid');
    if (!container) return;
    
    const currentUser = getCurrentUser();
    const userLessons = lessons.filter(lesson => lesson.teacherId === currentUser.id);
    
    if (userLessons.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h4>لا توجد دروس مضافة</h4>
                <p>يمكنك إضافة دروس جديدة من خلال زر "إضافة محتوى جديد"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userLessons.slice(0, 4).map(lesson => `
        <div class="content-card">
            <div class="content-header">
                <div class="content-icon">📖</div>
                <div class="content-meta">
                    <span class="badge ${lesson.subject === 'لغتي' ? 'badge-primary' : 'badge-danger'}">
                        ${lesson.subject}
                    </span>
                    <span class="status ${lesson.status || 'active'}">${lesson.status || 'نشط'}</span>
                </div>
            </div>
            <h4 class="content-title">${lesson.title}</h4>
            <p class="content-desc">${lesson.description || 'لا يوجد وصف'}</p>
            <div class="content-footer">
                <button class="btn btn-sm btn-primary" onclick="viewLesson(${lesson.id})">
                    <span class="btn-icon">👁️</span> عرض
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editLesson(${lesson.id})">
                    <span class="btn-icon">✏️</span> تعديل
                </button>
            </div>
        </div>
    `).join('');
}

// عرض الاختبارات
function displayTests(tests) {
    const container = document.getElementById('testsGrid');
    if (!container) return;
    
    const currentUser = getCurrentUser();
    const userTests = tests.filter(test => test.teacherId === currentUser.id);
    
    if (userTests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h4>لا توجد اختبارات مضافة</h4>
                <p>يمكنك إضافة اختبارات جديدة من خلال زر "إضافة محتوى جديد"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userTests.slice(0, 4).map(test => `
        <div class="content-card">
            <div class="content-header">
                <div class="content-icon">📝</div>
                <div class="content-meta">
                    <span class="badge ${test.subject === 'لغتي' ? 'badge-primary' : 'badge-danger'}">
                        ${test.subject}
                    </span>
                    <span class="status ${test.objectivesLinked ? 'linked' : 'not-linked'}">
                        ${test.objectivesLinked ? 'مربوط' : 'غير مربوط'}
                    </span>
                </div>
            </div>
            <h4 class="content-title">${test.title}</h4>
            <p class="content-desc">${test.description || 'لا يوجد وصف'}</p>
            <div class="content-footer">
                <button class="btn btn-sm btn-primary" onclick="viewTest(${test.id})">
                    <span class="btn-icon">👁️</span> عرض
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editTest(${test.id})">
                    <span class="btn-icon">✏️</span> تعديل
                </button>
            </div>
        </div>
    `).join('');
}

// عرض الواجبات
function displayAssignments(assignments) {
    const container = document.getElementById('assignmentsGrid');
    if (!container) return;
    
    const currentUser = getCurrentUser();
    const userAssignments = assignments.filter(assignment => assignment.teacherId === currentUser.id);
    
    if (userAssignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h4>لا توجد واجبات مضافة</h4>
                <p>يمكنك إضافة واجبات جديدة من خلال زر "إضافة محتوى جديد"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userAssignments.slice(0, 4).map(assignment => `
        <div class="content-card">
            <div class="content-header">
                <div class="content-icon">📋</div>
                <div class="content-meta">
                    <span class="badge ${assignment.subject === 'لغتي' ? 'badge-primary' : 'badge-danger'}">
                        ${assignment.subject}
                    </span>
                    <span class="status ${assignment.status || 'pending'}">${assignment.status || 'معلق'}</span>
                </div>
            </div>
            <h4 class="content-title">${assignment.title}</h4>
            <p class="content-desc">${assignment.description || 'لا يوجد وصف'}</p>
            <div class="content-footer">
                <button class="btn btn-sm btn-primary" onclick="viewAssignment(${assignment.id})">
                    <span class="btn-icon">👁️</span> عرض
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editAssignment(${assignment.id})">
                    <span class="btn-icon">✏️</span> تعديل
                </button>
            </div>
        </div>
    `).join('');
}

// تحديث معلومات المستخدم
function updateUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    if (userAvatarElement) {
        userAvatarElement.textContent = user.name.charAt(0);
    }
}

// تهيئة أزرار المكتبة
function initLibraryButtons() {
    // تأكد من أن عنصر modalsContainer موجود
    if (!document.getElementById('modalsContainer')) {
        const modalsContainer = document.createElement('div');
        modalsContainer.id = 'modalsContainer';
        document.body.appendChild(modalsContainer);
    }
}

// ✅ **الدالة المصححة: showCreateTestModal**
function showCreateTestModal() {
    console.log('Opening create test modal...'); // للتشخيص
    
    // أولاً: التحقق من وجود modalsContainer
    let modalsContainer = document.getElementById('modalsContainer');
    
    // إذا لم يكن موجوداً، أنشئه
    if (!modalsContainer) {
        modalsContainer = document.createElement('div');
        modalsContainer.id = 'modalsContainer';
        document.body.appendChild(modalsContainer);
        console.log('Created modalsContainer element');
    }
    
    // إنشاء النموذج المنبثق
    const modalHTML = `
        <div class="modal active" id="createTestModal">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>إنشاء اختبار تشخيصي جديد</h3>
                    <button class="modal-close" onclick="closeCurrentModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="newTestForm" onsubmit="return saveNewTest(event)">
                        <div class="form-group">
                            <label for="testTitle">عنوان الاختبار *</label>
                            <input type="text" id="testTitle" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="testSubject">المادة *</label>
                            <select id="testSubject" class="form-control" required>
                                <option value="">اختر المادة</option>
                                <option value="لغتي">لغتي</option>
                                <option value="رياضيات">رياضيات</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="testDescription">وصف الاختبار (اختياري)</label>
                            <textarea id="testDescription" class="form-control" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>نوع المحتوى</label>
                            <div class="content-type-selection">
                                <div class="content-type-option" onclick="selectContentType('test')">
                                    <div class="type-icon">📝</div>
                                    <h5>اختبار تشخيصي</h5>
                                    <p>اختبارات تقييمية للطلاب</p>
                                </div>
                                <div class="content-type-option" onclick="selectContentType('lesson')">
                                    <div class="type-icon">📖</div>
                                    <h5>درس تعليمي</h5>
                                    <p>دروس وأنشطة تعليمية</p>
                                </div>
                                <div class="content-type-option" onclick="selectContentType('assignment')">
                                    <div class="type-icon">📋</div>
                                    <h5>واجب منزلي</h5>
                                    <p>تمارين وواجبات للطلاب</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeCurrentModal()">
                                إلغاء
                            </button>
                            <button type="submit" class="btn btn-success">
                                <span class="btn-icon">➕</span> إنشاء الاختبار
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // إضافة النموذج إلى الحاوية
    modalsContainer.innerHTML = modalHTML;
    
    // ✅ **تم إزالة السطر الذي يسبب الخطأ**
    // document.getElementById('createTestModal').classList.add('active');
    
    console.log('Test modal created successfully');
}

// ✅ **الدالة الجديدة: closeCurrentModal**
function closeCurrentModal() {
    const modalsContainer = document.getElementById('modalsContainer');
    if (modalsContainer) {
        modalsContainer.innerHTML = '';
    }
}

// حفظ الاختبار الجديد
function saveNewTest(event) {
    event.preventDefault();
    
    const testData = {
        id: generateId(),
        teacherId: getCurrentUser().id,
        title: document.getElementById('testTitle').value,
        subject: document.getElementById('testSubject').value,
        description: document.getElementById('testDescription').value || '',
        createdDate: new Date().toISOString().split('T')[0],
        objectivesLinked: false,
        status: 'active',
        questions: []
    };
    
    // حفظ في البيانات المحلية (مؤقت)
    saveTestToLocalStorage(testData);
    
    // إغلاق النموذج
    closeCurrentModal();
    
    // إظهار رسالة نجاح
    showAlert('تم إنشاء الاختبار بنجاح', 'success');
    
    // إعادة تحميل البيانات
    setTimeout(() => {
        window.location.href = 'tests.html';
    }, 1500);
    
    return false;
}

// حفظ الاختبار في التخزين المحلي
function saveTestToLocalStorage(testData) {
    // الحصول على الاختبارات الحالية
    let tests = JSON.parse(localStorage.getItem('teacher_tests') || '[]');
    
    // إضافة الاختبار الجديد
    tests.push(testData);
    
    // حفظ في التخزين المحلي
    localStorage.setItem('teacher_tests', JSON.stringify(tests));
}

// اختيار نوع المحتوى
function selectContentType(type) {
    const options = document.querySelectorAll('.content-type-option');
    options.forEach(option => option.classList.remove('selected'));
    
    const selectedOption = event.currentTarget;
    selectedOption.classList.add('selected');
    
    // تغيير زر الإرسال حسب النوع
    const submitBtn = document.querySelector('#newTestForm .btn-success');
    if (submitBtn) {
        switch(type) {
            case 'test':
                submitBtn.innerHTML = '<span class="btn-icon">➕</span> إنشاء الاختبار';
                break;
            case 'lesson':
                submitBtn.innerHTML = '<span class="btn-icon">➕</span> إنشاء الدرس';
                break;
            case 'assignment':
                submitBtn.innerHTML = '<span class="btn-icon">➕</span> إنشاء الواجب';
                break;
        }
    }
}

// التنقل بين الصفحات
function navigateToLessons() {
    window.location.href = 'lessons.html';
}

function navigateToTests() {
    window.location.href = 'tests.html';
}

function navigateToAssignments() {
    window.location.href = 'assignments.html';
}

// عرض المحتوى
function viewLesson(lessonId) {
    alert(`عرض الدرس رقم ${lessonId}`);
    // هنا سيتم فتح صفحة عرض الدرس
}

function viewTest(testId) {
    // الانتقال إلى صفحة الاختبارات
    window.location.href = `tests.html?testId=${testId}`;
}

function viewAssignment(assignmentId) {
    alert(`عرض الواجب رقم ${assignmentId}`);
    // هنا سيتم فتح صفحة عرض الواجب
}

// تعديل المحتوى
function editLesson(lessonId) {
    alert(`تعديل الدرس رقم ${lessonId}`);
    // هنا سيتم فتح نموذج تعديل الدرس
}

function editTest(testId) {
    // الانتقال إلى صفحة الاختبارات مع فتح التعديل
    window.location.href = `tests.html?testId=${testId}&action=edit`;
}

function editAssignment(assignmentId) {
    alert(`تعديل الواجب رقم ${assignmentId}`);
    // هنا سيتم فتح نموذج تعديل الواجب
}

// إضافة محتوى جديد
function addNewContent() {
    showCreateTestModal();
}

// إظهار تنبيه
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <div class="alert-content">
            <span class="alert-message">${message}</span>
            <button class="alert-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // إضافة إلى بداية body
    document.body.insertBefore(alertDiv, document.body.firstChild);
    
    // إزالة التنبيه بعد 5 ثوانٍ
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// تصدير الدوال للاستخدام العالمي
window.showCreateTestModal = showCreateTestModal;
window.closeCurrentModal = closeCurrentModal;
window.saveNewTest = saveNewTest;
window.selectContentType = selectContentType;
window.navigateToLessons = navigateToLessons;
window.navigateToTests = navigateToTests;
window.navigateToAssignments = navigateToAssignments;
window.viewLesson = viewLesson;
window.viewTest = viewTest;
window.viewAssignment = viewAssignment;
window.editLesson = editLesson;
window.editTest = editTest;
window.editAssignment = editAssignment;
window.addNewContent = addNewContent;
window.showAlert = showAlert;
