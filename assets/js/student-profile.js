// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب بالكامل (التنقل، البيانات، الخطة التلقائية)
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// =========================================================
// 1. عند تحميل الصفحة وتشغيل النظام
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    // جلب معرف الطالب من الرابط
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');

    // التحقق من وجود المعرف
    if (!idParam) {
        alert('لم يتم تحديد طالب، جاري العودة للقائمة...');
        window.location.href = 'students.html';
        return;
    }

    // تخزين المعرف (بدون تحويل قسري لضمان المرونة بين النصوص والأرقام)
    currentStudentId = idParam;

    // تحميل بيانات الطالب الأساسية
    loadStudentData();
    
    // تفعيل التبويب الافتراضي (الاختبار التشخيصي)
    switchSection('diagnostic');
});

// =========================================================
// 2. دالة التنقل بين التبويبات (التي كانت مفقودة)
// =========================================================
function switchSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; // ضمان الإخفاء
    });

    // إزالة التفعيل من القائمة الجانبية
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }

    // تفعيل الرابط في القائمة
    const targetLink = document.getElementById(`link-${sectionId}`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    // تشغيل وظائف خاصة عند فتح تبويب "الخطة التربوية"
    if (sectionId === 'iep') {
        loadIEPTab(currentStudentId);
    }
}

// =========================================================
// 3. دالة تحميل بيانات الطالب (الاسم، الصورة، الصف)
// =========================================================
function loadStudentData() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    
    // استخدام (==) للمقارنة المرنة بين النص والرقم
    currentStudent = students.find(s => s.id == currentStudentId);

    if (currentStudent) {
        // تحديث القائمة الجانبية
        const elements = {
            sideName: document.getElementById('sideName'),
            sideGrade: document.getElementById('sideGrade'),
            sideAvatar: document.getElementById('sideAvatar'),
            headerName: document.getElementById('headerStudentName')
        };

        if (elements.sideName) elements.sideName.textContent = currentStudent.name;
        if (elements.sideGrade) elements.sideGrade.textContent = currentStudent.grade || 'غير محدد';
        if (elements.sideAvatar) elements.sideAvatar.textContent = currentStudent.name.charAt(0);
        if (elements.headerName) elements.headerName.textContent = currentStudent.name;
        
    } else {
        alert('خطأ: بيانات الطالب غير موجودة في قاعدة البيانات.');
        window.location.href = 'students.html';
    }
}

// =========================================================
// 4. المحرك الرئيسي: تعبئة الخطة التربوية تلقائياً (النموذج 9)
// =========================================================
function loadIEPTab(studentId) {
    console.log("جاري إعداد الخطة للطالب:", studentId);
    
    // جلب البيانات من النظام
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');

    // البحث عن أحدث اختبار تشخيصي للطالب
    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    // مصفوفات لتخزين البيانات المستخلصة
    let strengthPoints = [];
    let needPoints = []; 
    let targetObjectives = []; // لتعبئة جدول الأهداف

    // -----------------------------------------------------
    // أ) تحليل نتائج الاختبار وتصنيفها (قوة vs احتياج)
    // -----------------------------------------------------
    if (studentResult && studentResult.answers) {
        const originalTest = tests.find(t => t.id == studentResult.testId);
        
        if (originalTest) {
            studentResult.answers.forEach(answer => {
                // البحث عن السؤال والهدف المرتبط به
                const question = originalTest.questions.find(q => q.id == answer.questionId);
                
                if (question && question.linkedGoalId) {
                    const objective = objectives.find(obj => obj.id == question.linkedGoalId);
                    
                    if (objective) {
                        if (answer.isCorrect) {
                            // إجابة صحيحة -> نقاط القوة
                            strengthPoints.push(objective.shortTermGoal);
                        } else {
                            // إجابة خاطئة -> نقاط الاحتياج
                            needPoints.push(objective.shortTermGoal);
                            
                            // تحضير الأهداف للخطة (قصيرة المدى + التدريسية)
                            if (objective.instructionalGoals && objective.instructionalGoals.length > 0) {
                                targetObjectives.push({
                                    short: objective.shortTermGoal,
                                    instructional: objective.instructionalGoals
                                });
                            } else {
                                // إذا لم توجد أهداف تدريسية، نستخدم الهدف القصير نفسه
                                targetObjectives.push({
                                    short: objective.shortTermGoal,
                                    instructional: [objective.shortTermGoal]
                                });
                            }
                        }
                    }
                }
            });
        }
    }

    // -----------------------------------------------------
    // ب) تعبئة حقول "نقاط القوة" و "نقاط الاحتياج" في الواجهة
    // -----------------------------------------------------
    // ملاحظة: تأكد أن عناصر HTML تمتلك هذه الـ IDs
    const strengthsInput = document.getElementById('iep-strengths');
    const needsInput = document.getElementById('iep-needs');

    if (strengthsInput) {
        strengthsInput.value = strengthPoints.length > 0 
            ? strengthPoints.join('\n- ') 
            : 'لا توجد نقاط قوة مسجلة بناءً على الاختبار التشخيصي.';
    }

    if (needsInput) {
        needsInput.value = needPoints.length > 0 
            ? needPoints.join('\n- ') 
            : 'لا توجد نقاط احتياج مسجلة.';
    }

    // -----------------------------------------------------
    // ج) تعبئة جدول الأهداف (القصيرة والتدريسية)
    // -----------------------------------------------------
    const goalsTableBody = document.getElementById('iep-goals-body');
    
    if (goalsTableBody) {
        goalsTableBody.innerHTML = ''; // مسح المحتوى القديم

        if (targetObjectives.length > 0) {
            targetObjectives.forEach((objGroup) => {
                objGroup.instructional.forEach((instrGoal) => {
                    const row = document.createElement('tr');
                    
                    // بناء الصف: هدف قصير (قابل للتعديل) - هدف تدريسي (قابل للتعديل) - حقول فارغة للتقييم
                    row.innerHTML = `
                        <td><input type="text" class="form-control" value="${objGroup.short}"></td>
                        <td><input type="text" class="form-control" value="${instrGoal}"></td>
                        <td><input type="date" class="form-control"></td>
                        <td><input type="text" class="form-control" placeholder="%"></td>
                        <td><input type="text" class="form-control"></td>
                    `;
                    goalsTableBody.appendChild(row);
                });
            });
        } else {
            goalsTableBody.innerHTML = `<tr><td colspan="5" class="text-center">لم يتم تحديد أهداف، يرجى إجراء اختبار تشخيصي أولاً.</td></tr>`;
        }
    }

    // -----------------------------------------------------
    // د) تعبئة جدول الحصص (من جدول المعلم)
    // -----------------------------------------------------
    fillScheduleTable(studentId);
}

// =========================================================
// 5. دالة تعبئة جدول الحصص
// =========================================================
function fillScheduleTable(studentId) {
    const scheduleBody = document.getElementById('iep-schedule-body');
    if (!scheduleBody) return;

    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    // بناء الجدول (الأيام كصفوف، والحصص كأعمدة) أو العكس حسب تصميم الجدول لديك
    // هنا نفترض التصميم: الصفوف = الأيام، الأعمدة = الحصص (1-7)
    
    let html = '';
    days.forEach(day => {
        html += `<tr><td class="font-weight-bold">${day}</td>`;
        
        for (let period = 1; period <= 7; period++) {
            // البحث هل توجد حصة للطالب في هذا اليوم وهذه الفترة
            const session = teacherSchedule.find(s => 
                s.day === day && 
                s.period == period && 
                s.students && s.students.includes(parseInt(studentId)) // التأكد من وجود الطالب في القائمة
            );

            if (session) {
                // حصة موجودة: نضع المادة أو علامة
                html += `<td><input type="text" class="form-control filled-session" value="${session.subject || 'صعوبات'}" style="background-color: #e8f5e9;"></td>`;
            } else {
                // حصة فارغة
                html += `<td><input type="text" class="form-control" disabled style="background-color: #f1f1f1;"></td>`;
            }
        }
        html += '</tr>';
    });

    scheduleBody.innerHTML = html;
}
