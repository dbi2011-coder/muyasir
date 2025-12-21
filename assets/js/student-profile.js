/**
 * ====================================================================
 * ملف: assets/js/student-profile.js
 * الوظيفة: إدارة شاملة (التنقل + النوافذ + التعبئة التلقائية القابلة للتعديل)
 * ====================================================================
 */

let currentStudentId = null;

// 1. عند تحميل الصفحة: تجهيز البيانات
document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    let targetId = params.get('id');
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // معالجة حالة عدم وجود طلاب أو رابط خطأ
    if (students.length === 0) {
        console.warn('لا توجد بيانات طلاب.');
    } else {
        let student = students.find(s => s.id == targetId);
        if (!student) {
            student = students[0]; // فتح أول طالب تلقائياً لتجنب الخطأ
            targetId = student.id;
        }
        currentStudentId = targetId;
        
        // تعبئة بيانات الهيدر
        const nameEl = document.getElementById('headerStudentName');
        const sideNameEl = document.getElementById('sideName');
        const gradeEl = document.getElementById('sideGrade');
        const avatarEl = document.getElementById('sideAvatar');
        
        if (nameEl) nameEl.textContent = student.name;
        if (sideNameEl) sideNameEl.textContent = student.name;
        if (gradeEl) gradeEl.textContent = student.grade || '-';
        if (avatarEl) avatarEl.textContent = student.name.charAt(0);
    }

    // فتح التبويب الأول
    switchSection('diagnostic');
});

// 2. دالة التنقل بين التبويبات (إصلاح الخطأ السابق)
window.switchSection = function(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    // إظهار القسم المطلوب
    const section = document.getElementById(`section-${sectionId}`);
    const link = document.getElementById(`link-${sectionId}`);
    
    if (section) {
        section.style.display = 'block';
        section.classList.add('active');
    }
    if (link) link.classList.add('active');

    // إذا تم فتح الخطة، نفذ التعبئة التلقائية
    if (sectionId === 'iep') {
        populateIEPForm();
    }
};

// 3. دالة التعبئة التلقائية (قلب الطلب: تحويل البيانات لمدخلات قابلة للتعديل)
function populateIEPForm() {
    console.log("بدء التعبئة التلقائية للخطة...");
    
    if (!currentStudentId) return;

    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    
    // البحث عن الاختبارات في كل مكان محتمل
    let allTests = [];
    Object.keys(localStorage).forEach(key => {
        try {
            const d = JSON.parse(localStorage.getItem(key));
            if(Array.isArray(d)) allTests = [...allTests, ...d];
        } catch(e){}
    });

    // جلب آخر اختبار تشخيصي
    const result = allResults
        .filter(r => r.studentId == currentStudentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    let strengths = [];
    let needs = [];
    let goalsData = [];

    // تحليل النتائج
    if (result && result.answers) {
        const testRef = allTests.find(t => t.id == result.testId);
        if (testRef) {
            const questions = testRef.questions || testRef.items || [];
            result.answers.forEach(ans => {
                const q = questions.find(x => x.id == ans.questionId);
                if (q && q.linkedGoalId) {
                    const obj = objectives.find(o => o.id == q.linkedGoalId);
                    if (obj) {
                        if (ans.isCorrect) {
                            if (!strengths.includes(obj.shortTermGoal)) strengths.push(obj.shortTermGoal);
                        } else {
                            if (!needs.includes(obj.shortTermGoal)) {
                                needs.push(obj.shortTermGoal);
                                const inst = (obj.instructionalGoals && obj.instructionalGoals.length > 0) 
                                    ? obj.instructionalGoals : [obj.shortTermGoal];
                                goalsData.push({ short: obj.shortTermGoal, instr: inst });
                            }
                        }
                    }
                }
            });
        }
    }

    // أ) تعبئة نقاط القوة والضعف (Textarea قابل للتعديل)
    const sInput = document.getElementById('iep-strengths');
    const nInput = document.getElementById('iep-needs');
    
    if (sInput) sInput.value = strengths.join('\n');
    if (nInput) nInput.value = needs.join('\n');

    // ب) تعبئة جدول الأهداف (Inputs قابلة للتعديل)
    const goalsBody = document.getElementById('iep-goals-body');
    if (goalsBody) {
        goalsBody.innerHTML = '';
        if (goalsData.length > 0) {
            goalsData.forEach(g => {
                g.instr.forEach(i => {
                    // هنا يتم وضع القيم داخل value لتكون قابلة للتعديل
                    const row = `
                        <tr>
                            <td><input type="text" class="form-control" value="${g.short}"></td>
                            <td><input type="text" class="form-control" value="${i}"></td>
                            <td><input type="date" class="form-control"></td>
                            <td><input type="text" class="form-control"></td>
                            <td><input type="text" class="form-control"></td>
                        </tr>`;
                    goalsBody.insertAdjacentHTML('beforeend', row);
                });
            });
        } else {
            goalsBody.innerHTML = `<tr><td colspan="5" class="text-center">لا توجد أهداف (أدخل يدوياً أو قم بإجراء اختبار)</td></tr>`;
        }
    }

    // ج) تعبئة الجدول الدراسي
    fillSchedule();
}

// 4. دالة الجدول الدراسي
function fillSchedule() {
    const tbody = document.getElementById('iep-schedule-body');
    if (!tbody) return;

    const schedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    let html = '';

    days.forEach(day => {
        html += `<tr><td class="font-weight-bold">${day}</td>`;
        for (let p = 1; p <= 7; p++) {
            const session = schedule.find(s => s.day === day && s.period == p && s.students && s.students.includes(parseInt(currentStudentId)));
            
            // إذا وجدت حصة، ضعها في Input، وإلا Input فارغ
            if (session) {
                html += `<td><input type="text" class="form-control" value="${session.subject || 'صعوبات'}" style="background:#e8f5e9; text-align:center;"></td>`;
            } else {
                html += `<td><input type="text" class="form-control" disabled style="background:#f9f9f9;"></td>`;
            }
        }
        html += '</tr>';
    });
    tbody.innerHTML = html;
}

// 5. دوال النوافذ (Modals) وإسناد الاختبار
window.showAssignTestModal = function() {
    const modal = document.getElementById('assignTestModal');
    if(modal) {
        modal.style.display = 'block';
        loadTestsToSelect();
    }
};

window.closeModal = function(id) {
    const m = document.getElementById(id);
    if(m) m.style.display = 'none';
};

function loadTestsToSelect() {
    const sel = document.getElementById('assignTestSelect');
    if(!sel) return;
    sel.innerHTML = '<option value="">اختر الاختبار...</option>';
    
    // بحث شامل
    let found = [];
    Object.keys(localStorage).forEach(k => {
        try {
            const d = JSON.parse(localStorage.getItem(k));
            if(Array.isArray(d) && d.length>0 && (d[0].title || d[0].questions)) found = [...found, ...d];
        } catch(e){}
    });
    
    // إزالة تكرار
    const unique = Array.from(new Map(found.map(i => [i.id, i])).values());
    
    unique.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.title || t.name || `اختبار ${t.id}`;
        sel.appendChild(opt);
    });
}

window.saveAssignedTest = function() {
    const sel = document.getElementById('assignTestSelect');
    if(!sel || !sel.value) return alert('اختر اختباراً');
    
    const list = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    list.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: sel.value,
        status: 'pending',
        assignedDate: new Date().toISOString()
    });
    localStorage.setItem('assignedTests', JSON.stringify(list));
    alert('تم الإسناد');
    closeModal('assignTestModal');
};

// إغلاق عند النقر بالخارج
window.onclick = function(e) {
    if(e.target.classList.contains('modal')) e.target.style.display = 'none';
};
