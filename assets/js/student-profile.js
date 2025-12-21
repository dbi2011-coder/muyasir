// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب (مع إصلاح مشكلة عدم تطابق المعرفات)
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// =========================================================
// 1. تشغيل النظام عند فتح الصفحة
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    // 1. جلب معرف الطالب من الرابط
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');

    // 2. جلب قائمة الطلاب الحقيقية من النظام
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // حالة 1: لا يوجد طلاب مضافين في النظام نهائياً
    if (students.length === 0) {
        alert('تنبيه: لا توجد بيانات طلاب مخزنة في النظام.\nسيتم توجيهك لصفحة الطلاب لإضافة طالب جديد.');
        window.location.href = 'students.html'; // تأكد من اسم صفحة قائمة الطلاب
        return;
    }

    // 3. محاولة العثور على الطالب المطلوب
    // نستخدم (==) للمرونة بين الرقم والنص
    let foundStudent = students.find(s => s.id == targetId);

    // حالة 2: الرابط يحتوي رقم خطأ، أو الطالب المحذوف، أو المعرف تغير
    if (!foundStudent) {
        console.warn(`لم يتم العثور على الطالب برقم ${targetId}.`);
        
        // الحل الذكي: فتح ملف "أول طالب موجود" بدلاً من الخطأ
        foundStudent = students[0];
        
        // تحديث الرابط في المتصفح ليعكس الرقم الصحيح للطالب الموجود
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', foundStudent.id);
        window.history.replaceState({}, '', newUrl);
        
        console.log(`تم التحويل تلقائياً لملف الطالب: ${foundStudent.name}`);
    }

    // اعتماد الطالب
    currentStudent = foundStudent;
    currentStudentId = currentStudent.id;

    // 4. تحميل الواجهة
    loadStudentData();
    switchSection('diagnostic'); // التبويب الافتراضي
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
// 3. عرض بيانات الطالب
// =========================================================
function loadStudentData() {
    if (!currentStudent) return;

    // دالة مساعدة لتحديث النصوص بأمان
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('sideName', currentStudent.name);
    setText('headerStudentName', currentStudent.name);
    setText('sideGrade', currentStudent.grade || 'غير محدد');
    
    const avatarEl = document.getElementById('sideAvatar');
    if (avatarEl) avatarEl.textContent = currentStudent.name.charAt(0);
}

// =========================================================
// 4. إدارة إسناد الاختبارات (متوافق مع مكتبة المحتوى)
// =========================================================

function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if (modal) {
        modal.style.display = 'block';
        loadAvailableTests();
    } else {
        alert('خطأ: نافذة تعيين الاختبار (Modal) غير موجودة في كود HTML.');
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

    // البحث في جميع أماكن التخزين المحتملة للاختبارات
    const sources = [
        JSON.parse(localStorage.getItem('questionBanks') || '[]'), // الأرجح لمكتبة المحتوى
        JSON.parse(localStorage.getItem('tests') || '[]'),
        JSON.parse(localStorage.getItem('assessments') || '[]')
    ];

    // دمج المصفوفات
    let allTests = [];
    sources.forEach(src => { if(Array.isArray(src)) allTests = [...allTests, ...src]; });

    // إزالة التكرار
    const uniqueTests = Array.from(new Map(allTests.map(item => [item.id, item])).values());

    if (uniqueTests.length === 0) {
        const option = document.createElement('option');
        option.text = "لا توجد اختبارات متاحة في المكتبة";
        option.disabled = true;
        select.appendChild(option);
        return;
    }

    uniqueTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        // محاولة إيجاد الاسم الصحيح
        option.textContent = test.title || test.name || test.bankName || `اختبار #${test.id}`;
        select.appendChild(option);
    });
}

function saveAssignedTest() {
    const select = document.getElementById('assignTestSelect');
    const testId = select ? select.value : null;

    if (!testId) {
        alert('الرجاء اختيار اختبار.');
        return;
    }

    const assignedTests = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    
    // منع التكرار لنفس الاختبار
    const exists = assignedTests.find(a => a.studentId == currentStudentId && a.testId == testId && a.status === 'pending');
    if(exists) {
        alert('هذا الاختبار مسند للطالب بالفعل.');
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
    alert('تم إسناد الاختبار بنجاح.');
    closeModal('assignTestModal');
}

// =========================================================
// 5. تعبئة الخطة التربوية (النموذج 9) تلقائياً
// =========================================================
function loadIEPTab(studentId) {
    console.log("تحديث الخطة للطالب:", studentId);

    // تجهيز البيانات
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    
    // تجميع الاختبارات لمعرفة تفاصيل الأسئلة
    const bank1 = JSON.parse(localStorage.getItem('questionBanks') || '[]');
    const bank2 = JSON.parse(localStorage.getItem('tests') || '[]');
    const allTests = [...bank1, ...bank2];

    // جلب أحدث نتيجة تشخيصية
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
                const qList = originalTest.questions || originalTest.items || [];
                const question = qList.find(q => q.id == answer.questionId);
                
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

    // تعبئة الحقول النصية
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
            goalsBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">لم يتم استخراج أهداف. يرجى إسناد اختبار تشخيصي للطالب وتصحيحه.</td></tr>`;
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
