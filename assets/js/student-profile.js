// ============================================
// 📁 المسار: assets/js/student-profile.js
// ============================================

let currentStudentId = null;
let currentStudent = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }
    
    loadStudentData();
});

// تحميل بيانات الطالب الأساسية
function loadStudentData() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    currentStudent = users.find(u => u.id === currentStudentId);
    
    if (!currentStudent) {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }

    // تحديث الواجهة
    document.getElementById('sideName').textContent = currentStudent.name;
    document.getElementById('headerStudentName').textContent = currentStudent.name;
    document.getElementById('sideGrade').textContent = currentStudent.grade + ' - ' + (currentStudent.subject || 'عام');
    document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;

    // البدء بالقسم الافتراضي
    switchSection('diagnostic');
}

// التنقل بين الأقسام
function switchSection(sectionId) {
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section-${sectionId}`).classList.add('active');

    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadSmartIEPTab(); // تم التحديث لاستخدام الدالة الذكية
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// ================================================================
//  ⚡ المحرك الذكي لنموذج 9 (Smart IEP Engine)
// ================================================================

function loadSmartIEPTab() {
    const iepContent = document.getElementById('iepContent');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic');

    // التحقق من اكتمال الاختبار التشخيصي
    if (!assignedTest || assignedTest.status !== 'completed') {
        iepContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <h3>الخطة غير جاهزة</h3>
                <p>يجب أن يكمل الطالب الاختبار التشخيصي ويتم تصحيحه أولاً لتوليد الخطة تلقائياً.</p>
                <button class="btn btn-primary" onclick="switchSection('diagnostic')">الذهاب للاختبار التشخيصي</button>
            </div>`;
        return;
    }

    // 1. تجهيز البيانات الذكية
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = allTests.find(t => t.id === assignedTest.testId);
    
    // جلب جدول المعلم لحساب حصص الطالب
    const scheduleData = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const daysMap = { 'الأحد': 'D_01', 'الاثنين': 'D_02', 'الثلاثاء': 'D_03', 'الأربعاء': 'D_04', 'الخميس': 'D_05' };
    const studentSchedule = { D_01: '', D_02: '', D_03: '', D_04: '', D_05: '' };
    
    scheduleData.forEach(s => {
        if (s.students && s.students.includes(currentStudentId)) {
            if (daysMap[s.day]) studentSchedule[daysMap[s.day]] = s.period; 
        }
    });

    // 2. تحليل النتائج (Pass/Fail Logic)
    let strengthsHTML = '';
    let needsHTML = '';
    let goalsUnitsHTML = '';
    let totalGoals = 0;
    let passedGoals = 0;

    if (originalTest && originalTest.questions) {
        const answers = assignedTest.answers || [];
        originalTest.questions.forEach(q => {
            totalGoals++;
            const studentAns = answers.find(a => a.questionId === q.id);
            const score = studentAns ? (studentAns.score || 0) : 0;
            const passingScore = q.passingScore || 5;
            
            // المهارة (عنوان السؤال)
            const skillText = q.text;

            if (score >= passingScore) {
                // اجتياز -> نقاط قوة
                passedGoals++;
                strengthsHTML += `<li class="point-item"><span class="point-bullet">•</span><input type="text" value="${skillText}" style="width:90%"></li>`;
            } else {
                // إخفاق -> احتياج + هدف جديد
                needsHTML += `<li class="point-item"><span class="point-bullet">•</span><input type="text" value="${skillText}" style="width:90%"></li>`;
                
                // إنشاء وحدة هدف للخطة
                goalsUnitsHTML += generateGoalUnitHTML(skillText);
            }
        });
    }

    const progressPercent = totalGoals === 0 ? 0 : Math.round((passedGoals / totalGoals) * 100);
    const subjectSkill = currentStudent.subject && currentStudent.subject.includes('رياضيات') ? "العمليات الحسابية" : "القراءة والكتابة";
    const longTermGoal = `أن يتقن التلميذ مهارات "${subjectSkill}" للصف ${currentStudent.grade} وبنسبة إتقان لا تقل عن 80%`;
    const todayDate = new Date().toISOString().split('T')[0];

    // 3. بناء الهيكل (HTML Injection)
    const iepHTML = `
    <div class="iep-word-model">
        <h3 style="text-align:center; margin-bottom:20px; color:#333;">نموذج (9) الخطة التربوية الفردية</h3>

        <table class="word-table">
            <tr>
                <th width="15%">اسم الطالب</th>
                <td width="35%"><input type="text" value="${currentStudent.name}" readonly style="font-weight:bold;"></td>
                <th width="15%">المادة</th>
                <td width="35%"><input type="text" value="${currentStudent.subject || ''}" readonly></td>
            </tr>
            <tr>
                <th>الصف</th>
                <td><input type="text" value="${currentStudent.grade || ''}" readonly></td>
                <th>تاريخ الإعداد</th>
                <td><input type="date" value="${todayDate}"></td>
            </tr>
            <tr>
                <th>نسبة الإنجاز (التشخيص)</th>
                <td colspan="3"><input type="text" value="${progressPercent} %" readonly style="font-weight:bold; color:${progressPercent > 50 ? 'green' : 'red'};"></td>
            </tr>
        </table>

        <table class="word-table" style="margin-top: 15px;">
            <thead>
                <tr>
                    <th width="10%">اليوم</th>
                    <th width="18%">الأحد</th>
                    <th width="18%">الاثنين</th>
                    <th width="18%">الثلاثاء</th>
                    <th width="18%">الأربعاء</th>
                    <th width="18%">الخميس</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <th style="background-color: #e9ecef;">الحصة</th>
                    <td><input type="number" value="${studentSchedule.D_01}" placeholder="-"></td>
                    <td><input type="number" value="${studentSchedule.D_02}" placeholder="-"></td>
                    <td><input type="number" value="${studentSchedule.D_03}" placeholder="-"></td>
                    <td><input type="number" value="${studentSchedule.D_04}" placeholder="-"></td>
                    <td><input type="number" value="${studentSchedule.D_05}" placeholder="-"></td>
                </tr>
            </tbody>
        </table>

        <table class="word-table">
            <tr>
                <th width="50%" style="background:#d4edda; color:#155724;">جوانب القوة (ما اجتازه الطالب)</th>
                <th width="50%" style="background:#f8d7da; color:#721c24;">جوانب الاحتياج (ما أخفق فيه)</th>
            </tr>
            <tr>
                <td style="vertical-align: top;"><ul id="iepStrengthsList" class="points-list">${strengthsHTML}</ul></td>
                <td style="vertical-align: top;"><ul id="iepNeedsList" class="points-list">${needsHTML}</ul></td>
            </tr>
        </table>

        <div class="long-term-goal-box">
            <h4>الهدف بعيد المدى:</h4>
            <textarea style="width:100%; border:none; resize:none; font-size:1.1rem; font-weight:bold;">${longTermGoal}</textarea>
        </div>

        <hr style="margin: 30px 0; border-top: 2px dashed #ccc;">
        
        <div id="goalsContainer">
            ${goalsUnitsHTML}
        </div>
        
        <button class="btn-iep btn-add-main" onclick="addNewGoalUnit()">+ إضافة هدف قصير مدى جديد (يدوي)</button>
        
        <div style="text-align:center; margin-top:30px;">
            <button class="btn btn-primary" onclick="window.print()">🖨️ طباعة الخطة</button>
        </div>
    </div>
    `;

    iepContent.innerHTML = iepHTML;
}

// --- دوال المساعدة للنموذج (Helper Functions) ---

// توليد HTML لوحدة هدف واحدة
function generateGoalUnitHTML(title = '') {
    return `
    <div class="goal-unit">
        <div class="short-goal-header">
            <button class="btn-iep btn-delete-unit" onclick="deleteUnit(this)">حذف الهدف</button>
            <label class="short-goal-label">الهدف قصير المدى:</label>
            <textarea style="width:100%; border:1px solid #ccc; background:#fff; padding:8px; text-align: right;" rows="2">${title}</textarea>
        </div>
        <table class="word-table sub-goals-table">
            <thead>
                <tr>
                    <th width="60%">الأهداف التدريسية</th>
                    <th width="15%">الإجراءات / الوسائل</th>
                    <th width="15%">تاريخ التحقق</th>
                    <th width="10%">حذف</th>
                </tr>
            </thead>
            <tbody>
                ${createSubGoalRowHTML('')}
                ${createSubGoalRowHTML('')}
            </tbody>
        </table>
        <button class="btn-iep btn-add-sub" onclick="addIEPSubGoalRow(this)">+ إضافة هدف تدريسي</button>
    </div>
    `;
}

function createSubGoalRowHTML(text) {
    return `<tr>
        <td><textarea rows="1" style="text-align:right; width:100%">${text}</textarea></td>
        <td><input type="text" placeholder="الوسائل"></td>
        <td><input type="date"></td>
        <td><button class="btn-delete-row" onclick="deleteRow(this)">×</button></td>
    </tr>`;
}

// الدوال التفاعلية (يتم ربطها بالـ window لتكون متاحة للـ onclick)
window.addNewGoalUnit = function() {
    const container = document.getElementById('goalsContainer');
    const div = document.createElement('div');
    div.innerHTML = generateGoalUnitHTML('');
    // نستخرج العنصر div الداخلي فقط
    container.appendChild(div.firstElementChild);
};

window.addIEPSubGoalRow = function(btn) {
    const tbody = btn.previousElementSibling.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = createSubGoalRowHTML('');
    tbody.appendChild(newRow);
};

window.deleteRow = function(btn) {
    btn.closest('tr').remove();
};

window.deleteUnit = function(btn) {
    if(confirm('هل أنت متأكد من حذف هذا الهدف بالكامل؟')) {
        btn.closest('.goal-unit').remove();
    }
};

// ==========================================
// بقية دوال الأقسام الأخرى (لم تتغير)
// ==========================================

function loadDiagnosticTab() {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic');

    if (assignedTest) {
        document.getElementById('noDiagnosticTest').style.display = 'none';
        const detailsDiv = document.getElementById('diagnosticTestDetails');
        detailsDiv.style.display = 'block';
        
        const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
        const originalTest = allTests.find(t => t.id === assignedTest.testId);
        
        let statusBadge = '';
        let actionContent = '';

        if(assignedTest.status === 'completed') {
            statusBadge = '<span class="badge badge-success">مكتمل</span>';
            actionContent = `
                <div style="margin-top:15px; padding:15px; background:#f0fff4; border:1px solid #c3e6cb; border-radius:5px;">
                    <strong>الدرجة الحالية: ${assignedTest.score || 0}%</strong>
                    <p>تم التصحيح.</p>
                    <button class="btn btn-warning mt-2" onclick="openReviewModal(${assignedTest.id})">🔍 مراجعة وتصحيح</button>
                </div>`;
        } else if (assignedTest.status === 'returned') {
            statusBadge = '<span class="badge badge-warning">معاد للتعديل</span>';
            actionContent = `<div class="alert alert-warning mt-3">بانتظار إعادة حل الطالب.</div>`;
        } else {
            statusBadge = '<span class="badge badge-secondary">قيد الانتظار</span>';
            actionContent = `<div class="alert alert-info mt-3">لم يكمل الطالب الاختبار بعد.</div>`;
        }

        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار محذوف'}</h3>
                    ${statusBadge}
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                ${actionContent}
            </div>
        `;
    } else {
        document.getElementById('noDiagnosticTest').style.display = 'block';
        document.getElementById('diagnosticTestDetails').style.display = 'none';
    }
}

// (دوال المراجعة السابقة openReviewModal, saveTestReview تبقى كما هي...)
// تأكد من وجودها هنا أو في ملف teacher.js
// ... (تم اختصارها للحفاظ على التركيز على النموذج الجديد) ...

function loadLessonsTab() {
    document.getElementById('studentLessonsGrid').innerHTML = '<div class="empty-state"><p>قائمة الدروس (قيد التطوير)</p></div>';
}

function loadAssignmentsTab() {
    document.getElementById('studentAssignmentsList').innerHTML = '<div class="empty-state"><p>قائمة الواجبات (قيد التطوير)</p></div>';
}

function loadProgressTab() {
    document.getElementById('progressChartContainer').innerHTML = '<div class="empty-state"><p>الرسوم البيانية (قيد التطوير)</p></div>';
}

// تصدير الدوال الضرورية
window.switchSection = switchSection;
