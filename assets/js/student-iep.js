// إدارة الخطة التربوية الفردية للطالب - نسخة مطابقة تماماً لمنطق المعلم
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    const currentStudent = getCurrentUser(); // دالة من auth.js
    
    // 1. جلب البيانات من LocalStorage (نفس المصادر التي يستخدمها المعلم)
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');

    // 2. البحث عن أحدث اختبار تشخيصي مكتمل لهذا الطالب
    // المعلم يعتمد الخطة بناءً على نتائج التشخيصي
    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudent.id && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    // في حال لم يقم الطالب بالاختبار بعد أو لم يكتمل
    if (!completedDiagnostic) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <h3>الخطة غير جاهزة بعد</h3>
                <p>يجب إكمال الاختبار التشخيصي وتصحيحه من قبل المعلم لتظهر خطتك هنا.</p>
                <a href="my-tests.html" class="btn btn-primary" style="margin-top:15px;">الذهاب للاختبارات</a>
            </div>
        `;
        return;
    }

    // جلب بيانات الاختبار الأصلي لمعرفة تفاصيل المادة والأسئلة
    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);

    // 3. تحليل نقاط القوة والاحتياج (نفس خوارزمية المعلم)
    let strengthsItems = [];
    let needsItems = [];
    let needsObjects = []; // تخزين كائنات الأهداف لبناء الجدول السفلي

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(question => {
            // البحث عن إجابة الطالب لهذا السؤال
            const studentAnswerObj = completedDiagnostic.answers.find(a => a.questionId === question.id);
            
            // إذا كان السؤال مرتبطاً بهدف
            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id === question.linkedGoalId);
                if (objective) {
                    const studentScore = studentAnswerObj ? (studentAnswerObj.score || 0) : 0;
                    const passingScore = question.passingScore || 1;

                    if (studentScore >= passingScore) {
                        // نقطة قوة (أتقن المهارة)
                        if (!strengthsItems.includes(objective.shortTermGoal)) {
                            strengthsItems.push(objective.shortTermGoal);
                        }
                    } else {
                        // نقطة احتياج (لم يتقن المهارة)
                        if (!needsObjects.find(o => o.id === objective.id)) {
                            needsObjects.push(objective);
                            needsItems.push(objective.shortTermGoal);
                        }
                    }
                }
            }
        });
    }

    // تحويل القوائم إلى HTML
    const strengthsHTML = strengthsItems.length > 0 
        ? strengthsItems.map(s => `<li>${s}</li>`).join('') 
        : '<li>لا توجد نقاط قوة مسجلة</li>';
    
    const needsHTML = needsItems.length > 0 
        ? needsItems.map(n => `<li>${n}</li>`).join('') 
        : '<li>لا توجد نقاط احتياج مسجلة</li>';

    // 4. بناء جدول الجدول الدراسي (من جدول المعلم)
    const daysMap = { 'sunday': 'الأحد', 'monday': 'الاثنين', 'tuesday': 'الثلاثاء', 'wednesday': 'الأربعاء', 'thursday': 'الخميس' };
    let scheduleCells = '';
    
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].forEach(dayKey => {
        const session = teacherSchedule.find(s => s.day === dayKey && s.students && s.students.includes(currentStudent.id));
        if (session) {
            scheduleCells += `<td style="background:#e8f5e9; text-align:center; font-weight:bold; color:#2e7d32;">حصة ${session.period || 1}</td>`;
        } else {
            scheduleCells += `<td></td>`;
        }
    });

    // 5. بناء جدول الأهداف التدريسية (الخطة العلاجية)
    let objectivesRows = '';
    
    if (needsObjects.length === 0) {
        objectivesRows = '<tr><td colspan="3" style="text-align:center; padding: 20px;">جميع الأهداف محققة، لا توجد خطة علاجية مطلوبة حالياً.</td></tr>';
    } else {
        let counter = 1;
        // خريطة لتحديد ما تم إنجازه من الدروس
        const completedLessonsMap = {};
        studentLessons.forEach(l => {
            if (l.studentId === currentStudent.id && l.status === 'completed') {
                completedLessonsMap[l.objective] = l.completedDate || 'تم';
            }
        });

        needsObjects.forEach(obj => {
            // الصف الرئيسي للهدف قصير المدى
            objectivesRows += `
                <tr style="background-color: #f8f9fa;">
                    <td style="font-weight:bold; text-align:center; background-color: #eee;">*</td>
                    <td colspan="2" style="background-color: #f9f9f9;"><strong>هدف قصير المدى:</strong> ${obj.shortTermGoal}</td>
                </tr>
            `;

            // الصفوف الفرعية للأهداف التدريسية
            if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                obj.instructionalGoals.forEach(iGoal => {
                    const achievedDate = completedLessonsMap[iGoal];
                    // علامة الصح أو الانتظار
                    const statusContent = achievedDate 
                        ? `<span style="color:#28a745; font-weight:bold; font-size:1.1em;">✔ تم (${achievedDate})</span>` 
                        : `<span style="color:#999; font-size:0.9em;">⏳ جاري العمل</span>`;

                    objectivesRows += `
                        <tr>
                            <td style="text-align:center;">${counter++}</td>
                            <td>${iGoal}</td>
                            <td style="text-align:center;">${statusContent}</td>
                        </tr>
                    `;
                });
            } else {
                objectivesRows += `<tr><td>-</td><td class="text-muted">لا توجد أهداف تدريسية مسجلة</td><td></td></tr>`;
            }
        });
    }

    // 6. حقن الـ HTML النهائي داخل الصفحة
    iepContainer.innerHTML = `
        <div class="iep-word-model">
            <h2 style="text-align: center; margin-bottom: 25px; color: #000; font-size: 24px;">الخطة التربوية الفردية</h2>
            
            <table class="word-table">
                <tr>
                    <th width="15%">اسم الطالب</th>
                    <td width="35%">${currentStudent.name}</td>
                    <th width="15%">المادة</th>
                    <td width="35%">${originalTest ? originalTest.subject : 'عام'}</td>
                </tr>
                <tr>
                    <th>الصف</th>
                    <td>${currentStudent.grade || 'غير محدد'}</td>
                    <th>تاريخ الخطة</th>
                    <td>${new Date(completedDiagnostic.assignedDate).toLocaleDateString('ar-SA')}</td>
                </tr>
            </table>

            <h4 style="margin-bottom:10px; font-size:16px;">الجدول الدراسي:</h4>
            <table class="word-table">
                <thead>
                    <tr>
                        <th width="10%">اليوم</th>
                        <th width="18%">الأحد</th>
                        <th width="18%">الاثنين</th>
                        <th width="18%">الثلاثاء</th>
                        <th width="18%">الأربعاء</th>
                        <th width="18%">الخميس</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight:bold; background-color:#f9f9f9;">الحصة</td>
                        ${scheduleCells}
                    </tr>
                </tbody>
            </table>

            <h4 style="margin-bottom:10px; font-size:16px;">مستوى الأداء الحالي:</h4>
            <table class="word-table">
                <thead>
                    <tr>
                        <th width="50%">نقاط القوة</th>
                        <th width="50%">نقاط الاحتياج</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="vertical-align: top;">
                        <td style="padding: 15px; background-color: #fff;">
                            <ul>${strengthsHTML}</ul>
                        </td>
                        <td style="padding: 15px; background-color: #fff;">
                            <ul>${needsHTML}</ul>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 30px;">
                <h4 style="margin-bottom: 10px; font-size:16px;">الأهداف التدريسية للخطة:</h4>
                <table class="word-table">
                    <thead>
                        <tr>
                            <th width="5%">م</th>
                            <th width="75%">الهدف التدريسي</th>
                            <th width="20%">حالة التحقق</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${objectivesRows}
                    </tbody>
                </table>
            </div>
            
            <div class="footer-note" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
                <p>تم اعتماد هذه الخطة بناءً على نتائج التشخيص والملاحظة | منصة ميسر التعلم</p>
            </div>
        </div>
    `;
}
