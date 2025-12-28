// إدارة الخطة التربوية الفردية للطالب - نسخة مطابقة للمعلم تماماً
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    const currentStudent = getCurrentUser(); // دالة مفترضة في auth.js
    
    // 1. جلب البيانات اللازمة (نفس مصادر بيانات المعلم)
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const studentLessons = JSON.parse(localStorage.getItem('studentLessons') || '[]');

    // 2. البحث عن الاختبار التشخيصي المكتمل لهذا الطالب
    const completedDiagnostic = studentTests
        .filter(t => t.studentId === currentStudent.id && t.type === 'diagnostic' && t.status === 'completed')
        .sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate))[0];

    // حالة عدم وجود خطة (لم يكمل الاختبار)
    if (!completedDiagnostic) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <h3>الخطة غير جاهزة بعد</h3>
                <p>سيتم إنشاء خطتك التربوية تلقائياً بعد إكمال وتصحيح الاختبار التشخيصي.</p>
            </div>
        `;
        return;
    }

    // جلب بيانات الاختبار الأصلي لمعرفة المادة
    const originalTest = allTests.find(t => t.id === completedDiagnostic.testId);

    // 3. تحليل نقاط القوة والاحتياج (نفس منطق المعلم)
    let strengthsHTML = '';
    let needsHTML = '';
    let needsObjects = []; // لتخزين الأهداف المطلوبة

    if (originalTest && originalTest.questions) {
        originalTest.questions.forEach(question => {
            const studentAnswerObj = completedDiagnostic.answers.find(a => a.questionId === question.id);
            
            // الربط بالأهداف
            if (question.linkedGoalId) {
                const objective = allObjectives.find(o => o.id === question.linkedGoalId);
                if (objective) {
                    const studentScore = studentAnswerObj ? (studentAnswerObj.score || 0) : 0;
                    const passingScore = question.passingScore || 1;

                    if (studentScore >= passingScore) {
                        // نقطة قوة
                        if (!strengthsHTML.includes(objective.shortTermGoal)) {
                            strengthsHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    } else {
                        // نقطة احتياج
                        if (!needsObjects.find(o => o.id === objective.id)) {
                            needsObjects.push(objective);
                            needsHTML += `<li>${objective.shortTermGoal}</li>`;
                        }
                    }
                }
            }
        });
    }

    if (!strengthsHTML) strengthsHTML = '<li>لا توجد نقاط قوة مسجلة</li>';
    if (!needsHTML) needsHTML = '<li>لا توجد نقاط احتياج مسجلة</li>';

    // 4. بناء جدول الجدول الدراسي (Schedule)
    const daysMap = { 'sunday': 'الأحد', 'monday': 'الاثنين', 'tuesday': 'الثلاثاء', 'wednesday': 'الأربعاء', 'thursday': 'الخميس' };
    let scheduleCells = '';
    
    // ترتيب الأيام
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].forEach(dayKey => {
        // البحث في جدول المعلم عن حصص لهذا الطالب في هذا اليوم
        const session = teacherSchedule.find(s => s.day === dayKey && s.students && s.students.includes(currentStudent.id));
        if (session) {
            scheduleCells += `<td style="background:#e8f5e9; text-align:center;">حصة ${session.period || 1}</td>`;
        } else {
            scheduleCells += `<td></td>`;
        }
    });

    // 5. بناء جدول الأهداف (الاحتياجات)
    let objectivesRows = '';
    if (needsObjects.length === 0) {
        objectivesRows = '<tr><td colspan="3" style="text-align:center">جميع الأهداف محققة، لا توجد خطة علاجية حالياً.</td></tr>';
    } else {
        let counter = 1;
        // خريطة الدروس المكتملة لمعرفة تواريخ التحقق
        const completedLessonsMap = {};
        studentLessons.forEach(l => {
            if (l.studentId === currentStudent.id && l.status === 'completed') {
                completedLessonsMap[l.objective] = l.completedDate || 'تم';
            }
        });

        needsObjects.forEach(obj => {
            // صف العنوان للهدف القصير
            objectivesRows += `
                <tr style="background-color: #f8f9fa;">
                    <td style="font-weight:bold; text-align:center;">*</td>
                    <td colspan="2"><strong>هدف قصير المدى:</strong> ${obj.shortTermGoal}</td>
                </tr>
            `;

            // صفوف الأهداف التدريسية
            if (obj.instructionalGoals && obj.instructionalGoals.length > 0) {
                obj.instructionalGoals.forEach(iGoal => {
                    const achievedDate = completedLessonsMap[iGoal];
                    const statusContent = achievedDate 
                        ? `<span style="color:#28a745; font-weight:bold;">✔ تم (${achievedDate})</span>` 
                        : `<span style="color:#999;">جاري العمل</span>`;

                    objectivesRows += `
                        <tr>
                            <td style="text-align:center;">${counter++}</td>
                            <td>${iGoal}</td>
                            <td style="text-align:center;">${statusContent}</td>
                        </tr>
                    `;
                });
            }
        });
    }

    // 6. تجميع HTML النهائي (مطابق لهيكلية المعلم)
    iepContainer.innerHTML = `
        <div class="iep-word-model">
            <h3 style="text-align: center; margin-bottom: 20px; color: #000;">الخطة التربوية الفردية</h3>
            
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

            <table class="word-table" style="margin-top: 20px;">
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
                        <td style="font-weight:bold;">الحصة</td>
                        ${scheduleCells}
                    </tr>
                </tbody>
            </table>

            <table class="word-table" style="margin-top: 20px;">
                <thead>
                    <tr>
                        <th width="50%">نقاط القوة</th>
                        <th width="50%">نقاط الاحتياج</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="vertical-align: top;">
                        <td style="padding: 15px;">
                            <ul>${strengthsHTML}</ul>
                        </td>
                        <td style="padding: 15px;">
                            <ul>${needsHTML}</ul>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 25px;">
                <h4 style="margin-bottom: 10px;">الأهداف التدريسية للخطة:</h4>
                <table class="word-table">
                    <thead>
                        <tr>
                            <th width="5%">م</th>
                            <th width="75%">الهدف التدريسي</th>
                            <th width="20%">تاريخ التحقق</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${objectivesRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// دالة الطباعة
function printIEP() {
    window.print();
}

// تصدير
window.printIEP = printIEP;
