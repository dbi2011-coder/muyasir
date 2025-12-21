// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الحل الجذري: إصلاح ربط الاختبارات + منع إنشاء طلاب وهميين
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// =========================================================
// 1. تشغيل النظام والتحقق من الطالب (بدون بيانات وهمية)
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    // 1. جلب معرف الطالب من الرابط
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');

    if (!targetId) {
        alert('خطأ: لا يوجد رقم تعريف للطالب في الرابط. الرجاء الدخول من قائمة الطلاب.');
        window.location.href = 'students.html';
        return;
    }

    // 2. جلب بيانات الطلاب الحقيقية فقط
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    // طباعة للتحقق في الـ Console
    console.log(`جاري البحث عن الطالب رقم: ${targetId}`);
    console.log(`عدد الطلاب الموجودين في النظام: ${students.length}`);

    // 3. البحث عن الطالب (مقارنة مرنة بين النص والرقم)
    currentStudent = students.find(s => s.id == targetId);

    if (!currentStudent) {
        // إذا لم يتم العثور على الطالب، لا ننشئ طالباً وهمياً، بل نبلغ المستخدم
        alert(`عذراً، بيانات الطالب رقم ${targetId} غير موجودة.\nربما تم حذف الطالب أو أن الرابط غير صحيح.`);
        window.location.href = 'students.html';
        return;
    }

    // اعتماد الطالب
    currentStudentId = targetId;
    console.log("تم تحميل ملف الطالب:", currentStudent.name);

    // 4. تحميل الواجهة
    loadStudentData();
    switchSection('diagnostic'); // الذهاب لصفحة التشخيص افتراضياً
});

// =========================================================
// 2. التنقل بين التبويبات
// =========================================================
function switchSection(sectionId) {
    // إخفاء الكل
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // إظهار المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    const targetLink = document.getElementById(`link-${sectionId}`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    // إذا كان قسم الخطة، حمل البيانات
    if (sectionId === 'iep') {
        loadIEPTab(currentStudentId);
    }
}

// =========================================================
// 3. عرض بيانات الطالب
// =========================================================
function loadStudentData() {
    if (!currentStudent) return;

    document.getElementById('sideName').textContent = currentStudent.name;
    document.getElementById('headerStudentName').textContent = currentStudent.name;
    
    // التحقق من وجود العناصر قبل تعبئتها لتجنب الأخطاء
    const sideGrade = document.getElementById('sideGrade');
    if (sideGrade) sideGrade.textContent = currentStudent.grade || 'غير محدد';
    
    const sideAvatar = document.getElementById('sideAvatar');
    if (sideAvatar) sideAvatar.textContent = currentStudent.name.charAt(0);
}

// =========================================================
// 4. إدارة إسناد الاختبارات (إصلاح مشكلة القائمة الفارغة)
// =========================================================

function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if (modal) {
        modal.style.display = 'block';
        loadAvailableTests(); // استدعاء دالة التحميل المصححة
    } else {
        alert('نافذة تعيين الاختبار غير موجودة في الصفحة HTML');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// الدالة المصححة لجلب الاختبارات من كل المصادر المحتملة
function loadAvailableTests() {
    const select = document.getElementById('assignTestSelect');
    if (!select) return;

    select.innerHTML = '<option value="">اختر الاختبار...</option>';

    // محاولة جلب الاختبارات من عدة مفاتيح محتملة في قاعدة البيانات
    const sources = [
        JSON.parse(localStorage.getItem('questionBanks') || '[]'), // المسمى المرجح لمكتبة المحتوى
        JSON.parse(localStorage.getItem('tests') || '[]'),         // مسمى احتياطي
        JSON.parse(localStorage.getItem('assessments') || '[]')    // مسمى احتياطي آخر
    ];

    // دمج كل المصادر في مصفوفة واحدة
    let allTests = [];
    sources.forEach(source => {
        if (Array.isArray(source)) allTests = [...allTests, ...source];
    });

    // إزالة التكرار بناءً على الـ ID
    const uniqueTests = Array.from(new Map(allTests.map(item => [item.id, item])).values());

    console.log(`تم العثور على ${uniqueTests.length} اختبار في المكتبة.`);

    if (uniqueTests.length === 0) {
        const option = document.createElement('option');
        option.text = "لا توجد اختبارات في مكتبة المحتوى";
        option.disabled = true;
        select.appendChild(option);
        return;
    }

    uniqueTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        // دعم مسميات مختلفة للعنوان (title, name, bankName)
        option.textContent = test.title || test.name || test.bankName || `اختبار #${test.id}`;
        select.appendChild(option);
    });
}

function saveAssignedTest() {
    const select = document.getElementById('assignTestSelect');
    const testId = select ? select.value : null;

    if (!testId) {
        alert('الرجاء اختيار اختبار من القائمة');
        return;
    }

    // حفظ التعيين
    const assignedTests = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    
    // التحقق مما إذا كان الاختبار مسنداً مسبقاً لنفس الطالب
    const alreadyAssigned = assignedTests.find(a => a.studentId == currentStudentId && a.testId == testId && a.status === 'pending');
    
    if (alreadyAssigned) {
        alert('هذا الاختبار مسند لهذا الطالب مسبقاً ولم يتم حله بعد.');
        return;
    }

    assignedTests.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: testId,
        assignedDate: new Date().toISOString(),
        status: 'pending' // بانتظار الحل
    });

    localStorage.setItem('assignedTests', JSON.stringify(assignedTests));
    alert('تم إسناد الاختبار بنجاح.');
    closeModal('assignTestModal');
    
    // تحديث قائمة الاختبارات المسندة في الصفحة (إن وجدت)
    if (typeof loadAssignedTestsTable === 'function') {
        loadAssignedTestsTable();
    }
}

// =========================================================
// 5. تعبئة الخطة التربوية (النموذج 9) تلقائياً
// =========================================================
function loadIEPTab(studentId) {
    console.log("تحديث الخطة للطالب:", studentId);

    // جلب البيانات (الأهداف، الاختبارات، النتائج)
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    // البحث عن الاختبارات في كل الأماكن
    const bank1 = JSON.parse(localStorage.getItem('questionBanks') || '[]');
    const bank2 = JSON.parse(localStorage.getItem('tests') || '[]');
    const allTests = [...bank1, ...bank2];
    
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');

    // البحث عن نتائج تشخيصية لهذا الطالب
    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let strengthPoints = [];
    let needPoints = []; 
    let targetObjectives = []; 

    if (studentResult && studentResult.answers) {
        const originalTest = allTests.find(t => t.id == studentResult.testId);
        
        if (originalTest) {
            studentResult.answers.forEach(answer => {
                // قد تختلف هيكلة الأسئلة (questions أو items)
                const questionsList = originalTest.questions || originalTest.items || [];
                const question = questionsList.find(q => q.id == answer.questionId);
                
                if (question && question.linkedGoalId) {
                    const objective = objectives.find(obj => obj.id == question.linkedGoalId);
                    if (objective) {
                        if (answer.isCorrect) {
                            strengthPoints.push(objective.shortTermGoal);
                        } else {
                            needPoints.push(objective.shortTermGoal);
                            const instructional = (objective.instructionalGoals && objective.instructionalGoals.length > 0) 
                                ? objective.instructionalGoals 
                                : [objective.shortTermGoal];
                            
                            targetObjectives.push({
                                short: objective.shortTermGoal,
                                instructional: instructional
                            });
                        }
                    }
                }
            });
        }
    }

    // تعبئة الحقول
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('iep-strengths', strengthPoints.join('\n- '));
    setVal('iep-needs', needPoints.join('\n- '));

    // تعبئة جدول الأهداف
    const goalsBody = document.getElementById('iep-goals-body');
    if (goalsBody) {
        goalsBody.innerHTML = '';
        targetObjectives.forEach(grp => {
            grp.instructional.forEach(instr => {
                const row = `
                    <tr>
                        <td><input type="text" class="form-control" value="${grp.short}"></td>
                        <td><input type="text" class="form-control" value="${instr}"></td>
                        <td><input type="date" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                    </tr>`;
                goalsBody.insertAdjacentHTML('beforeend', row);
            });
        });
        if (targetObjectives.length === 0) {
             goalsBody.innerHTML = `<tr><td colspan="5" class="text-center">لا توجد نتائج تشخيصية بعد. يرجى إسناد اختبار وتصحيحه.</td></tr>`;
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
                s.students && s.students.includes(parseInt(studentId)) // التأكد من نوع الرقم
            );

            if (session) {
                html += `<td><input type="text" class="form-control" value="${session.subject || 'صعوبات'}" style="background-color:#e8f5e9; text-align:center;"></td>`;
            } else {
                html += `<td><input type="text" class="form-control" disabled style="background-color:#f3f3f3;"></td>`;
            }
        }
        html += '</tr>';
    });
    scheduleBody.innerHTML = html;
}

// إغلاق النوافذ عند النقر خارجها
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
