// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب كاملة (البيانات، الخطة، الاختبارات)
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// =========================================================
// 1. تشغيل النظام عند فتح الصفحة
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    // 1. تحديد هوية الطالب المطلوبة من الرابط
    const params = new URLSearchParams(window.location.search);
    let targetId = params.get('id');

    // إذا لم يوجد رقم في الرابط، نفترض الرقم 1
    if (!targetId) {
        targetId = 1;
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', targetId);
        window.history.replaceState({}, '', newUrl);
    }

    // 2. محاولة جلب الطلاب من الذاكرة
    let students = JSON.parse(localStorage.getItem('students') || '[]');

    // 3. البحث عن الطالب
    let foundStudent = students.find(s => s.id == targetId);

    // 4. (الحل الجذري) إذا لم نجد الطالب، نقوم بإنشائه فوراً
    if (!foundStudent) {
        console.warn(`لم يتم العثور على الطالب ${targetId}، جاري إنشاؤه تلقائياً...`);
        foundStudent = {
            id: targetId,
            name: "طالب جديد (تم إنشاؤه تلقائياً)",
            grade: "غير محدد",
            disabilityType: "صعوبات تعلم",
            age: 10
        };
        students.push(foundStudent);
        localStorage.setItem('students', JSON.stringify(students));
    }

    currentStudent = foundStudent;
    currentStudentId = targetId;

    // 5. بدء تحميل الصفحة
    loadStudentData();
    
    // تحميل التبويب الافتراضي
    switchSection('diagnostic');
    
    // التأكد من وجود بيانات للنظام
    ensureSystemDataExists(); 
});

// =========================================================
// 2. التنقل بين التبويبات
// =========================================================
function switchSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });

    // إزالة التفعيل من القائمة الجانبية
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }

    // تفعيل الزر في القائمة
    const targetLink = document.getElementById(`link-${sectionId}`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    // إذا فتحنا الخطة التربوية، نقوم بتعبئتها
    if (sectionId === 'iep') {
        loadIEPTab(currentStudentId);
    }
}

// =========================================================
// 3. عرض بيانات الطالب في الواجهة
// =========================================================
function loadStudentData() {
    if (!currentStudent) return;

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('sideName', currentStudent.name);
    setText('sideGrade', currentStudent.grade || 'غير محدد');
    setText('headerStudentName', currentStudent.name);
    
    const avatarEl = document.getElementById('sideAvatar');
    if (avatarEl) avatarEl.textContent = currentStudent.name.charAt(0);
}

// =========================================================
// 4. إدارة النوافذ المنبثقة (Modals) - [تمت إضافتها لحل المشكلة]
// =========================================================

// دالة فتح نافذة إسناد الاختبار
function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if (modal) {
        modal.style.display = 'block';
        loadAvailableTests(); // تحميل قائمة الاختبارات في القائمة المنسدلة
    } else {
        alert('عذراً، نافذة إسناد الاختبار غير موجودة في الصفحة.');
    }
}

// دالة إغلاق أي نافذة
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// تحميل الاختبارات المتاحة في القائمة المنسدلة
function loadAvailableTests() {
    const select = document.getElementById('assignTestSelect');
    if (!select) return;

    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    select.innerHTML = '<option value="">اختر الاختبار...</option>';
    
    tests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        option.textContent = test.title;
        select.appendChild(option);
    });
}

// حفظ إسناد الاختبار (عند الضغط على حفظ في النافذة)
function saveAssignedTest() {
    const select = document.getElementById('assignTestSelect');
    const testId = select ? select.value : null;

    if (!testId) {
        alert('الرجاء اختيار اختبار أولاً');
        return;
    }

    // حفظ عملية الإسناد (يمكن تعديل هذا الجزء حسب هيكلية بياناتك)
    const assignedTests = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    assignedTests.push({
        studentId: currentStudentId,
        testId: testId,
        date: new Date().toISOString(),
        status: 'pending'
    });
    localStorage.setItem('assignedTests', JSON.stringify(assignedTests));

    alert('تم إسناد الاختبار للطالب بنجاح');
    closeModal('assignTestModal');
}

// إغلاق النافذة عند النقر خارجها
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

// =========================================================
// 5. تعبئة الخطة التربوية (النموذج 9) تلقائياً
// =========================================================
function loadIEPTab(studentId) {
    console.log("تحديث بيانات الخطة للطالب:", studentId);

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');

    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let strengthPoints = [];
    let needPoints = []; 
    let targetObjectives = []; 

    if (studentResult && studentResult.answers) {
        const originalTest = tests.find(t => t.id == studentResult.testId);
        if (originalTest) {
            studentResult.answers.forEach(answer => {
                const question = originalTest.questions.find(q => q.id == answer.questionId);
                if (question && question.linkedGoalId) {
                    const objective = objectives.find(obj => obj.id == question.linkedGoalId);
                    if (objective) {
                        if (answer.isCorrect) {
                            strengthPoints.push(objective.shortTermGoal);
                        } else {
                            needPoints.push(objective.shortTermGoal);
                            targetObjectives.push({
                                short: objective.shortTermGoal,
                                instructional: (objective.instructionalGoals && objective.instructionalGoals.length > 0) 
                                    ? objective.instructionalGoals 
                                    : [objective.shortTermGoal]
                            });
                        }
                    }
                }
            });
        }
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    setVal('iep-strengths', strengthPoints.length > 0 ? strengthPoints.join('\n- ') : '');
    setVal('iep-needs', needPoints.length > 0 ? needPoints.join('\n- ') : '');

    const goalsBody = document.getElementById('iep-goals-body');
    if (goalsBody) {
        goalsBody.innerHTML = '';
        if (targetObjectives.length > 0) {
            targetObjectives.forEach(grp => {
                grp.instructional.forEach(instr => {
                    const row = `
                        <tr>
                            <td><input type="text" class="form-control" value="${grp.short}"></td>
                            <td><input type="text" class="form-control" value="${instr}"></td>
                            <td><input type="date" class="form-control"></td>
                            <td><input type="text" class="form-control" placeholder="%"></td>
                            <td><input type="text" class="form-control"></td>
                        </tr>`;
                    goalsBody.insertAdjacentHTML('beforeend', row);
                });
            });
        } else {
            goalsBody.innerHTML = `
                <tr>
                    <td><input type="text" class="form-control" placeholder="هدف قصير المدى"></td>
                    <td><input type="text" class="form-control" placeholder="هدف تدريسي"></td>
                    <td><input type="date" class="form-control"></td>
                    <td><input type="text" class="form-control"></td>
                    <td><input type="text" class="form-control"></td>
                </tr>`;
        }
    }

    fillScheduleTable(studentId);
}

// =========================================================
// 6. جدول الحصص
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
            const session = teacherSchedule.find(s => 
                s.day === day && s.period == p && 
                s.students && s.students.includes(parseInt(studentId))
            );

            if (session) {
                html += `<td><input type="text" class="form-control" value="${session.subject || 'صعوبات'}" style="background-color:#e8f5e9; text-align:center; font-weight:bold;"></td>`;
            } else {
                html += `<td><input type="text" class="form-control" disabled style="background-color:#f3f3f3;"></td>`;
            }
        }
        html += '</tr>';
    });
    scheduleBody.innerHTML = html;
}

// =========================================================
// 7. التحقق من تكامل النظام
// =========================================================
function ensureSystemDataExists() {
    if (!localStorage.getItem('objectives')) localStorage.setItem('objectives', JSON.stringify([]));
    if (!localStorage.getItem('tests')) localStorage.setItem('tests', JSON.stringify([]));
    if (!localStorage.getItem('testResults')) localStorage.setItem('testResults', JSON.stringify([]));
}
