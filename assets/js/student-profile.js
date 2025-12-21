// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب (النسخة الشاملة - بحث ذكي عن الاختبارات)
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// =========================================================
// 1. عند تحميل الصفحة
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // التحقق من وجود طلاب
    if (students.length === 0) {
        alert('لا توجد بيانات طلاب. سيتم توجيهك لإضافة طالب جديد.');
        window.location.href = 'students.html';
        return;
    }

    // البحث عن الطالب (مقارنة مرنة)
    let foundStudent = students.find(s => s.id == targetId);

    // معالجة حالة عدم تطابق المعرف
    if (!foundStudent) {
        console.warn(`لم يتم العثور على الطالب ${targetId}، جاري الفتح التلقائي لأول ملف متاح.`);
        foundStudent = students[0];
        
        // تعديل الرابط
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', foundStudent.id);
        window.history.replaceState({}, '', newUrl);
    }

    currentStudent = foundStudent;
    currentStudentId = currentStudent.id;

    // تحميل الواجهة
    loadStudentData();
    switchSection('diagnostic'); // البدء بصفحة التشخيص
});

// =========================================================
// 2. التنقل بين التبويبات (هذه هي الدالة المفقودة)
// =========================================================
function switchSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    
    // إلغاء تفعيل الروابط
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(el => {
        el.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
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
// 3. عرض بيانات الطالب
// =========================================================
function loadStudentData() {
    if (!currentStudent) return;
    
    const setText = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
    
    setText('sideName', currentStudent.name);
    setText('headerStudentName', currentStudent.name);
    setText('sideGrade', currentStudent.grade || 'غير محدد');
    
    const avatar = document.getElementById('sideAvatar');
    if(avatar) avatar.textContent = currentStudent.name.charAt(0);
}

// =========================================================
// 4. إدارة النوافذ والاختبارات (البحث الذكي الشامل)
// =========================================================
function showAssignTestModal() {
    const modal = document.getElementById('assignTestModal');
    if (modal) {
        modal.style.display = 'block';
        loadAvailableTests(); // استدعاء دالة البحث الذكي
    } else {
        alert('خطأ: نافذة AssignTestModal غير موجودة في HTML');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// --- دالة البحث الذكي عن الاختبارات (Smart Search) ---
function loadAvailableTests() {
    const select = document.getElementById('assignTestSelect');
    if (!select) return;

    select.innerHTML = '<option value="">اختر الاختبار...</option>';
    let allFoundTests = [];

    // 1. جلب كل المفاتيح من الذاكرة
    const keys = Object.keys(localStorage);

    // 2. البحث داخل كل مفتاح
    keys.forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw || !raw.startsWith('[') || raw.length < 10) return;
            
            const data = JSON.parse(raw);
            if (Array.isArray(data) && data.length > 0) {
                const sample = data[0];
                // معايير التعرف على الاختبار
                if (sample.hasOwnProperty('questions') || sample.hasOwnProperty('items') || 
                   (sample.hasOwnProperty('title') && sample.hasOwnProperty('id')) ||
                    key.toLowerCase().includes('bank') || key.toLowerCase().includes('test')) {
                    
                    allFoundTests = [...allFoundTests, ...data];
                }
            }
        } catch(e) {}
    });

    // 3. إزالة التكرار
    const uniqueTests = Array.from(new Map(allFoundTests.map(item => [item.id, item])).values());

    if (uniqueTests.length === 0) {
        const option = document.createElement('option');
        option.text = "⚠️ لم يتم العثور على اختبارات";
        option.disabled = true;
        select.appendChild(option);
        return;
    }

    // 4. تعبئة القائمة
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

    if (!testId) { alert('الرجاء اختيار اختبار'); return; }

    const assignedTests = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    
    // منع التكرار (للاختبارات المعلقة)
    const exists = assignedTests.find(a => a.studentId == currentStudentId && a.testId == testId && a.status === 'pending');
    if(exists) { alert('هذا الاختبار مسند بالفعل.'); return; }

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

// =========================================================
// 5. الخوارزمية: تعبئة نموذج 9 (الخطة التربوية)
// =========================================================
function loadIEPTab(studentId) {
    console.log("تحديث الخطة للطالب:", studentId);

    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    
    // تجميع الاختبارات للوصول للأسئلة
    let allTests = [];
    Object.keys(localStorage).forEach(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            if(Array.isArray(data) && data.length > 0 && (data[0].questions || data[0].items)) {
                allTests = [...allTests, ...data];
            }
        } catch(e){}
    });

    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let strengthPoints = [];
    let needPoints = []; 
    let detailedPlan = []; 

    if (studentResult && studentResult.answers) {
        const originalTest = allTests.find(t => t.id == studentResult.testId);
        
        if (originalTest) {
            const qList = originalTest.questions || originalTest.items || [];
            studentResult.answers.forEach(answer => {
                const question = qList.find(q => q.id == answer.questionId);
                
                if (question && question.linkedGoalId) {
                    const objective = objectives.find(obj => obj.id == question.linkedGoalId);
                    if (objective) {
                        if (answer.isCorrect) {
                            if(!strengthPoints.includes(objective.shortTermGoal)) 
                                strengthPoints.push(objective.shortTermGoal);
                        } else {
                            if(!needPoints.includes(objective.shortTermGoal)) {
                                needPoints.push(objective.shortTermGoal);
                                const instructionals = (objective.instructionalGoals && objective.instructionalGoals.length > 0)
                                    ? objective.instructionalGoals : [objective.shortTermGoal];
                                detailedPlan.push({ short: objective.shortTermGoal, instructional: instructionals });
                            }
                        }
                    }
                }
            });
        }
    }

    // تعبئة الواجهة
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('iep-strengths', strengthPoints.join('\n- '));
    setVal('iep-needs', needPoints.join('\n- '));

    // تعبئة الجدول
    const goalsBody = document.getElementById('iep-goals-body');
    if (goalsBody) {
        goalsBody.innerHTML = '';
        if (detailedPlan.length > 0) {
            detailedPlan.forEach(grp => {
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
        } else {
            goalsBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">لا توجد نتائج تشخيصية.</td></tr>`;
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
                html += `<td><input type="text" class="form-control" disabled style="background-color:#f9f9f9;"></td>`;
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
