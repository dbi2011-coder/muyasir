// ============================================
// 📁 المسار: assets/js/student-profile.js
// الوصف: إدارة ملف الطالب والنموذج 9 الذكي
// ============================================

let currentStudentId = null;
let currentStudent = null;

document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));
    
    if (!currentStudentId) {
        // إذا لم يوجد ID في الرابط، نحاول جلبه من التخزين أو نعود للصفحة الرئيسية
        alert('لم يتم تحديد طالب');
        window.history.back();
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
        return;
    }

    // تحديث الواجهة بالعناصر الموجودة
    if(document.getElementById('sideName')) document.getElementById('sideName').textContent = currentStudent.name;
    if(document.getElementById('headerStudentName')) document.getElementById('headerStudentName').textContent = currentStudent.name;
    if(document.getElementById('sideGrade')) document.getElementById('sideGrade').textContent = (currentStudent.grade || '') + ' - ' + (currentStudent.subject || 'عام');
    if(document.getElementById('sideAvatar')) document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
    document.title = `ملف الطالب: ${currentStudent.name}`;

    // تفعيل التبويب الافتراضي (التشخيص)
    switchSection('diagnostic');
}

// التنقل بين الأقسام (Tabs)
function switchSection(sectionId) {
    // 1. تحديث القائمة الجانبية
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.getElementById(`link-${sectionId}`);
    if(activeLink) activeLink.classList.add('active');

    // 2. إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
    });
    
    // 3. إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if(targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    }

    // 4. تشغيل الدالة المناسبة للقسم
    if (sectionId === 'diagnostic') loadDiagnosticTab();
    if (sectionId === 'iep') loadIEPTab(); // استدعاء دالة الخطة الجديدة
    if (sectionId === 'lessons') loadLessonsTab();
    if (sectionId === 'assignments') loadAssignmentsTab();
    if (sectionId === 'progress') loadProgressTab();
}

// ================================================================
//  ⚡ المحرك الذكي لنموذج 9 (Smart IEP Engine)
// ================================================================

function loadIEPTab() {
    console.log("تشغيل دالة الخطة التربوية الذكية...");
    
    // محاولة العثور على الحاوية الصحيحة
    const iepContainer = document.getElementById('iepContent') || document.getElementById('iepContainer');
    
    if (!iepContainer) {
        console.error("خطأ: لم يتم العثور على عنصر 'iepContent' في صفحة HTML");
        return;
    }

    // تجهيز البيانات
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const assignedTest = studentTests.find(t => t.studentId === currentStudentId && t.type === 'diagnostic');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const originalTest = assignedTest ? allTests.find(t => t.id === assignedTest.testId) : null;
    
    // متغيرات لبناء الخطة
    let strengthsHTML = '';
    let needsHTML = '';
    let goalsUnitsHTML = '';
    let totalGoals = 0;
    let passedGoals = 0;

    // تحليل نتائج الاختبار (إذا وجد)
    if (originalTest && originalTest.questions && assignedTest && assignedTest.answers) {
        const answers = assignedTest.answers || [];
        originalTest.questions.forEach(q => {
            totalGoals++;
            const studentAns = answers.find(a => a.questionId === q.id);
            const score = studentAns ? (studentAns.score || 0) : 0;
            const passingScore = q.passingScore || 5;
            const skillText = q.text; // نص السؤال يمثل المهارة

            if (score >= passingScore) {
                // اجتياز -> نقاط قوة
                passedGoals++;
                strengthsHTML += `<li class="point-item"><span class="point-bullet">•</span><input type="text" value="${skillText}" readonly></li>`;
            } else {
                // إخفاق -> احتياج + هدف جديد
                needsHTML += `<li class="point-item"><span class="point-bullet">•</span><input type="text" value="${skillText}" readonly></li>`;
                // إنشاء وحدة هدف للخطة
                goalsUnitsHTML += generateGoalUnitHTML(skillText);
            }
        });
    } else {
        // بيانات افتراضية للتجربة (في حال عدم وجود اختبار)
        strengthsHTML = `<li class="point-item"><span class="point-bullet">•</span><input type="text" value="الدافعية للتعلم" style="width:90%"></li>`;
        needsHTML = `<li class="point-item"><span class="point-bullet">•</span><input type="text" value="يحتاج لإجراء اختبار تشخيصي" style="width:90%"></li>`;
        goalsUnitsHTML = generateGoalUnitHTML('هدف قصير المدى مقترح');
    }

    // حساب نسبة الإنجاز والهدف البعيد
    const progressPercent = totalGoals === 0 ? 0 : Math.round((passedGoals / totalGoals) * 100);
    const subjectSkill = currentStudent.subject && currentStudent.subject.includes('رياضيات') ? "العمليات الحسابية" : "القراءة والكتابة";
    const longTermGoal = `أن يتقن التلميذ مهارات "${subjectSkill}" للصف ${currentStudent.grade || 'الحالي'} وبنسبة إتقان لا تقل عن 80%`;
    const todayDate = new Date().toISOString().split('T')[0];

    // بناء الهيكل (HTML Injection)
    const iepHTML = `
    <div class="iep-word-model">
        <div class="no-print" style="text-align:left; margin-bottom:15px;">
            <button class="btn btn-primary" onclick="window.print()">🖨️ طباعة الخطة</button>
        </div>

        <h3 style="text-align:center; margin-bottom:20px; color:#000; font-weight:bold;">نموذج (9) الخطة التربوية الفردية</h3>

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
                <th>نسبة الإنجاز</th>
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
                    <td><input type="number" placeholder="-"></td>
                    <td><input type="number" placeholder="-"></td>
                    <td><input type="number" placeholder="-"></td>
                    <td><input type="number" placeholder="-"></td>
                    <td><input type="number" placeholder="-"></td>
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
        
        <button class="btn btn-secondary btn-sm mt-3 no-print btn-add-main" onclick="addNewGoalUnit()">+ إضافة هدف قصير مدى جديد (يدوي)</button>
    </div>
    `;

    iepContainer.innerHTML = iepHTML;
}

// --- دوال المساعدة للنموذج (Helper Functions) ---

function generateGoalUnitHTML(title = '') {
    return `
    <div class="goal-unit">
        <div class="short-goal-header">
            <button class="btn-delete-unit no-print" onclick="this.closest('.goal-unit').remove()">حذف الهدف</button>
            <label class="short-goal-label">الهدف قصير المدى:</label>
            <textarea style="width:100%; border:1px solid #ccc; background:#fff; padding:8px; text-align: right;" rows="2">${title}</textarea>
        </div>
        <table class="word-table sub-goals-table">
            <thead>
                <tr>
                    <th width="60%">الأهداف التدريسية</th>
                    <th width="15%">الإجراءات / الوسائل</th>
                    <th width="15%">تاريخ التحقق</th>
                    <th width="10%" class="no-print">حذف</th>
                </tr>
            </thead>
            <tbody>
                ${createSubGoalRowHTML('')}
                ${createSubGoalRowHTML('')}
            </tbody>
        </table>
        <button class="btn-add-sub no-print" onclick="addIEPSubGoalRow(this)">+ إضافة هدف تدريسي</button>
    </div>
    `;
}

function createSubGoalRowHTML(text) {
    return `<tr>
        <td><textarea rows="1" style="text-align:right; width:100%">${text}</textarea></td>
        <td><input type="text" placeholder="الوسائل"></td>
        <td><input type="date"></td>
        <td class="no-print"><button class="btn-delete-row" onclick="this.closest('tr').remove()">×</button></td>
    </tr>`;
}

// الدوال التفاعلية (Global Scope)
window.addNewGoalUnit = function() {
    const container = document.getElementById('goalsContainer');
    const div = document.createElement('div');
    div.innerHTML = generateGoalUnitHTML('');
    container.appendChild(div.firstElementChild);
};

window.addIEPSubGoalRow = function(btn) {
    const tbody = btn.previousElementSibling.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = createSubGoalRowHTML('');
    tbody.appendChild(newRow);
};

// ==========================================
// بقية الدوال القديمة (للأمان)
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
        
        let statusBadge = assignedTest.status === 'completed' ? 
            '<span class="badge badge-success">مكتمل</span>' : '<span class="badge badge-secondary">قيد الانتظار</span>';

        detailsDiv.innerHTML = `
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>${originalTest ? originalTest.title : 'اختبار محذوف'}</h3>
                    ${statusBadge}
                </div>
                <p class="text-muted">تاريخ التعيين: ${new Date(assignedTest.assignedDate).toLocaleDateString('ar-SA')}</p>
                ${assignedTest.status === 'completed' ? `<div class="alert alert-success">تم التصحيح. الدرجة: ${assignedTest.score}%</div>` : ''}
            </div>
        `;
    } else {
        document.getElementById('noDiagnosticTest').style.display = 'block';
        document.getElementById('diagnosticTestDetails').style.display = 'none';
    }
}

// دوال فارغة للأقسام الأخرى
function loadLessonsTab() {
    const el = document.getElementById('studentLessonsGrid');
    if(el) el.innerHTML = '<div class="empty-state"><p>قائمة الدروس (قيد التطوير)</p></div>';
}
function loadAssignmentsTab() {
    const el = document.getElementById('studentAssignmentsList');
    if(el) el.innerHTML = '<div class="empty-state"><p>قائمة الواجبات (قيد التطوير)</p></div>';
}
function loadProgressTab() {
    const el = document.getElementById('progressChartContainer');
    if(el) el.innerHTML = '<div class="empty-state"><p>الرسوم البيانية (قيد التطوير)</p></div>';
}

// تصدير الدوال الضرورية لملف HTML
window.switchSection = switchSection;
window.loadIEPTab = loadIEPTab;
window.assignTest = function() { alert('وظيفة تعيين الاختبار'); };
window.closeModal = function(id) { document.getElementById(id).classList.remove('show'); };
