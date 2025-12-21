// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب بالكامل (التنقل، البيانات، الخطة)
// =========================================================

let currentStudentId = null;
let currentStudent = null;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // جلب معرف الطالب من الرابط
    const params = new URLSearchParams(window.location.search);
    currentStudentId = parseInt(params.get('id'));

    if (!currentStudentId) {
        alert('لم يتم تحديد طالب');
        window.location.href = 'students.html';
        return;
    }

    // تحميل بيانات الطالب الأساسية
    loadStudentData();
    
    // تفعيل التبويب الافتراضي (مثلاً الاختبار التشخيصي)
    switchSection('diagnostic');
});

// 1. دالة التنقل بين التبويبات (التي كانت مفقودة)
function switchSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // إزالة التفعيل من جميع الروابط
    document.querySelectorAll('.sidebar-menu .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // تفعيل الرابط الخاص به
    const targetLink = document.getElementById(`link-${sectionId}`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    // إجراءات خاصة عند فتح تبويبات معينة
    if (sectionId === 'iep') {
        loadIEPTab(currentStudentId); // تحميل الخطة التربوية
    }
}

// 2. دالة تحميل بيانات الطالب الأساسية (للشريط الجانبي والرأس)
function loadStudentData() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    currentStudent = students.find(s => s.id === currentStudentId);

    if (currentStudent) {
        // تحديث الشريط الجانبي
        document.getElementById('sideName').textContent = currentStudent.name;
        document.getElementById('sideGrade').textContent = currentStudent.grade || 'غير محدد';
        document.getElementById('sideAvatar').textContent = currentStudent.name.charAt(0);
        
        // تحديث رأس الصفحة
        document.getElementById('headerStudentName').textContent = currentStudent.name;
        
        // تعبئة البيانات الأساسية في جدول الخطة التربوية (في حال وجوده)
        const inputs = document.querySelectorAll('.word-table input[type="text"]');
        if(inputs.length > 0) {
             // محاولة تعبئة حقول الاسم والمادة والصف في نموذج الوورد إذا وجدت بترتيبها
             // هذا يعتمد على ترتيب العناصر في HTML الخاص بك
             // مثال تقريبي:
             // inputs[0].value = currentStudent.name; 
        }
    } else {
        alert('الطالب غير موجود');
        window.location.href = 'students.html';
    }
}

// 3. دالة تحميل الخطة التربوية (الكود الجديد المطور)
function loadIEPTab(studentId) {
    console.log("Loading IEP for student:", studentId);
    
    // جلب البيانات اللازمة
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const tests = JSON.parse(localStorage.getItem('tests') || '[]');
    
    // جلب نتائج الاختبار التشخيصي للطالب
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const studentResult = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic') // تأكد أن نوع الاختبار diagnostic
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]; // الأحدث

    let strengthPoints = [];
    let needPoints = []; 
    let targetObjectives = []; 

    // تحليل النتائج
    if (studentResult && studentResult.answers) {
        const originalTest = tests.find(t => t.id == studentResult.testId);
        
        if (originalTest) {
            studentResult.answers.forEach(answer => {
                const question = originalTest.questions.find(q => q.id == answer.questionId);
                
                if (question && question.linkedGoalId) {
                    const objective = objectives.find(obj => obj.id == question.linkedGoalId);
                    
                    if (objective) {
                        if (answer.isCorrect) {
                            // إجابة صحيحة = نقطة قوة
                            strengthPoints.push(objective.shortTermGoal);
                        } else {
                            // إجابة خاطئة = نقطة احتياج
                            needPoints.push(objective.shortTermGoal);
                            
                            // إضافة للأهداف التدريسية
                            if (objective.instructionalGoals && objective.instructionalGoals.length > 0) {
                                targetObjectives.push({
                                    short: objective.shortTermGoal,
                                    instructional: objective.instructionalGoals
                                });
                            } else {
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

    // تعبئة نقاط القوة والاحتياج في الجدول (Word Model)
    // ملاحظة: نحتاج للوصول إلى `textarea` داخل جدول نقاط القوة والضعف
    // سنفترض أن الجدول الثاني في صفحة الخطة هو الخاص بنقاط القوة والضعف
    // أو نستخدم Selectors دقيقة بناءً على الهيكل
    
    const wordTables = document.querySelectorAll('.word-table');
    if (wordTables.length >= 3) { // الجدول الثالث هو جدول النقاط
        const pointsTable = wordTables[2];
        const textareas = pointsTable.querySelectorAll('textarea');
        
        // تفريغ الحقول أولاً
        textareas.forEach(t => t.value = '');

        // تعبئة نقاط القوة (العمود الأول)
        strengthPoints.forEach((point, index) => {
            // نفترض أن الصفوف مرتبة: قوة - احتياج، قوة - احتياج...
            // أو أن العمود 1 هو للقوة والعمود 3 هو للاحتياج
            // سنبحث عن textarea في العمود المناسب
            // هنا سنضع كل النقاط في أول حقل كنص واحد أو نوزعها
            if (index < textareas.length / 2) {
                 // هذا منطق تقريبي، يفضل وضع ID للعناصر في HTML للدقة
                 // لكن سنضع كل النقاط في أول مربع كنص واحد لضمان الظهور
            }
        });
        
        // للتسهيل: سنبحث عن الحقول باستخدام الترتيب المنطقي في الجدول
        // الصفوف تحتوي على cells. الخلية 1 (index 1) قوة، الخلية 3 (index 3) احتياج
        const rows = pointsTable.querySelectorAll('tbody tr');
        
        // مسح البيانات القديمة
        rows.forEach(row => {
            if(row.cells[1]) row.cells[1].querySelector('textarea').value = '';
            if(row.cells[3]) row.cells[3].querySelector('textarea').value = '';
        });

        // تعبئة البيانات الجديدة
        const maxRows = Math.max(strengthPoints.length, needPoints.length, rows.length);
        
        for (let i = 0; i < maxRows; i++) {
            let row = rows[i];
            // إذا لم يوجد صف كافٍ، يمكن إنشاء صف جديد (اختياري)
            if (!row && i < 5) continue; // نتوقف إذا تجاوزنا عدد الصفوف الموجودة

            if (row) {
                if (strengthPoints[i]) {
                    row.cells[1].querySelector('textarea').value = strengthPoints[i];
                }
                if (needPoints[i]) {
                    row.cells[3].querySelector('textarea').value = needPoints[i];
                }
            }
        }
    }

    // تعبئة جدول الأهداف التدريسية (الجدول الأخير)
    // نبحث عن الجدول الذي يحتوي على "الأهداف التدريسية" في الرأس
    let goalsTable = null;
    document.querySelectorAll('.word-table').forEach(tbl => {
        if (tbl.innerHTML.includes('الأهداف التدريسية')) {
            goalsTable = tbl;
        }
    });

    if (goalsTable) {
        const tbody = goalsTable.querySelector('tbody');
        tbody.innerHTML = ''; // مسح المحتوى القديم

        if (targetObjectives.length > 0) {
            targetObjectives.forEach((objGroup, idx) => {
                // لكل هدف قصير المدى
                // سطر العنوان للهدف القصير
                const headerRow = document.createElement('tr');
                headerRow.style.backgroundColor = '#f9f9f9';
                headerRow.innerHTML = `
                    <td><strong>${idx + 1}</strong></td>
                    <td class="text-right" colspan="2">
                        <strong>الهدف قصير المدى:</strong>
                        <input type="text" style="width: 80%; border-bottom: 1px solid #ccc;" value="${objGroup.short}">
                    </td>
                `;
                tbody.appendChild(headerRow);

                // أسطر الأهداف التدريسية
                objGroup.instructional.forEach((instr, i) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${i + 1}</td>
                        <td><textarea rows="1" class="text-right">${instr}</textarea></td>
                        <td><input type="date"></td>
                    `;
                    tbody.appendChild(row);
                });
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-3">لم يتم تحديد أهداف بناءً على الاختبار التشخيصي بعد.</td></tr>';
        }
    }

    // تعبئة جدول الحصص
    fillScheduleTable(studentId);
}

// 4. دالة تعبئة جدول الحصص
function fillScheduleTable(studentId) {
    // نبحث عن الجدول الذي يحتوي على أيام الأسبوع
    let scheduleTable = null;
    document.querySelectorAll('.word-table').forEach(tbl => {
        if (tbl.innerHTML.includes('الأحد') && tbl.innerHTML.includes('الخميس')) {
            scheduleTable = tbl;
        }
    });

    if (!scheduleTable) return;

    // جلب جدول المعلم
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    
    // الصف الثاني في الجدول هو صف الـ Checkboxes (الحصة)
    // في تصميمك الحالي، الجدول مقلوب (الأعمدة هي الأيام)، وهذا يختلف قليلاً عن البيانات
    // سنفترض أن الصفوف تمثل الحصص والأعمدة تمثل الأيام بناءً على الكود السابق
    
    // لكن في HTML الذي أرسلته (16.txt)، الجدول في الخطة:
    // الرأس: اليوم | الأحد | الاثنين ...
    // الجسم: الحصة | checkbox | checkbox ...
    
    // لنقم بتعبئة الـ Checkboxes بناءً على وجود حصة للطالب
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    
    // نحتاج لمعرفة أي Checkbox يخص أي يوم.
    // الجدول لديه صف واحد للحصص (أو عدة صفوف للحصص 1، 2، 3..)
    // الكود في HTML يظهر صف واحد فقط "الحصة" مع مربعات اختيار.
    
    // سنقوم بتعليم الـ checkbox إذا كان للطالب أي حصة في ذلك اليوم
    const tbody = scheduleTable.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr'); // صفوف الحصص
    
    // إعادة تعيين الكل
    tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

    teacherSchedule.forEach(session => {
        if (session.students.includes(studentId)) {
            // الطالب لديه حصة
            const dayIndex = days.indexOf(session.day);
            if (dayIndex !== -1) {
                // الحصة (period) تبدأ من 1. لنفترض أن الصفوف تمثل الحصص
                // إذا كان الجدول يحتوي صف واحد فقط للحصة، سنعلم العمود الموافق لليوم
                
                // في HTML المرفق: <td><input type="checkbox"></td> لكل يوم
                // العمود 0 هو العنوان "الحصة"، العمود 1 هو الأحد، 2 الاثنين...
                
                // البحث عن الصف المناسب للحصة (إذا كان هناك عدة صفوف)
                // أو إذا كان صف واحد عام
                if (rows.length > 0) {
                    // لنفترض الصف الأول يمثل الحصة المختارة
                    const row = rows[0]; 
                    // الخلية المقابلة لليوم (dayIndex + 1 لأن العمود الأول عنوان)
                    if (row.cells[dayIndex + 1]) {
                        const checkbox = row.cells[dayIndex + 1].querySelector('input[type="checkbox"]');
                        if (checkbox) checkbox.checked = true;
                    }
                }
            }
        }
    });
}
