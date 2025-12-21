// ============================================================
// دالة التعبئة التلقائية للخطة التربوية (نموذج 9)
// ============================================================
function autoFillIEP() {
    // 1. تحديد الطالب الحالي (يفترض أن المعرف studentId موجود في الصفحة أو الرابط)
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = parseInt(urlParams.get('id')); // أو المتغير الذي يحمل رقم الطالب في نظامك
    
    if (!studentId) {
        alert('لم يتم تحديد الطالب!');
        return;
    }

    // جلب البيانات من localStorage
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '{}');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // --- أولاً: تعبئة البيانات الأساسية ---
    document.getElementById('iepName').value = student.name || '';
    document.getElementById('iepGrade').value = student.grade || '';
    document.getElementById('iepSubject').value = student.subject || 'لغتي/رياضيات';
    document.getElementById('iepDob').value = student.dob || '';
    if(currentUser.user) document.getElementById('iepTeacher').value = currentUser.user.name || '';

    // --- ثانياً: تحليل الاختبار التشخيصي (الجوهر) ---
    // البحث عن آخر اختبار تشخيصي مكتمل
    const diagnosticTest = studentTests
        .filter(t => t.studentId === studentId && t.status === 'completed') // يمكن إضافة && t.type === 'diagnostic' للتأكيد
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0];

    let strengthPoints = []; // نقاط القوة (إجابات صحيحة)
    let needsPoints = [];    // نقاط الاحتياج (إجابات خاطئة)
    let failedObjectives = []; // لتعبئة جدول الأهداف

    if (diagnosticTest) {
        const originalTest = allTests.find(t => t.id === diagnosticTest.testId);
        
        if (originalTest && originalTest.questions) {
            originalTest.questions.forEach((question, index) => {
                // البحث عن إجابة الطالب (بافتراض أن details تخزن النتائج بالتفصيل)
                // إذا لم يكن هناك details، يجب تكييف هذا السطر حسب هيكل البيانات لديك
                const studentScore = diagnosticTest.details ? diagnosticTest.details[index]?.score : 0; 
                const passingScore = question.passingScore || 1; // درجة الاجتياز الافتراضية للسؤال

                // جلب الهدف المرتبط بالسؤال
                const goalId = parseInt(question.linkedGoalId);
                const goalObj = objectives.find(o => o.id === goalId);
                const goalText = goalObj ? goalObj.shortTermGoal : `هدف السؤال ${index + 1}`;
                
                if (studentScore < passingScore) {
                    // إخفاق الطالب = نقطة احتياج
                    if (!needsPoints.includes(goalText)) {
                        needsPoints.push(goalText);
                        if (goalObj) failedObjectives.push(goalObj);
                    }
                } else {
                    // نجاح الطالب = نقطة قوة
                    if (!strengthPoints.includes(goalText)) {
                        strengthPoints.push(goalText);
                    }
                }
            });
        }
    } else {
        needsPoints.push('لا يوجد اختبار تشخيصي مكتمل لهذا الطالب.');
    }

    // تعبئة حقول القوة والاحتياج
    document.getElementById('iepStrengths').value = strengthPoints.join('\n- ');
    document.getElementById('iepNeeds').value = needsPoints.join('\n- ');

    // --- ثالثاً: تعبئة جدول الأهداف (من نقاط الاحتياج فقط) ---
    const goalsBody = document.querySelector('#iepGoalsTable tbody');
    goalsBody.innerHTML = ''; // مسح الجدول القديم

    failedObjectives.forEach(obj => {
        const row = document.createElement('tr');
        // هنا نضع الهدف قصير المدى والهدف التدريسي تلقائياً
        row.innerHTML = `
            <td><textarea class="editable-input" style="width:100%; border:none;">${obj.shortTermGoal || ''}</textarea></td>
            <td><textarea class="editable-input" style="width:100%; border:none;">${obj.instructionalGoals ? obj.instructionalGoals.join('\n- ') : ''}</textarea></td>
            <td><input type="text" value="80%" style="width:50px; text-align:center; border:none;"></td>
            <td><input type="date" style="border:none;"></td>
        `;
        goalsBody.appendChild(row);
    });

    if (failedObjectives.length === 0) {
        goalsBody.innerHTML = '<tr><td colspan="4">لا توجد أهداف (احتياجات) مستخلصة حالياً.</td></tr>';
    }

    // --- رابعاً: تعبئة الجدول الدراسي (من جدول المعلم) ---
    const scheduleBody = document.getElementById('iepScheduleBody');
    scheduleBody.innerHTML = ''; // مسح القديم
    
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const periods = [1, 2, 3, 4, 5, 6, 7];

    days.forEach(day => {
        let rowHtml = `<tr><td style="font-weight:bold;">${day}</td>`;
        
        periods.forEach(p => {
            // التحقق: هل الطالب موجود في هذه الحصة عند المعلم؟
            let cellContent = '';
            if (teacherSchedule[day] && teacherSchedule[day][p]) {
                const session = teacherSchedule[day][p];
                // إذا كان الطالب ضمن قائمة طلاب هذه الحصة
                if (session.students && session.students.includes(studentId)) {
                    cellContent = session.subject || '✓'; // نضع اسم المادة أو علامة
                }
            }

            // الحقل قابل للتعديل (input)
            rowHtml += `<td><input type="text" value="${cellContent}" style="width:100%; text-align:center; border:none;"></td>`;
        });
        
        rowHtml += '</tr>';
        scheduleBody.innerHTML += rowHtml;
    });

    alert('تمت التعبئة التلقائية بناءً على نتائج التشخيصي وجدول الحصص.');
}
