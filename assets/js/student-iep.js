// ============================================
// 📁 المسار: assets/js/student-iep.js
// الوصف: عرض الخطة المعتمدة (قراءة من الحفظ) + إصلاح تنسيق التاريخ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    
    // التحقق من المستخدم
    if (typeof getCurrentUser !== 'function') return;
    const currentStudent = getCurrentUser();
    
    // 1. جلب الخطة المحفوظة فعلياً (وليس إعادة حسابها)
    // هذا يضمن تطابق ما يراه الطالب مع ما حفظه المعلم
    const allPlans = JSON.parse(localStorage.getItem('studentIEPs') || '[]');
    const studentIEP = allPlans.find(p => p.studentId == currentStudent.id);
    
    // إذا لم توجد خطة محفوظة
    if (!studentIEP) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <h3>الخطة غير جاهزة</h3>
                <p>لم يقم المعلم باعتماد الخطة التربوية بعد.</p>
            </div>
        `;
        return;
    }
    
    // تنسيق تاريخ إنشاء الخطة
    const createdDate = studentIEP.createdAt 
        ? new Date(studentIEP.createdAt).toLocaleDateString('ar-SA') 
        : '---';

    // 2. عرض البيانات
    iepContainer.innerHTML = `
        <div class="iep-word-model">
            <h2 style="text-align: center; margin-bottom: 25px; color: #000; font-size: 24px;">الخطة التربوية الفردية</h2>
            
            <table class="word-table">
                <tr>
                    <th width="15%">اسم الطالب</th>
                    <td width="35%">${currentStudent.name}</td>
                    <th width="15%">المادة</th>
                    <td width="35%">${studentIEP.subject || 'عام'}</td>
                </tr>
                <tr>
                    <th>الصف</th>
                    <td>${studentIEP.grade || 'غير محدد'}</td>
                    <th>تاريخ الخطة</th>
                    <td>${createdDate}</td>
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
                        ${getScheduleCells(currentStudent.id)}
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
                            <ul>
                                ${renderList(studentIEP.strengths)}
                            </ul>
                        </td>
                        <td style="padding: 15px; background-color: #fff;">
                            <ul>
                                ${renderList(studentIEP.needs)}
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 30px;">
                <h4 style="margin-bottom: 10px; font-size:16px;">الأهداف التدريسية للخطة:</h4>
                <table class="word-table">
                    <thead>
                        <tr>
                            <th width="25%">الهدف قصير المدى</th>
                            <th width="55%">الهدف التدريسي</th>
                            <th width="20%">تاريخ التحقق</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderGoalsRows(studentIEP.goals)}
                    </tbody>
                </table>
            </div>
            
            <div class="footer-note" style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
                <p>تم اعتماد هذه الخطة بناءً على نتائج التشخيص والملاحظة | منصة ميسر التعلم</p>
            </div>
        </div>
    `;
}

// دالة مساعدة لجلب حصص الطالب
function getScheduleCells(studentId) {
    const teacherSchedule = JSON.parse(localStorage.getItem('teacherSchedule') || '[]');
    let cells = '';
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].forEach(dayKey => {
        const session = teacherSchedule.find(s => s.day === dayKey && s.students && s.students.includes(studentId));
        if (session) {
            cells += `<td style="background:#e8f5e9; text-align:center; font-weight:bold; color:#2e7d32;">حصة ${session.period || 1}</td>`;
        } else {
            cells += `<td></td>`;
        }
    });
    return cells;
}

// دالة عرض القوائم
function renderList(items) {
    if (!items || items.length === 0) return '<li>لا توجد بيانات</li>';
    return items.map(item => `<li>${item}</li>`).join('');
}

// دالة عرض الأهداف (مع إصلاح التاريخ)
function renderGoalsRows(goals) {
    if (!goals || goals.length === 0) {
        return `<tr><td colspan="3" style="text-align: center;">لا توجد أهداف مسجلة</td></tr>`;
    }

    return goals.map(goal => {
        const shortTerm = goal.shortTermGoal || goal.shortTerm || '---';
        const instructional = goal.instructionalGoal || goal.instructional || '---';
        
        // 🔴 الإصلاح: تنسيق التاريخ ليكون قصيراً (Date Only)
        let dateContent = '<span style="color:#999;">⏳ جاري العمل</span>';
        
        if (goal.achievedDate) {
            const d = new Date(goal.achievedDate);
            if (!isNaN(d.getTime())) {
                // هنا يتم تحويل التاريخ للصيغة العربية القصيرة
                const formattedDate = d.toLocaleDateString('ar-SA');
                dateContent = `<span style="color:#28a745; font-weight:bold;">✔ ${formattedDate}</span>`;
            }
        }

        return `
            <tr>
                <td><strong>${shortTerm}</strong></td>
                <td>${instructional}</td>
                <td>${dateContent}</td>
            </tr>
        `;
    }).join('');
}

// دالة الطباعة
function printIEP() {
    window.print();
}

// تصدير
window.printIEP = printIEP;
