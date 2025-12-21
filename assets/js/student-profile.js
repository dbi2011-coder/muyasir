// ============================================
// 📁 الملف: assets/js/student-profile.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // الحصول على معرف الطالب من الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = parseInt(urlParams.get('id'));

    if (studentId) {
        loadStudentProfile(studentId);
    } else {
        alert('لم يتم تحديد طالب!');
        window.location.href = 'students.html';
    }
});

let currentStudent = null;
let currentIEP = null;

// تحميل بيانات الطالب
function loadStudentProfile(studentId) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    currentStudent = students.find(s => s.id === studentId);

    if (!currentStudent) return;

    // تعبئة الرأس
    document.getElementById('studentNameHeader').textContent = currentStudent.name;
    
    // تعبئة البيانات الأساسية في تبويب المعلومات
    document.getElementById('studentInfoDisplay').innerHTML = `
        <table class="table">
            <tr><th>الاسم</th><td>${currentStudent.name}</td></tr>
            <tr><th>الصف</th><td>${currentStudent.grade}</td></tr>
            <tr><th>رقم الهوية</th><td>${currentStudent.nationalId || '-'}</td></tr>
            <tr><th>تاريخ الميلاد</th><td>${currentStudent.dob || '-'}</td></tr>
        </table>
    `;

    // تحميل الخطة المحفوظة إذا وجدت
    loadSavedIEP();
}

// التبديل بين التبويبات
function switchProfileTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.target.classList.add('active');

    if (tabName === 'iep' && !currentIEP) {
        // إذا فتح الخطة لأول مرة ولم تكن محفوظة، قم بالتعبئة التلقائية
        autoFillIEP();
    }
}

// ============================================================
// 🧠 المحرك الذكي للخطة التربوية (Auto-Fill Engine)
// ============================================================
function autoFillIEP() {
    if (!confirm('هل أنت متأكد؟ سيتم استبدال البيانات الحالية بنتائج آخر اختبار تشخيصي والجدول الدراسي.')) return;

    // 1. تعبئة البيانات الأساسية
    document.getElementById('iepName').value = currentStudent.name;
    document.getElementById('iepGrade').value = currentStudent.grade;
    document.getElementById('iepSubject').value = currentStudent.subject;
    document.getElementById('iepTeacherName').value = getCurrentUser().name;

    // 2. تحليل نتائج الاختبار التشخيصي
    const analysis = analyzeDiagnosticTest(currentStudent.id);
    
    // تعبئة نقاط القوة (إجابات صحيحة)
    document.getElementById('iepStrengths').value = analysis.strengths.join('\n- ');

    // تعبئة نقاط الاحتياج (إجابات خاطئة)
    document.getElementById('iepNeeds').value = analysis.needs.join('\n- ');

    // 3. بناء جدول الأهداف بناءً على الاحتياجات
    const goalsBody = document.querySelector('#iepGoalsTable tbody');
    goalsBody.innerHTML = '';
    
    analysis.failedObjectives.forEach(obj => {
        addGoalRow(obj.shortTermGoal, obj.instructionalGoals.join('\n- '));
    });

    // 4. تعبئة الجدول الدراسي تلقائياً
    fillScheduleFromTeacher();

    alert('تمت التعبئة التلقائية بناءً على الاختبار التشخيصي والجدول الدراسي.');
}

// دالة تحليل الاختبار التشخيصي
function analyzeDiagnosticTest(studentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');

    // البحث عن آخر اختبار تشخيصي مكتمل للطالب
    const lastDiagnostic = studentTests
        .filter(st => st.studentId === studentId && st.status === 'completed') // يمكن إضافة && st.type === 'diagnostic' إذا كنت تخزن النوع
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

    const result = {
        strengths: [],
        needs: [],
        failedObjectives: []
    };

    if (!lastDiagnostic) {
        result.needs.push('لم يتم إجراء اختبار تشخيصي بعد.');
        return result;
    }

    // جلب بيانات الاختبار الأصلي
    const originalTest = tests.find(t => t.id === lastDiagnostic.testId);
    if (!originalTest) return result;

    // تحليل الأسئلة
    // ملاحظة: نفترض هنا أن studentTests يخزن تفاصيل الإجابات في `answersDetails` أو نقارن الدرجة
    // إذا لم يكن الهيكل موجوداً، سنعتمد على المحاكاة المنطقية المذكورة في الطلب
    
    if (lastDiagnostic.details) {
        originalTest.questions.forEach((q, index) => {
            const studentScore = lastDiagnostic.details[index]?.score || 0;
            const passingScore = q.passingScore || 1; // الافتراضي 1
            
            // جلب الهدف المرتبط
            const objective = objectives.find(o => o.id === parseInt(q.linkedGoalId));
            const objectiveText = objective ? objective.shortTermGoal : `الهدف المرتبط بالسؤال ${index + 1}`;
            
            if (studentScore < passingScore) {
                // إخفاق -> احتياج
                if (!result.needs.includes(objectiveText)) {
                    result.needs.push(objectiveText);
                    if (objective) result.failedObjectives.push(objective);
                }
            } else {
                // نجاح -> قوة
                if (!result.strengths.includes(objectiveText)) {
                    result.strengths.push(objectiveText);
                }
            }
        });
    }

    return result;
}

// دالة تعبئة الجدول الدراسي
function fillScheduleFromTeacher() {
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '{}');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const periods = [1, 2, 3, 4, 5, 6, 7];
    const tbody = document.getElementById('iepScheduleBody');
    tbody.innerHTML = '';

    days.forEach(day => {
        let rowHtml = `<tr><td style="font-weight:bold; background:#f9f9f9;">${day}</td>`;
        
        periods.forEach(period => {
            // التحقق مما إذا كان الطالب موجوداً في هذه الحصة
            const session = teacherSchedule[day]?.[period];
            const isStudentInSession = session && session.students && session.students.includes(currentStudent.id);
            
            const cellContent = isStudentInSession ? 
                (session.subject || 'مادة') : ''; // وضع اسم المادة أو علامة
            
            const activeClass = isStudentInSession ? 'active' : '';
            
            rowHtml += `<td class="schedule-cell ${activeClass}">
                <input type="text" class="editable-field text-center" value="${cellContent}">
            </td>`;
        });
        
        rowHtml += '</tr>';
        tbody.innerHTML += rowHtml;
    });
}

// إضافة صف هدف جديد
function addGoalRow(shortTerm = '', instructional = '') {
    const tbody = document.querySelector('#iepGoalsTable tbody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><textarea class="editable-field">${shortTerm}</textarea></td>
        <td><textarea class="editable-field">${instructional}</textarea></td>
        <td><input type="text" class="editable-field text-center" value="80%"></td>
        <td><input type="date" class="editable-field"></td>
    `;
    tbody.appendChild(row);
}

// حفظ الخطة
function saveIEP() {
    const iepData = {
        studentId: currentStudent.id,
        teacherId: getCurrentUser().id,
        updatedAt: new Date().toISOString(),
        grade: document.getElementById('iepGrade').value,
        dob: document.getElementById('iepDob').value,
        strengths: document.getElementById('iepStrengths').value,
        needs: document.getElementById('iepNeeds').value,
        goals: []
        // يمكن إضافة تخزين الجدول أيضاً إذا لزم الأمر
    };

    // جمع الأهداف من الجدول
    document.querySelectorAll('#iepGoalsTable tbody tr').forEach(row => {
        const inputs = row.querySelectorAll('.editable-field');
        if (inputs[0].value.trim()) {
            iepData.goals.push({
                shortTerm: inputs[0].value,
                instructional: inputs[1].value,
                criteria: inputs[2].value,
                date: inputs[3].value
            });
        }
    });

    // الحفظ في localStorage
    let allIEPs = JSON.parse(localStorage.getItem('studentIEPs') || '[]');
    // حذف القديم إن وجد
    allIEPs = allIEPs.filter(iep => iep.studentId !== currentStudent.id);
    allIEPs.push(iepData);
    localStorage.setItem('studentIEPs', JSON.stringify(allIEPs));
    
    currentIEP = iepData;
    alert('تم حفظ الخطة التربوية بنجاح ✅');
}

function loadSavedIEP() {
    const allIEPs = JSON.parse(localStorage.getItem('studentIEPs') || '[]');
    const iep = allIEPs.find(i => i.studentId === currentStudent.id);
    
    if (iep) {
        currentIEP = iep;
        document.getElementById('iepGrade').value = iep.grade || '';
        document.getElementById('iepDob').value = iep.dob || '';
        document.getElementById('iepStrengths').value = iep.strengths || '';
        document.getElementById('iepNeeds').value = iep.needs || '';
        
        // تعبئة الأهداف المحفوظة
        const goalsBody = document.querySelector('#iepGoalsTable tbody');
        goalsBody.innerHTML = '';
        if (iep.goals && iep.goals.length > 0) {
            iep.goals.forEach(g => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><textarea class="editable-field">${g.shortTerm}</textarea></td>
                    <td><textarea class="editable-field">${g.instructional}</textarea></td>
                    <td><input type="text" class="editable-field text-center" value="${g.criteria}"></td>
                    <td><input type="date" class="editable-field" value="${g.date}"></td>
                `;
                goalsBody.appendChild(row);
            });
        } else {
            addGoalRow(); // إضافة صف فارغ
        }
        
        // تعبئة الجدول (دائماً نجلبه من جدول المعلم لضمان التحديث، أو يمكن حفظه أيضاً)
        fillScheduleFromTeacher();
    }
}

// دوال مساعدة
function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser')).user;
}
