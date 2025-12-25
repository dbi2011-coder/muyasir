// ============================================
// 📁 المسار: assets/js/teacher.js
// الوصف: لوحة المعلم + النموذج 9 (نسخة التشخيص)
// ============================================

// 1. رسالة تأكيد أن الملف تم تحميله (ستظهر نافذة منبثقة عند تشغيل الصفحة)
// يمكنك حذف هذا السطر لاحقاً بعد التأكد من عمله
// alert("ملف المعلم يعمل بنجاح!");

document.addEventListener('DOMContentLoaded', function() {
    console.log("Teacher.js: بدأ التشغيل...");
    checkAuthAndInit();
});

function checkAuthAndInit() {
    // التحقق من تسجيل الدخول
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
        console.warn("Teacher.js: لا يوجد مستخدم مسجل، جاري التحويل لصفحة الدخول.");
        window.location.href = '../../index.html'; // تأكد أن المسار صحيح لصفحة الدخول
        return;
    }

    const user = JSON.parse(userJson);
    if (user.role !== 'teacher') {
        alert("تنبيه: هذا الحساب ليس حساب معلم.");
        window.location.href = '../../index.html';
        return;
    }

    console.log(`Teacher.js: تم الدخول بنجاح للمعلم (${user.name})`);

    // عرض اسم المعلم (مع فحص وجود العنصر لتجنب الأخطاء)
    const teacherNameEl = document.getElementById('teacherName');
    if (teacherNameEl) {
        teacherNameEl.textContent = user.name;
    } else {
        console.warn("تنبيه: لم يتم العثور على عنصر 'teacherName' في HTML.");
    }

    loadMyStudents();
}

function loadMyStudents() {
    // تحميل الطلاب
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    
    // ابحث عن الجدول في HTML
    const studentsList = document.getElementById('studentsList');
    
    if (!studentsList) {
        console.error("خطأ: لم يتم العثور على الجدول <tbody id='studentsList'> في الصفحة.");
        console.log("يرجى التأكد من أن ملف HTML يحتوي على جدول بهذا الـ ID لعرض الطلاب.");
        return;
    }

    studentsList.innerHTML = '';
    
    if (allStudents.length === 0) {
        studentsList.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا يوجد طلاب في قاعدة البيانات</td></tr>';
        return;
    }

    // رسم الجدول وإضافة زر النموذج 9
    allStudents.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${student.name}</td>
            <td>${student.grade || '-'}</td>
            <td>${student.subject || '-'}</td>
            <td>
                <button class="btn btn-sm btn-info" 
                        style="background-color:#17a2b8; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" 
                        onclick="openIEPModal(${student.id})">
                    <i class="fas fa-file-alt"></i> نموذج 9 (الذكية)
                </button>
            </td>
        `;
        studentsList.appendChild(tr);
    });
}

// ================================================================
// 🟢 كود النافذة المنبثقة للنموذج 9
// ================================================================

window.openIEPModal = function(studentId) {
    console.log("فتح النموذج للطالب رقم:", studentId);
    
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const student = allStudents.find(s => s.id === studentId);
    
    if (!student) { alert('بيانات الطالب غير موجودة'); return; }

    // إزالة المودال القديم إن وجد
    const oldModal = document.getElementById('iepModal');
    if (oldModal) oldModal.remove();

    // تحليل البيانات
    const analysis = analyzeStudentData(studentId);

    // إنشاء المودال
    const modal = document.createElement('div');
    modal.id = 'iepModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; overflow-y:auto; display:flex; justify-content:center; align-items:flex-start; padding-top:20px;';
    
    modal.innerHTML = `
        <div class="modal-content" style="background:#fff; width:95%; max-width:1000px; border-radius:8px; padding:20px; position:relative; margin-bottom:50px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                <h3 style="margin:0;">الخطة التربوية (نموذج 9)</h3>
                <button onclick="document.getElementById('iepModal').remove()" style="font-size:24px; border:none; background:none; cursor:pointer;">&times;</button>
            </div>
            
            <div class="iep-word-model">
                <div class="no-print" style="margin-bottom:15px;">
                    <button onclick="window.print()" style="background:#2980b9; color:white; padding:8px 15px; border:none; border-radius:4px; cursor:pointer;">🖨️ طباعة</button>
                </div>

                <table class="word-table" style="width:100%; border:2px solid #000; border-collapse:collapse; margin-bottom:20px;">
                    <tr>
                        <th style="border:1px solid #000; padding:8px; background:#eee;">الاسم</th><td style="border:1px solid #000; padding:8px;">${student.name}</td>
                        <th style="border:1px solid #000; padding:8px; background:#eee;">المادة</th><td style="border:1px solid #000; padding:8px;">${student.subject || 'عام'}</td>
                    </tr>
                    <tr>
                        <th style="border:1px solid #000; padding:8px; background:#eee;">الصف</th><td style="border:1px solid #000; padding:8px;">${student.grade || '-'}</td>
                        <th style="border:1px solid #000; padding:8px; background:#eee;">نسبة الإنجاز</th>
                        <td style="border:1px solid #000; padding:8px; color:${analysis.percent > 50 ? 'green' : 'red'}; font-weight:bold;">${analysis.percent}%</td>
                    </tr>
                </table>

                <div style="display:flex; gap:10px; margin-bottom:20px;">
                    <div style="flex:1;">
                        <h4 style="background:#d4edda; padding:10px; margin:0; border:1px solid #c3e6cb;">نقاط القوة</h4>
                        <ul style="border:1px solid #ccc; padding:10px; margin:0; list-style:none;">${analysis.strengthsHTML}</ul>
                    </div>
                    <div style="flex:1;">
                        <h4 style="background:#f8d7da; padding:10px; margin:0; border:1px solid #f5c6cb;">نقاط الاحتياج</h4>
                        <ul style="border:1px solid #ccc; padding:10px; margin:0; list-style:none;">${analysis.needsHTML}</ul>
                    </div>
                </div>

                <div id="goalsContainer">${analysis.goalsUnitsHTML}</div>
                
                <button onclick="addManualGoal()" class="no-print" style="margin-top:10px; padding:10px; background:#2c3e50; color:white; border:none; width:100%; cursor:pointer;">+ إضافة هدف جديد</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// تحليل البيانات
function analyzeStudentData(studentId) {
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const assigned = studentTests.find(t => t.studentId === studentId && t.type === 'diagnostic');
    const original = assigned ? allTests.find(t => t.id === assigned.testId) : null;

    let strengthsHTML = '', needsHTML = '', goalsUnitsHTML = '';
    let total = 0, passed = 0;

    if (original && assigned && assigned.answers) {
        original.questions.forEach(q => {
            total++;
            const ans = assigned.answers.find(a => a.questionId === q.id);
            const score = ans ? ans.score : 0;
            if (score >= (q.passingScore || 5)) {
                passed++;
                strengthsHTML += `<li>✅ ${q.text}</li>`;
            } else {
                needsHTML += `<li>❌ ${q.text}</li>`;
                goalsUnitsHTML += createGoalUnitHTML(q.text);
            }
        });
    } else {
        strengthsHTML = '<li>لا يوجد بيانات اختبار</li>';
        needsHTML = '<li>يحتاج لاختبار تشخيصي</li>';
        goalsUnitsHTML = createGoalUnitHTML('هدف مقترح...');
    }
    const percent = total === 0 ? 0 : Math.round((passed/total)*100);
    return { strengthsHTML, needsHTML, goalsUnitsHTML, percent };
}

function createGoalUnitHTML(title) {
    return `
    <div class="goal-unit" style="border:2px solid #555; padding:10px; margin-bottom:10px; border-radius:5px;">
        <div style="background:#e3f2fd; padding:5px; margin-bottom:5px;">
            <button onclick="this.parentElement.parentElement.remove()" class="no-print" style="float:left; color:red; border:none; background:none; cursor:pointer;">حذف</button>
            <strong>الهدف:</strong> <input type="text" value="${title}" style="border:none; background:transparent; width:70%;">
        </div>
        </div>`;
}
function addManualGoal() {
    const div = document.createElement('div');
    div.innerHTML = createGoalUnitHTML('');
    document.getElementById('goalsContainer').appendChild(div.firstElementChild);
}
