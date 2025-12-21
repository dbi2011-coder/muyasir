// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: تعبئة نموذج 9 تلقائياً مع السماح بالتعديل اليدوي
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    // جلب معرف الطالب من الرابط
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get('id');

    if (studentId) {
        // تشغيل دالة التعبئة التلقائية عند تحميل الصفحة
        populateIEPFormAutomatically(studentId);
    }
});

function populateIEPFormAutomatically(studentId) {
    // 1. جلب البيانات من النظام (localStorage)
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    
    // للبحث عن نص السؤال والهدف المرتبط به
    // نجمع كل الاختبارات المحتملة للبحث فيها
    const allTests = [
        ...(JSON.parse(localStorage.getItem('questionBanks') || '[]')),
        ...(JSON.parse(localStorage.getItem('tests') || '[]'))
    ];

    // 2. البحث عن آخر اختبار تشخيصي للطالب
    const diagnosticResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    // مصفوفات لتخزين النصوص
    let strengthsText = []; // لنقاط القوة
    let needsText = [];     // لنقاط الاحتياج
    let goalsData = [];     // لجدول الأهداف

    // 3. منطق التحويل: من إجابات إلى نصوص
    if (diagnosticResult && diagnosticResult.answers) {
        // العثور على الاختبار الأصلي لمعرفة تفاصيل الأسئلة
        const testRef = allTests.find(t => t.id == diagnosticResult.testId);
        
        if (testRef) {
            const questions = testRef.questions || testRef.items || [];
            
            diagnosticResult.answers.forEach(ans => {
                const question = questions.find(q => q.id == ans.questionId);
                
                // إذا وجدنا السؤال وكان مرتبطاً بهدف
                if (question && question.linkedGoalId) {
                    const goal = objectives.find(obj => obj.id == question.linkedGoalId);
                    
                    if (goal) {
                        if (ans.isCorrect) {
                            // إجابة صحيحة -> نقاط قوة
                            strengthsText.push(goal.shortTermGoal);
                        } else {
                            // إجابة خاطئة -> نقاط احتياج + أهداف الخطة
                            needsText.push(goal.shortTermGoal);
                            
                            // تجهيز البيانات لجدول الأهداف التفصيلي
                            // جلب الأهداف التدريسية (إن وجدت) أو استخدام القصير نفسه
                            const instructionals = (goal.instructionalGoals && goal.instructionalGoals.length > 0) 
                                ? goal.instructionalGoals 
                                : [goal.shortTermGoal];
                                
                            goalsData.push({
                                short: goal.shortTermGoal,
                                instructional: instructionals
                            });
                        }
                    }
                }
            });
        }
    }

    // 4. الحقن داخل الحقول (التعبئة التلقائية) مع الحفاظ على قابلية التعديل

    // أ) تعبئة نقاط القوة (Textarea)
    const strengthInput = document.getElementById('iep-strengths');
    if (strengthInput) {
        // نضع القيم داخل .value لكي تكون قابلة للتعديل
        strengthInput.value = strengthsText.length > 0 ? strengthsText.join('\n') : '';
    }

    // ب) تعبئة نقاط الاحتياج (Textarea)
    const needsInput = document.getElementById('iep-needs');
    if (needsInput) {
        needsInput.value = needsText.length > 0 ? needsText.join('\n') : '';
    }

    // ج) تعبئة جدول الأهداف (Inputs inside Table)
    const goalsBody = document.getElementById('iep-goals-body');
    if (goalsBody) {
        goalsBody.innerHTML = ''; // تفريغ الجدول القديم

        if (goalsData.length > 0) {
            goalsData.forEach(item => {
                item.instructional.forEach(instr => {
                    // إنشاء صف جديد يحتوي على Inputs وليس نصوص ثابتة
                    const row = `
                        <tr>
                            <td>
                                <input type="text" class="form-control" value="${item.short}" style="width:100%">
                            </td>
                            <td>
                                <input type="text" class="form-control" value="${instr}" style="width:100%">
                            </td>
                            <td><input type="date" class="form-control"></td>
                            <td><input type="text" class="form-control"></td>
                            <td><input type="text" class="form-control"></td>
                        </tr>
                    `;
                    goalsBody.insertAdjacentHTML('beforeend', row);
                });
            });
        } else {
            // صف فارغ قابل للكتابة في حال عدم وجود بيانات
            goalsBody.innerHTML = `
                <tr>
                    <td><input type="text" class="form-control" placeholder="هدف قصير..."></td>
                    <td><input type="text" class="form-control" placeholder="هدف تدريسي..."></td>
                    <td><input type="date" class="form-control"></td>
                    <td><input type="text" class="form-control"></td>
                    <td><input type="text" class="form-control"></td>
                </tr>
            `;
        }
    }

    // د) تعبئة جدول الحصص تلقائياً (Inputs)
    fillScheduleAutomatically(studentId, teacherSchedule);
}

function fillScheduleAutomatically(studentId, scheduleData) {
    const scheduleBody = document.getElementById('iep-schedule-body');
    if (!scheduleBody) return;

    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    let html = '';

    days.forEach(day => {
        html += `<tr><td style="font-weight:bold">${day}</td>`;
        for (let p = 1; p <= 7; p++) {
            // البحث هل الطالب موجود في هذه الحصة
            const session = scheduleData.find(s => 
                s.day === day && 
                s.period == p && 
                s.students && s.students.includes(parseInt(studentId)) // مطابقة رقم الطالب
            );

            if (session) {
                // تعبئة تلقائية بالمادة مع إمكانية التعديل
                html += `<td><input type="text" class="form-control" value="${session.subject || 'صعوبات'}" style="background-color:#e8f5e9; text-align:center"></td>`;
            } else {
                // حصة فارغة قابلة للكتابة
                html += `<td><input type="text" class="form-control" disabled style="background-color:#f9f9f9"></td>`;
            }
        }
        html += '</tr>';
    });

    scheduleBody.innerHTML = html;
}
