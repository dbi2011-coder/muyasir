// ============================================
// 📁 المسار: assets/js/teacher.js
// الوصف: لوحة تحكم المعلم + النموذج 9 الذكي (مصحح)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndInit();
});

function checkAuthAndInit() {
    // 1. التحقق من المستخدم (Auth Check)
    const userJson = localStorage.getItem('currentUser');
    
    // إذا لم يكن هناك مستخدم مسجل، نوجهه لصفحة الدخول
    if (!userJson) {
        console.log("لا يوجد مستخدم مسجل، جاري التحويل...");
        // نحاول العودة للصفحة الرئيسية (جربنا مسارين لضمان العمل)
        window.location.href = '../../index.html'; 
        return;
    }

    const user = JSON.parse(userJson);

    // التحقق من أن المستخدم هو "معلم"
    if (user.role !== 'teacher') {
        alert("عذراً، هذه الصفحة مخصصة للمعلمين فقط.");
        window.location.href = '../../index.html';
        return;
    }

    // 2. إذا نجح الدخول، نعرض البيانات
    console.log("تم الدخول بنجاح: ", user.name);
    
    const teacherNameEl = document.getElementById('teacherName');
    if (teacherNameEl) {
        teacherNameEl.textContent = user.name;
    }

    // 3. تحميل قائمة الطلاب
    loadMyStudents();
}

// ================================================================
// 📋 دالة تحميل الطلاب وإضافة زر النموذج 9
// ================================================================
function loadMyStudents() {
    // جلب البيانات من التخزين
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    
    // ملاحظة: هنا نفترض عرض كل الطلاب، يمكنك تصفيتهم لاحقاً حسب المعلم
    const myStudents = allStudents; 

    const studentsList = document.getElementById('studentsList');
    
    // التأكد من وجود الجدول في الصفحة قبل محاولة الكتابة فيه
    if(studentsList) {
        studentsList.innerHTML = ''; // مسح القائمة القديمة
        
        if (myStudents.length === 0) {
            studentsList.innerHTML = '<tr><td colspan="4" style="text-align:center;">لا يوجد طلاب مسجلين</td></tr>';
            return;
        }

        myStudents.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.name}</td>
                <td>${student.grade || 'غير محدد'}</td>
                <td>${student.subject || 'عام'}</td>
                <td>
                    <button class="btn btn-sm btn-info" style="background-color:#17a2b8; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" onclick="openIEPModal(${student.id})">
                        <i class="fas fa-file-alt"></i> نموذج 9 (الذكية)
                    </button>
                </td>
            `;
            studentsList.appendChild(tr);
        });
    }
}

// ================================================================
// 🟢 المحرك الذكي للنموذج 9 (Smart IEP Engine)
// ================================================================

function openIEPModal(studentId) {
    // جلب بيانات الطالب المحدد
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const student = allStudents.find(s => s.id === studentId);
    
    if (!student) {
        alert('حدث خطأ: بيانات الطالب غير موجودة');
        return;
    }

    // إنشاء النافذة المنبثقة (Modal)
    const oldModal = document.getElementById('iepModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'iepModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; overflow-y:auto; display:flex; justify-content:center; align-items:flex-start; padding-top:20px;';
    
    // تحليل البيانات
    const analysis = analyzeStudentData(studentId);

    modal.innerHTML = `
        <div class="modal-content" style="background:#fff; width:95%; max-width:1000px; border-radius:8px; padding:0; box-shadow:0 5px 15px rgba(0,0,0,0.3); position:relative; margin-bottom:50px;">
            <div style="background:#f8f9fa; padding:15px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; color:#2c3e50;">الخطة التربوية الفردية (نموذج 9)</h3>
                <button onclick="document.getElementById('iepModal').remove()" style="background:none; border:none; font-size:24px; cursor:pointer; color:#666;">&times;</button>
            </div>
            
            <div class="modal-body" style="padding:20px;">
                <div class="iep-word-model">
                    
                    <div class="no-print" style="margin-bottom:20px; text-align:left;">
                        <button onclick="window.print()" style="background:#2980b9; color:white; padding:8px 15px; border:none; border-radius:4px; cursor:pointer; font-family:inherit;">🖨️ طباعة الخطة</button>
                    </div>

                    <table class="word-table">
                        <tr>
                            <th width="15%">اسم الطالب</th><td width="35%">${student.name}</td>
                            <th width="15%">المادة</th><td width="35%">${student.subject || 'لغتي'}</td>
                        </tr>
                        <tr>
                            <th>الصف</th><td>${student.grade || '-'}</td>
                            <th>تاريخ الإعداد</th><td>${new Date().toLocaleDateString('ar-SA')}</td>
                        </tr>
                        <tr>
                            <th>نسبة الإنجاز</th>
                            <td colspan="3" style="font-weight:bold; color:${analysis.percent > 50 ? 'green' : 'red'}">${analysis.percent}%</td>
                        </tr>
                    </table>

                    <table class="word-table" style="margin-top:15px;">
                        <thead>
                            <tr>
                                <th>اليوم</th><th>الأحد</th><th>الاثنين</th><th>الثلاثاء</th><th>الأربعاء</th><th>الخميس</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="background:#eee; font-weight:bold;">الحصة</td>
                                <td><input type="number" placeholder="-"></td>
                                <td><input type="number" placeholder="-"></td>
                                <td><input type="number" placeholder="-"></td>
                                <td><input type="number" placeholder="-"></td>
                                <td><input type="number" placeholder="-"></td>
                            </tr>
                        </tbody>
                    </table>

                    <table class="word-table">
                        <tr>
                            <th width="50%" style="background:#d4edda; color:#155724;">جوانب القوة (ما اجتازه)</th>
                            <th width="50%" style="background:#f8d7da; color:#721c24;">جوانب الاحتياج (ما أخفق فيه)</th>
                        </tr>
                        <tr>
                            <td style="vertical-align:top; text-align:right;"><ul class="points-list" style="list-style:none; padding:0;">${analysis.strengthsHTML}</ul></td>
                            <td style="vertical-align:top; text-align:right;"><ul class="points-list" style="list-style:none; padding:0;">${analysis.needsHTML}</ul></td>
                        </tr>
                    </table>

                    <div class="long-term-goal-box" style="border:2px solid #333; padding:15px; margin-bottom:20px;">
                        <h4 style="margin-top:0;">الهدف بعيد المدى:</h4>
                        <p style="font-weight:bold; margin-bottom:0;">${analysis.longTermGoal}</p>
                    </div>

                    <hr style="border-top:2px dashed #ccc; margin:20px 0;">

                    <div id="goalsContainer">
                        ${analysis.goalsUnitsHTML}
                    </div>

                    <button onclick="addManualGoal()" class="no-print" style="background:#2c3e50; color:white; width:100%; padding:10px; border:none; margin-top:10px; cursor:pointer;">+ إضافة هدف يدوياً</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// دالة تحليل البيانات
function analyzeStudentData(studentId) {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    const assignedTest = studentTests.find(t => t.studentId === studentId && t.type === 'diagnostic');
    const originalTest = assignedTest ? allTests.find(t => t.id === assignedTest.testId) : null;

    let strengthsHTML = '';
    let needsHTML = '';
    let goalsUnitsHTML = '';
    let total = 0, passed = 0;

    if(originalTest && assignedTest && assignedTest.answers) {
        originalTest.questions.forEach(q => {
            total++;
            const ans = assignedTest.answers.find(a => a.questionId === q.id);
            const score = ans ? ans.score : 0;
            const passScore = q.passingScore || 5;

            if(score >= passScore) {
                passed++;
                strengthsHTML += `<li style="margin-bottom:5px;">✅ <input type="text" value="${q.text}" readonly style="border:none; width:90%;"></li>`;
            } else {
                needsHTML += `<li style="margin-bottom:5px;">❌ <input type="text" value="${q.text}" readonly style="border:none; width:90%;"></li>`;
                goalsUnitsHTML += createGoalUnitHTML(q.text);
            }
        });
    } else {
        strengthsHTML = '<li>لا يوجد بيانات اختبار تشخيصي</li>';
        needsHTML = '<li>يحتاج لإجراء اختبار</li>';
        goalsUnitsHTML = createGoalUnitHTML('هدف قصير المدى مقترح');
    }

    const percent = total === 0 ? 0 : Math.round((passed/total)*100);
    const longTermGoal = `أن يتقن الطالب المهارات الأساسية بنسبة إتقان 80%`;

    return { strengthsHTML, needsHTML, goalsUnitsHTML, percent, longTermGoal };
}

// دالة إنشاء وحدة الهدف
function createGoalUnitHTML(title) {
    return `
    <div class="goal-unit" style="border:2px solid #555; padding:15px; margin-bottom:20px; background:#fff; border-radius:8px;">
        <div style="background:#e3f2fd; padding:10px; margin-bottom:10px; border:1px solid #90caf9;">
            <button onclick="this.closest('.goal-unit').remove()" class="no-print" style="float:left; background:#c0392b; color:white; border:none; padding:3px 10px; cursor:pointer;">حذف</button>
            <strong>الهدف قصير المدى:</strong>
            <input type="text" value="${title}" style="width:70%; border:none; background:transparent; font-weight:bold;">
        </div>
        <table class="word-table" style="width:100%; border:1px solid #000; border-collapse:collapse;">
            <thead>
                <tr style="background:#eee;">
                    <th style="border:1px solid #000; padding:5px;">الهدف التدريسي</th>
                    <th style="border:1px solid #000; padding:5px;">الإجراءات والوسائل</th>
                    <th style="border:1px solid #000; padding:5px;">تاريخ التحقق</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border:1px solid #000;"><input type="text" style="width:100%; border:none; text-align:center;"></td>
                    <td style="border:1px solid #000;"><input type="text" style="width:100%; border:none; text-align:center;"></td>
                    <td style="border:1px solid #000;"><input type="date" style="width:100%; border:none; text-align:center;"></td>
                </tr>
                <tr>
                    <td style="border:1px solid #000;"><input type="text" style="width:100%; border:none; text-align:center;"></td>
                    <td style="border:1px solid #000;"><input type="text" style="width:100%; border:none; text-align:center;"></td>
                    <td style="border:1px solid #000;"><input type="date" style="width:100%; border:none; text-align:center;"></td>
                </tr>
            </tbody>
        </table>
    </div>`;
}

function addManualGoal() {
    const div = document.createElement('div');
    div.innerHTML = createGoalUnitHTML('');
    document.getElementById('goalsContainer').appendChild(div.firstElementChild);
}

// تصدير الدوال
window.loadMyStudents = loadMyStudents;
window.openIEPModal = openIEPModal;
window.addManualGoal = addManualGoal;
