// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب - نسخة ذكية (تقوم بإصلاح أخطاء الرابط تلقائياً)
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// =========================================================
// 1. عند تحميل الصفحة
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    // جلب معرف الطالب من الرابط
    const params = new URLSearchParams(window.location.search);
    let idParam = params.get('id');

    // تحميل بيانات الطلاب من الذاكرة
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // --- بداية الإصلاح الذكي ---
    if (students.length === 0) {
        // حالة: لا يوجد أي طالب مضاف في النظام
        alert('تنبيه: لا يوجد أي طلاب مضافين في النظام حالياً.\nسيتم إضافة "طالب تجريبي" تلقائياً لتتمكن من معاينة الصفحة.');
        seedTestData(); // إضافة بيانات تجريبية فوراً
        window.location.reload(); // إعادة تحميل الصفحة لرؤية الطالب التجريبي
        return;
    }

    // محاولة العثور على الطالب المحدد
    let foundStudent = students.find(s => s.id == idParam);

    if (!foundStudent) {
        // حالة: الرابط يحتوي على رقم خطأ، أو الطالب المحذوف
        console.warn(`لم يتم العثور على الطالب برقم ${idParam}. جاري البحث عن بديل...`);
        
        if (students.length > 0) {
            // الحل: فتح أول طالب موجود في القائمة
            foundStudent = students[0];
            // alert(`تنبيه: لم يتم العثور على الطالب المطلوب (رقم ${idParam || 'غير محدد'}).\nسيتم عرض ملف الطالب: "${foundStudent.name}" بدلاً منه.`);
            
            // تحديث الرابط في المتصفح ليعكس الرقم الصحيح (بدون إعادة تحميل)
            const newUrl = new URL(window.location);
            newUrl.searchParams.set('id', foundStudent.id);
            window.history.replaceState({}, '', newUrl);
        }
    }

    // اعتماد الطالب الذي تم العثور عليه
    currentStudent = foundStudent;
    currentStudentId = currentStudent.id;
    // --- نهاية الإصلاح الذكي ---

    console.log("تم تحميل ملف الطالب:", currentStudent.name);

    // تحميل بيانات الواجهة
    loadStudentData();
    
    // تفعيل التبويب الافتراضي
    switchSection('diagnostic');
});

// =========================================================
// 2. دالة التنقل بين التبويبات
// =========================================================
function switchSection(sectionId) {
    // إخفاء الكل
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // إزالة التفعيل من القائمة
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }

    // تفعيل الرابط
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
// 3. عرض بيانات الطالب الأساسية
// =========================================================
function loadStudentData() {
    if (!currentStudent) return;

    // تحديث العناصر في الصفحة
    const els = {
        name: document.getElementById('sideName'),
        grade: document.getElementById('sideGrade'),
        avatar: document.getElementById('sideAvatar'),
        header: document.getElementById('headerStudentName')
    };

    if (els.name) els.name.textContent = currentStudent.name;
    if (els.grade) els.grade.textContent = currentStudent.grade || 'غير محدد';
    if (els.avatar) els.avatar.textContent = currentStudent.name.charAt(0);
    if (els.header) els.header.textContent = currentStudent.name;
}

// =========================================================
// 4. تعبئة الخطة التربوية (نموذج 9) تلقائياً
// =========================================================
function loadIEPTab(studentId) {
    console.log("تجهيز الخطة للطالب:", studentId);
    
    // جلب المصادر
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');

    // البحث عن آخر اختبار تشخيصي
    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let strengthPoints = [];
    let needPoints = []; 
    let targetObjectives = []; 

    // تحليل الإجابات
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
                            // إضافة للأهداف
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

    // تعبئة الواجهة (Textareas)
    const strengthsInput = document.getElementById('iep-strengths');
    const needsInput = document.getElementById('iep-needs');

    if (strengthsInput) {
        strengthsInput.value = strengthPoints.length > 0 ? strengthPoints.join('\n- ') : '';
        if(strengthPoints.length === 0) strengthsInput.placeholder = "لا توجد نقاط قوة مسجلة من الاختبار";
    }
    if (needsInput) {
        needsInput.value = needPoints.length > 0 ? needPoints.join('\n- ') : '';
        if(needPoints.length === 0) needsInput.placeholder = "لا توجد نقاط احتياج مسجلة";
    }

    // تعبئة جدول الأهداف
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
            goalsBody.innerHTML = '<tr><td colspan="5" class="text-center">لم يتم استخراج أهداف من الاختبار التشخيصي.</td></tr>';
        }
    }

    // تعبئة جدول الحصص
    fillScheduleTable(studentId);
}

// =========================================================
// 5. دالة جدول الحصص
// =========================================================
function fillScheduleTable(studentId) {
    const scheduleBody = document.getElementById('iep-schedule-body');
    if (!scheduleBody) return;

    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    let html = '';
    days.forEach(day => {
        html += `<tr><td style="font-weight:bold; background:#f8f9fa;">${day}</td>`;
        for (let p = 1; p <= 7; p++) {
            // البحث عن الحصة
            const session = teacherSchedule.find(s => 
                s.day === day && s.period == p && 
                s.students && s.students.includes(parseInt(studentId))
            );

            if (session) {
                html += `<td><input type="text" class="form-control" value="${session.subject || 'صعوبات'}" style="background:#e8f5e9; text-align:center;"></td>`;
            } else {
                html += `<td><input type="text" class="form-control" disabled style="background:#f1f1f1;"></td>`;
            }
        }
        html += '</tr>';
    });
    scheduleBody.innerHTML = html;
}

// =========================================================
// 6. بيانات احتياطية (تعمل فقط إذا كان النظام فارغاً تماماً)
// =========================================================
function seedTestData() {
    // هذه الدالة تعمل فقط إذا لم يكن لديك أي بيانات بتاتاً
    // للتأكد من أن الصفحة تعمل لأول مرة
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify([
            { id: 1, name: "الطالب (تجريبي)", grade: "الخامس", disabilityType: "صعوبات تعلم" }
        ]));
    }
    // إضافة أهداف وتجهيزات للاختبار إذا لزم الأمر...
    if (!localStorage.getItem('objectives')) {
        localStorage.setItem('objectives', JSON.stringify([
            { id: 101, shortTermGoal: "قراءة الحروف بالحركات", instructionalGoals: ["قراءة بالفتح", "قراءة بالضم"] }
        ]));
    }
}
