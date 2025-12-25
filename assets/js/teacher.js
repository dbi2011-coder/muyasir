// ============================================
// 📁 المسار: assets/js/teacher.js
// الوصف: إدارة لوحة تحكم المعلم + النموذج 9 الذكي
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // التحقق من صلاحية الدخول
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'teacher') {
        window.location.href = '../../index.html';
        return;
    }

    // عرض اسم المعلم
    document.getElementById('teacherName').textContent = user.name;
    
    // تحميل الطلاب
    loadMyStudents();
});

// دالة تحميل طلاب المعلم
function loadMyStudents() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');

    // تصفية الطلاب المرتبطين بالمعلم (عبر الجدول أو الشعبة)
    // للتبسيط سنعرض كل الطلاب كمثال، أو يمكنك تصفيتهم حسب grade
    const myStudents = allStudents; 

    const studentsList = document.getElementById('studentsList'); // تأكد من وجود هذا العنصر في HTML
    if(studentsList) {
        studentsList.innerHTML = '';
        myStudents.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.name}</td>
                <td>${student.grade}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="openIEPModal(${student.id})">
                        <i class="fas fa-file-alt"></i> نموذج 9
                    </button>
                </td>
            `;
            studentsList.appendChild(tr);
        });
    }
}

// ================================================================
// 🟢 كود النموذج 9 الذكي (مدمج هنا ليعمل 100%)
// ================================================================

function openIEPModal(studentId) {
    // 1. جلب بيانات الطالب
    const allStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const student = allStudents.find(s => s.id === studentId);
    
    if (!student) {
        alert('بيانات الطالب غير موجودة');
        return;
    }

    // 2. إنشاء النافذة المنبثقة (Modal) ديناميكياً
    // نزيل أي مودال قديم أولاً
    const oldModal = document.getElementById('iepModal');
    if (oldModal) oldModal.remove();

    const modal = document.createElement('div');
    modal.id = 'iepModal';
    modal.className = 'modal show'; // كلاس show لإظهاره
    modal.style.display = 'block';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '1000';
    modal.style.overflowY = 'auto';

    // 3. تحليل البيانات الذكية (نقاط القوة والاحتياج)
    const analysis = analyzeStudentData(studentId);

    // 4. محتوى النموذج
    modal.innerHTML = `
        <div class="modal-content" style="background:#fff; margin:2% auto; padding:20px; width:90%; max-width:1000px; border-radius:8px; position:relative;">
            <span onclick="document.getElementById('iepModal').remove()" style="position:absolute; top:10px; left:15px; font-size:25px; cursor:pointer; color:red;">&times;</span>
            
            <div class="iep-word-model">
                <div class="no-print" style="margin-bottom:15px;">
                    <button onclick="window.print()" style="background:#2980b9; color:white; padding:10px 20px; border:none; cursor:pointer; border-radius:4px;">🖨️ طباعة الخطة</button>
                    <button onclick="document.getElementById('iepModal').remove()" style="background:#7f8c8d; color:white; padding:10px 20px; border:none; cursor:pointer; border-radius:4px;">إغلاق</button>
                </div>

                <h2 style="text-align:center; margin-bottom:20px;">نموذج (9) الخطة التربوية الفردية</h2>

                <table class="word-table">
                    <tr>
                        <th width="15%">اسم الطالب</th><td width="35%">${student.name}</td>
                        <th width="15%">المادة</th><td width="35%">${student.subject || 'لغتي'}</td>
                    </tr>
                    <tr>
                        <th>الصف</th><td>${student.grade}</td>
                        <th>التاريخ</th><td>${new Date().toLocaleDateString('ar-SA')}</td>
                    </tr>
                    <tr>
                        <th>نسبة الإنجاز</th>
                        <td colspan="3" style="font-weight:bold; color:${analysis.percent > 50 ? 'green' : 'red'}">${analysis.percent}%</td>
                    </tr>
                </table>

                <table class="word-table">
                    <tr>
                        <th width="50%" style="background:#d4edda">جوانب القوة</th>
                        <th width="50%" style="background:#f8d7da">جوانب الاحتياج</th>
                    </tr>
                    <tr>
                        <td style="vertical-align:top"><ul class="points-list">${analysis.strengthsHTML}</ul></td>
                        <td style="vertical-align:top"><ul class="points-list">${analysis.needsHTML}</ul></td>
                    </tr>
                </table>

                <div class="long-term-goal-box">
                    <h4>الهدف بعيد المدى:</h4>
                    <p style="font-weight:bold;">${analysis.longTermGoal}</p>
                </div>

                <div id="goalsContainer">
                    ${analysis.goalsUnitsHTML}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// دالة التحليل المنطقي (المحرك الذكي)
function analyzeStudentData(studentId) {
    const allTests = JSON.parse(localStorage.getItem('tests') || '[]');
    const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
    
    // البحث عن اختبار تشخيصي للطالب
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
                strengthsHTML += `<li class="point-item">✅ ${q.text}</li>`;
            } else {
                needsHTML += `<li class="point-item">❌ ${q.text}</li>`;
                goalsUnitsHTML += createGoalUnitHTML(q.text);
            }
        });
    } else {
        // بيانات افتراضية إذا لم يكن هناك اختبار
        strengthsHTML = '<li class="point-item">لم يتم رصد نقاط قوة بعد</li>';
        needsHTML = '<li class="point-item">يحتاج لإجراء تشخيص</li>';
        goalsUnitsHTML = createGoalUnitHTML('هدف مقترح: إتقان الحروف الهجائية');
    }

    const percent = total === 0 ? 0 : Math.round((passed/total)*100);
    const longTermGoal = `أن يتقن الطالب المهارات الأساسية بنسبة 80%`;

    return { strengthsHTML, needsHTML, goalsUnitsHTML, percent, longTermGoal };
}

// دالة مساعدة لرسم وحدة الهدف
function createGoalUnitHTML(title) {
    return `
    <div class="goal-unit">
        <div class="short-goal-header">
            <label>الهدف قصير المدى:</label>
            <input type="text" value="${title}" style="width:70%; font-weight:bold;">
        </div>
        <table class="word-table">
            <thead><tr><th>الهدف التدريسي</th><th>الإجراءات</th><th>التقييم</th></tr></thead>
            <tbody>
                <tr><td><input type="text"></td><td><input type="text"></td><td><input type="date"></td></tr>
                <tr><td><input type="text"></td><td><input type="text"></td><td><input type="date"></td></tr>
            </tbody>
        </table>
    </div>`;
}

// تصدير الدالة لتكون متاحة
window.openIEPModal = openIEPModal;
