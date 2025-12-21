// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب + الخطة التربوية (المنطق المعتمد: نموذج 9)
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// =========================================================
// 1. تشغيل النظام والتحقق من الطالب
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');

    // جلب قائمة الطلاب الحالية
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // --- منطقة الأمان: معالجة مشكلة "الطالب غير موجود" ---
    if (students.length === 0) {
        alert('لا توجد بيانات طلاب. سيتم توجيهك لإضافة طالب جديد.');
        window.location.href = 'students.html';
        return;
    }

    // البحث عن الطالب (مقارنة مرنة)
    let foundStudent = students.find(s => s.id == targetId);

    if (!foundStudent) {
        // إذا كان الرابط خاطئاً، نفتح أول طالب موجود تلقائياً لضمان عمل الصفحة
        console.warn(`لم يتم العثور على الطالب ${targetId}، جاري الفتح التلقائي لأول ملف متاح.`);
        foundStudent = students[0];
        
        // تعديل الرابط في المتصفح بصمت
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', foundStudent.id);
        window.history.replaceState({}, '', newUrl);
    }

    currentStudent = foundStudent;
    currentStudentId = currentStudent.id;
    // -----------------------------------------------------

    // تحميل الواجهة
    loadStudentData();
    switchSection('diagnostic'); // البدء بصفحة التشخيص
});

// =========================================================
// 2. التنقل بين التبويبات
// =========================================================
function switchSection(sectionId) {
    // إخفاء الكل
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active', 'show'));
    document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
    
    // إلغاء تفعيل الروابط
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(el => el.classList.remove('active'));

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active', 'show');
        targetSection.style.display = 'block';
    }

    // تفعيل الرابط
    const targetLink = document.getElementById(`link-${sectionId}`);
    if (targetLink) targetLink.classList.add('active');

    // إذا تم فتح "الخطة التربوية"، نفذ الخوارزمية الخاصة بها
    if (sectionId === 'iep') {
        loadIEPTab(currentStudentId);
    }
}

// =========================================================
// 3. عرض بيانات الطالب (الهيدر والقائمة الجانبية)
// =========================================================
function loadStudentData() {
    if (!currentStudent) return;
    
    const setTxt = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
    
    setTxt('sideName', currentStudent.name);
    setTxt('headerStudentName', currentStudent.name);
    setTxt('sideGrade', currentStudent.grade || 'غير محدد');
    
    const avatar = document.getElementById('sideAvatar');
    if(avatar) avatar.textContent = currentStudent.name.charAt(0);
}

// =========================================================
// 4. الخوارزمية الأساسية: تعبئة نموذج 9 تلقائياً
// =========================================================
function loadIEPTab(studentId) {
    console.log("جاري تحليل الاختبار التشخيصي وتعبئة النموذج 9...");

    // 1. جلب المصادر
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    
    // تجميع مصادر الاختبارات (لضمان العثور على الأسئلة)
    const bank1 = JSON.parse(localStorage.getItem('questionBanks') || '[]');
    const bank2 = JSON.parse(localStorage.getItem('tests') || '[]');
    const allTests = [...bank1, ...bank2];

    // 2. العثور على أحدث اختبار تشخيصي للطالب
    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    // مصفوفات التخزين
    let strengthGoals = []; // لتخزين الأهداف القصيرة (نقاط القوة)
    let needGoals = [];     // لتخزين الأهداف القصيرة (نقاط الاحتياج)
    let detailedPlan = [];  // لتخزين الهيكل التفصيلي للجدول

    // 3. تحليل الأسئلة (المنطق المطلوب)
    if (studentResult && studentResult.answers) {
        const originalTest = allTests.find(t => t.id == studentResult.testId);
        
        if (originalTest) {
            // التعامل مع اختلاف مسميات الأسئلة في قواعد البيانات المختلفة
            const questionsList = originalTest.questions || originalTest.items || [];

            studentResult.answers.forEach(answer => {
                const question = questionsList.find(q => q.id == answer.questionId);
                
                // شرط أساسي: السؤال مربوط بهدف
                if (question && question.linkedGoalId) {
                    const objective = objectives.find(obj => obj.id == question.linkedGoalId);
                    
                    if (objective) {
                        if (answer.isCorrect) {
                            // أ) إجابة صحيحة -> قائمة نقاط القوة (هدف قصير فقط)
                            // نمنع التكرار إذا تكرر الهدف في أكثر من سؤال
                            if (!strengthGoals.includes(objective.shortTermGoal)) {
                                strengthGoals.push(objective.shortTermGoal);
                            }
                        } else {
                            // ب) إجابة خاطئة -> قائمة نقاط الاحتياج (هدف قصير فقط)
                            if (!needGoals.includes(objective.shortTermGoal)) {
                                needGoals.push(objective.shortTermGoal);
                                
                                // ج) تحضير بيانات الجدول (هدف قصير + أهدافه التدريسية)
                                // إذا لم يكن للهدف أهداف تدريسية فرعية، نستخدم الهدف القصير نفسه كتدريسي
                                const instructionals = (objective.instructionalGoals && objective.instructionalGoals.length > 0)
                                    ? objective.instructionalGoals
                                    : [objective.shortTermGoal];

                                detailedPlan.push({
                                    short: objective.shortTermGoal,
                                    instructional: instructionals
                                });
                            }
                        }
                    }
                }
            });
        }
    }

    // 4. التعبئة في الواجهة (DOM Manipulation)

    // أ) تعبئة حقل نقاط القوة
    const strengthInput = document.getElementById('iep-strengths');
    if (strengthInput) {
        strengthInput.value = strengthGoals.length > 0 
            ? strengthGoals.join('\n- ') // كل هدف في سطر
            : '';
        if (strengthGoals.length === 0) strengthInput.placeholder = "لا توجد نقاط قوة مسجلة بناءً على الاختبار.";
    }

    // ب) تعبئة حقل نقاط الاحتياج
    const needsInput = document.getElementById('iep-needs');
    if (needsInput) {
        needsInput.value = needGoals.length > 0 
            ? needGoals.join('\n- ') 
            : '';
        if (needGoals.length === 0) needsInput.placeholder = "لا توجد نقاط احتياج مسجلة.";
    }

    // ج) تعبئة الجدول التفصيلي (الهدف القصير | الأهداف التدريسية | التاريخ)
    const goalsBody = document.getElementById('iep-goals-body');
    if (goalsBody) {
        goalsBody.innerHTML = ''; // مسح المحتوى القديم

        if (detailedPlan.length > 0) {
            detailedPlan.forEach(planItem => {
                // سنقوم بإنشاء صف لكل هدف تدريسي ليكون قابلاً للتعديل بشكل منفصل
                // العمود الأول (الهدف القصير) سيتكرر أو يمكن دمجه، هنا سأكرره للوضوح وقابلية التعديل
                
                planItem.instructional.forEach((instrGoal, index) => {
                    const row = document.createElement('tr');
                    
                    // تصميم الصف:
                    // 1. الهدف القصير (يظهر القيمة الآلية وقابل للتعديل)
                    // 2. الهدف التدريسي (يظهر القيمة الآلية وقابل للتعديل)
                    // 3. تاريخ التحقق (فارغ للمعلم)
                    
                    row.innerHTML = `
                        <td>
                            <input type="text" class="form-control" 
                                   value="${planItem.short}" 
                                   title="الهدف قصير المدى">
                        </td>
                        <td>
                            <input type="text" class="form-control" 
                                   value="${instrGoal}" 
                                   title="الهدف التدريسي">
                        </td>
                        <td>
                            <input type="date" class="form-control" title="تاريخ التحقق">
                        </td>
                        <td><input type="text" class="form-control" placeholder="%"></td>
                        <td><input type="text" class="form-control"></td>
                    `;
                    goalsBody.appendChild(row);
                });
            });
        } else {
            // رسالة في حال عدم وجود بيانات
            goalsBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted p-4">
                        لم يتم استخراج أهداف. قم بإسناد اختبار تشخيصي وتصحيحه لتعبئة الخطة تلقائياً.
                    </td>
                </tr>`;
        }
    }

    // 5. تعبئة جدول الحصص (من جدول المعلم)
    fillScheduleTable(studentId);
}

// =========================================================
// 5. تعبئة جدول الحصص (منعكس من جدول المعلم)
// =========================================================
function fillScheduleTable(studentId) {
    const scheduleBody = document.getElementById('iep-schedule-body');
    if (!scheduleBody) return;

    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    let html = '';
    days.forEach(day => {
        html += `<tr><td style="font-weight:bold; background-color:#f8f9fa;">${day}</td>`;
        
        for (let p = 1; p <= 7; p++) {
            // البحث عن حصة لهذا الطالب في هذا اليوم وهذا الوقت
            const session = teacherSchedule.find(s => 
                s.day === day && 
                s.period == p && 
                s.students && s.students.includes(parseInt(studentId)) // التأكد من النوع الرقمي
            );

            if (session) {
                // حصة موجودة
                html += `
                    <td>
                        <input type="text" class="form-control" 
                               value="${session.subject || 'صعوبات'}" 
                               style="background-color:#e8f5e9; text-align:center; font-weight:bold;">
                    </td>`;
            } else {
                // حصة فارغة
                html += `<td><input type="text" class="form-control" disabled style="background-color:#f9f9f9;"></td>`;
            }
        }
        html += '</tr>';
    });
    scheduleBody.innerHTML = html;
}

// =========================================================
// 6. دوال النوافذ المنبثقة (إسناد الاختبارات)
// =========================================================
function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if (modal) {
        modal.style.display = 'block';
        loadAvailableTests();
    } else {
        alert('نافذة إسناد الاختبار غير موجودة في الصفحة.');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function loadAvailableTests() {
    const select = document.getElementById('assignTestSelect');
    if (!select) return;

    select.innerHTML = '<option value="">اختر الاختبار...</option>';

    // البحث في جميع المخازن المحتملة
    const sources = [
        JSON.parse(localStorage.getItem('questionBanks') || '[]'),
        JSON.parse(localStorage.getItem('tests') || '[]'),
        JSON.parse(localStorage.getItem('assessments') || '[]')
    ];

    let allTests = [];
    sources.forEach(src => { if(Array.isArray(src)) allTests = [...allTests, ...src]; });

    // إزالة التكرار
    const uniqueTests = Array.from(new Map(allTests.map(item => [item.id, item])).values());

    if (uniqueTests.length === 0) {
        const option = document.createElement('option');
        option.text = "لا توجد اختبارات متاحة";
        option.disabled = true;
        select.appendChild(option);
        return;
    }

    uniqueTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        option.textContent = test.title || test.name || test.bankName || `اختبار #${test.id}`;
        select.appendChild(option);
    });
}

function saveAssignedTest() {
    const select = document.getElementById('assignTestSelect');
    const testId = select ? select.value : null;

    if (!testId) {
        alert('الرجاء اختيار اختبار');
        return;
    }

    const assignedTests = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    
    // التحقق من التكرار
    const exists = assignedTests.find(a => a.studentId == currentStudentId && a.testId == testId && a.status === 'pending');
    if(exists) {
        alert('الاختبار مسند بالفعل.');
        return;
    }

    assignedTests.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: testId,
        assignedDate: new Date().toISOString(),
        status: 'pending'
    });

    localStorage.setItem('assignedTests', JSON.stringify(assignedTests));
    alert('تم إسناد الاختبار بنجاح');
    closeModal('assignTestModal');
}

// إغلاق المودال عند النقر في الخارج
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
