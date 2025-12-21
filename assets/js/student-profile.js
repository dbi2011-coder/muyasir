// =========================================================
// 📁 الملف: assets/js/student-profile.js
// الوظيفة: إدارة ملف الطالب كاملة + التعبئة التلقائية القابلة للتعديل
// =========================================================

let currentStudentId = null;

// =========================================================
// 1. عند تحميل الصفحة: تجهيز البيانات وتشغيل النظام
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 النظام يعمل: student-profile.js");

    const params = new URLSearchParams(window.location.search);
    let targetId = params.get('id');
    const students = JSON.parse(localStorage.getItem('students') || '[]');

    // التحقق من وجود طلاب
    if (students.length === 0) {
        alert('لا توجد بيانات طلاب في النظام.');
        return;
    }

    // البحث عن الطالب
    let foundStudent = students.find(s => s.id == targetId);
    
    // إذا لم نجد الطالب (رقم خطأ)، نفتح أول طالب تلقائياً لتجنب توقف الصفحة
    if (!foundStudent) {
        console.warn('لم يتم العثور على الطالب المحدد، جاري فتح أول طالب متاح.');
        foundStudent = students[0];
        // تحديث الرابط في المتصفح بصمت
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('id', foundStudent.id);
        window.history.replaceState({}, '', newUrl);
    }

    currentStudentId = foundStudent.id;

    // عرض بيانات الهيدر (الاسم، الصف، الصورة)
    updateProfileHeader(foundStudent);

    // فتح التبويب الافتراضي (التشخيص)
    switchSection('diagnostic');
});

function updateProfileHeader(student) {
    const ids = ['headerStudentName', 'sideName', 'sideGrade', 'sideAvatar'];
    const textMap = {
        'headerStudentName': student.name,
        'sideName': student.name,
        'sideGrade': student.grade || '-',
        'sideAvatar': student.name.charAt(0)
    };

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = textMap[id];
    });
}

// =========================================================
// 2. دالة التنقل بين التبويبات (switchSection)
// =========================================================
window.switchSection = function(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    // إزالة التفعيل من الأزرار
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    // إظهار القسم المطلوب
    const targetSection = document.getElementById(`section-${sectionId}`);
    const targetLink = document.getElementById(`link-${sectionId}`);

    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
    }
    if (targetLink) targetLink.classList.add('active');

    // إذا ضغط المعلم على تبويب "الخطة التربوية"، ننفذ التعبئة التلقائية
    if (sectionId === 'iep') {
        autoFillIEPForm();
    }
};

// =========================================================
// 3. (مهم جداً) دالة التعبئة التلقائية القابلة للتعديل
// =========================================================
function autoFillIEPForm() {
    console.log("جاري التعبئة التلقائية للخطة...");

    if (!currentStudentId) return;

    // جلب البيانات من الذاكرة
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');

    // جلب كل الاختبارات للبحث عن تفاصيل الأسئلة
    let allTests = [];
    ['questionBanks', 'tests', 'assessments'].forEach(key => {
        try {
            let d = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(d)) allTests.push(...d);
        } catch (e) {}
    });

    // البحث عن أحدث نتيجة تشخيصية للطالب
    const result = allResults
        .filter(r => r.studentId == currentStudentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    // مصفوفات لتخزين البيانات المستخرجة
    let strengthsText = [];
    let needsText = [];
    let goalsData = [];

    // تحليل الإجابات (تحويل الإجابات إلى أهداف)
    if (result && result.answers) {
        const testRef = allTests.find(t => t.id == result.testId);
        const questionsRef = testRef ? (testRef.questions || testRef.items || []) : [];

        result.answers.forEach(ans => {
            // العثور على السؤال والهدف المرتبط به
            let q = questionsRef.find(x => x.id == ans.questionId);
            let linkedGoalId = (q && q.linkedGoalId) ? q.linkedGoalId : ans.linkedGoalId;

            if (linkedGoalId) {
                const obj = objectives.find(o => o.id == linkedGoalId);
                if (obj) {
                    if (ans.isCorrect) {
                        // إجابة صحيحة -> نقاط قوة
                        if (!strengthsText.includes(obj.shortTermGoal)) strengthsText.push(obj.shortTermGoal);
                    } else {
                        // إجابة خاطئة -> نقاط احتياج + أهداف
                        if (!needsText.includes(obj.shortTermGoal)) {
                            needsText.push(obj.shortTermGoal);
                            
                            // جلب الأهداف التدريسية الفرعية
                            const subGoals = (obj.instructionalGoals && obj.instructionalGoals.length > 0) 
                                ? obj.instructionalGoals 
                                : [obj.shortTermGoal];
                            
                            goalsData.push({ short: obj.shortTermGoal, subs: subGoals });
                        }
                    }
                }
            }
        });
    }

    // --------------------------------------------------------
    // تطبيق البيانات على الحقول (Inputs) لتكون قابلة للتعديل
    // --------------------------------------------------------

    // أ) تعبئة نقاط القوة (في Textarea)
    const strengthEl = document.getElementById('iep-strengths');
    if (strengthEl) {
        // نستخدم .value وليس .textContent لكي يظهر النص داخل المربع ويكون قابلاً للتعديل
        // إذا كان الحقل فارغاً، نعبئه. إذا كان فيه كلام، نتركه (أو يمكن إجباره حسب رغبتك)
        strengthEl.value = strengthsText.join('\n');
    }

    // ب) تعبئة نقاط الاحتياج (في Textarea)
    const needsEl = document.getElementById('iep-needs');
    if (needsEl) {
        needsEl.value = needsText.join('\n');
    }

    // ج) تعبئة جدول الأهداف (في Inputs)
    const goalsBody = document.getElementById('iep-goals-body');
    if (goalsBody) {
        goalsBody.innerHTML = ''; // تفريغ الجدول القديم
        
        if (goalsData.length > 0) {
            goalsData.forEach(g => {
                g.subs.forEach(sub => {
                    // لاحظ استخدام value="..." داخل الـ input
                    const row = `
                        <tr>
                            <td><input type="text" class="form-control" value="${g.short}"></td>
                            <td><input type="text" class="form-control" value="${sub}"></td>
                            <td><input type="date" class="form-control"></td>
                            <td><input type="text" class="form-control" placeholder="%"></td>
                            <td><input type="text" class="form-control"></td>
                        </tr>`;
                    goalsBody.insertAdjacentHTML('beforeend', row);
                });
            });
        } else {
            goalsBody.innerHTML = `<tr><td colspan="5" class="text-center">لا توجد أهداف مستخرجة. (يمكنك الكتابة يدوياً)</td></tr>`;
        }
    }

    // د) تعبئة جدول الحصص (في Inputs)
    fillScheduleTable(teacherSchedule);
}

// دالة مساعدة لجدول الحصص
function fillScheduleTable(scheduleData) {
    const tbody = document.getElementById('iep-schedule-body');
    if (!tbody) return;

    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    let html = '';

    days.forEach(day => {
        html += `<tr><td><strong>${day}</strong></td>`;
        for (let p = 1; p <= 7; p++) {
            const session = scheduleData.find(s => 
                s.day === day && 
                s.period == p && 
                s.students && s.students.includes(parseInt(currentStudentId))
            );

            if (session) {
                // حصة موجودة -> Input معبأ
                html += `<td><input type="text" class="form-control" value="${session.subject || 'صعوبات'}" style="background-color:#e8f5e9; text-align:center;"></td>`;
            } else {
                // حصة فارغة -> Input فارغ
                html += `<td><input type="text" class="form-control" disabled style="background-color:#f9f9f9;"></td>`;
            }
        }
        html += '</tr>';
    });
    tbody.innerHTML = html;
}

// =========================================================
// 4. دوال النوافذ المنبثقة (Modal) وإسناد الاختبارات
// =========================================================

window.showAssignTestModal = function() {
    const modal = document.getElementById('assignTestModal');
    if (modal) {
        modal.style.display = 'block';
        loadTestsList();
    } else {
        alert('نافذة تعيين الاختبار غير موجودة في HTML');
    }
};

window.closeModal = function(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'none';
};

// تحميل قائمة الاختبارات (بحث شامل في كل المفاتيح)
function loadTestsList() {
    const select = document.getElementById('assignTestSelect');
    if (!select) return;

    select.innerHTML = '<option value="">اختر الاختبار...</option>';
    let foundTests = [];

    // بحث في كل المفاتيح
    Object.keys(localStorage).forEach(key => {
        try {
            let d = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(d) && d.length > 0) {
                // التحقق من هيكل البيانات
                if (d[0].title || d[0].questions || key.includes('bank')) {
                    foundTests.push(...d);
                }
            }
        } catch (e) {}
    });

    // إزالة التكرار
    const uniqueTests = Array.from(new Map(foundTests.map(item => [item.id, item])).values());

    uniqueTests.forEach(test => {
        const opt = document.createElement('option');
        opt.value = test.id;
        opt.textContent = test.title || test.name || `اختبار ${test.id}`;
        select.appendChild(opt);
    });
}

window.saveAssignedTest = function() {
    const select = document.getElementById('assignTestSelect');
    if (!select || !select.value) {
        alert('الرجاء اختيار اختبار');
        return;
    }

    const assigned = JSON.parse(localStorage.getItem('assignedTests') || '[]');
    // إضافة الاختبار
    assigned.push({
        id: Date.now(),
        studentId: currentStudentId,
        testId: select.value,
        status: 'pending',
        assignedDate: new Date().toISOString()
    });

    localStorage.setItem('assignedTests', JSON.stringify(assigned));
    alert('تم إسناد الاختبار بنجاح');
    closeModal('assignTestModal');
};

// إغلاق النافذة عند النقر خارجها
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
};
