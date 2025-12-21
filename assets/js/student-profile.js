// =========================================================
// 📁 الملف: assets/js/student-profile.js
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 تم تحميل ملف student-profile.js بنجاح"); // رسالة تأكيد

    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('id');
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    if (students.length === 0) {
        alert('تنبيه: لا يوجد طلاب في النظام.');
        window.location.href = 'students.html';
        return;
    }

    let foundStudent = students.find(s => s.id == targetId);

    // إذا لم نجد الطالب، نفتح أول طالب تلقائياً
    if (!foundStudent) {
        console.warn('لم يتم العثور على الطالب، جاري فتح أول طالب متاح.');
        foundStudent = students[0];
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', foundStudent.id);
        window.history.replaceState({}, '', newUrl);
    }

    currentStudent = foundStudent;
    currentStudentId = currentStudent.id;

    loadStudentData();
    switchSection('diagnostic'); // تفعيل التبويب الأول
});

// =========================================================
// 1. دالة التنقل بين التبويبات (switchSection)
// =========================================================
window.switchSection = function(sectionId) {
    // إخفاء الكل
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // إزالة التفعيل من القوائم
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(el => {
        el.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById('section-' + sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    }

    // تفعيل الرابط
    const targetLink = document.getElementById('link-' + sectionId);
    if (targetLink) targetLink.classList.add('active');

    // إذا كان الخطة، حمل البيانات
    if (sectionId === 'iep') {
        loadIEPTab(currentStudentId);
    }
};

// =========================================================
// 2. تحميل بيانات الطالب
// =========================================================
function loadStudentData() {
    if (!currentStudent) return;
    
    const setText = (id, txt) => { 
        const el = document.getElementById(id); 
        if(el) el.textContent = txt; 
    };
    
    setText('sideName', currentStudent.name);
    setText('headerStudentName', currentStudent.name);
    setText('sideGrade', currentStudent.grade || 'غير محدد');
    
    const avatar = document.getElementById('sideAvatar');
    if(avatar) avatar.textContent = currentStudent.name.charAt(0);
}

// =========================================================
// 3. النوافذ المنبثقة (Modals)
// =========================================================
window.showAssignTestModal = function() {
    const modal = document.getElementById('assignTestModal');
    if (modal) {
        modal.style.display = 'block';
        loadAvailableTests();
    } else {
        alert('خطأ: كود النافذة المنبثقة غير موجود في HTML');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};

// إغلاق النافذة عند النقر خارجها
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};

// =========================================================
// 4. تحميل الاختبارات (بحث شامل)
// =========================================================
function loadAvailableTests() {
    const select = document.getElementById('assignTestSelect');
    if (!select) return;

    select.innerHTML = '<option value="">اختر الاختبار...</option>';
    let allFoundTests = [];

    // بحث في كل المفاتيح
    Object.keys(localStorage).forEach(key => {
        try {
            const raw = localStorage.getItem(key);
            if (raw && raw.startsWith('[')) {
                const data = JSON.parse(raw);
                if (Array.isArray(data) && data.length > 0) {
                    const sample = data[0];
                    if (sample.title || sample.questions || key.includes('bank') || key.includes('test')) {
                        allFoundTests = [...allFoundTests, ...data];
                    }
                }
            }
        } catch(e) {}
    });

    // إزالة التكرار
    const uniqueTests = Array.from(new Map(allFoundTests.map(item => [item.id, item])).values());

    if (uniqueTests.length === 0) {
        const opt = document.createElement('option');
        opt.text = "لا توجد اختبارات متاحة";
        select.appendChild(opt);
        return;
    }

    uniqueTests.forEach(test => {
        const option = document.createElement('option');
        option.value = test.id;
        option.textContent = test.title || test.name || `اختبار #${test.id}`;
        select.appendChild(option);
    });
}

window.saveAssignedTest = function() {
    const select = document.getElementById('assignTestSelect');
    const testId = select ? select.value : null;

    if (!testId) { alert('الرجاء اختيار اختبار'); return; }

    const assignedTests = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    
    // حفظ التعيين
    assignedTests.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: testId,
        status: 'pending',
        assignedDate: new Date().toISOString()
    });

    localStorage.setItem('assignedTests', JSON.stringify(assignedTests));
    alert('تم إسناد الاختبار بنجاح');
    closeModal('assignTestModal');
};

// =========================================================
// 5. الخطة التربوية (نموذج 9)
// =========================================================
function loadIEPTab(studentId) {
    console.log("تحليل بيانات الخطة...");
    
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    
    // جلب كل الاختبارات للبحث عن الأسئلة
    let allTests = [];
    Object.keys(localStorage).forEach(key => {
        try {
            const d = JSON.parse(localStorage.getItem(key));
            if(Array.isArray(d)) allTests = [...allTests, ...d];
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
                            if (!strengthPoints.includes(objective.shortTermGoal)) 
                                strengthPoints.push(objective.shortTermGoal);
                        } else {
                            if (!needPoints.includes(objective.shortTermGoal)) {
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

    // تعبئة البيانات
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('iep-strengths', strengthPoints.join('\n- '));
    setVal('iep-needs', needPoints.join('\n- '));

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
            goalsBody.innerHTML = `<tr><td colspan="5" class="text-center">لا توجد نتائج تشخيصية.</td></tr>`;
        }
    }
    
    fillScheduleTable(studentId);
}

function fillScheduleTable(studentId) {
    const scheduleBody = document.getElementById('iep-schedule-body');
    if (!scheduleBody) return;

    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    let html = '';
    days.forEach(day => {
        html += `<tr><td class="font-weight-bold">${day}</td>`;
        for (let p = 1; p <= 7; p++) {
            const session = teacherSchedule.find(s => s.day === day && s.period == p && s.students && s.students.includes(parseInt(studentId)));
            if (session) {
                html += `<td><input type="text" class="form-control" value="${session.subject || 'صعوبات'}" style="background:#e8f5e9;text-align:center;"></td>`;
            } else {
                html += `<td><input type="text" class="form-control" disabled style="background:#f9f9f9;"></td>`;
            }
        }
        html += '</tr>';
    });
    scheduleBody.innerHTML = html;
}
