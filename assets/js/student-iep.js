// ============================================
// 📁 المسار: assets/js/student-iep.js
// الوصف: إدارة الخطة التربوية (واجهة الطالب) - نسخة مصححة التاريخ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    // التحقق من وجود دالة جلب المستخدم
    if (typeof getCurrentUser !== 'function') return;
    
    const currentStudent = getCurrentUser();
    
    // جلب بيانات الخطة من التخزين المحلي
    const studentIEP = getStudentIEP(currentStudent.id);
    
    if (!studentIEP) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>لا توجد خطة تربوية فردية</h3>
                <p>سيتم إنشاء الخطة التربوية الفردية بعد إكمال وتصحيح الاختبار التشخيصي.</p>
            </div>
        `;
        return;
    }
    
    // تنسيق تاريخ الإنشاء
    const createdDate = studentIEP.createdAt 
        ? new Date(studentIEP.createdAt).toLocaleDateString('ar-SA') 
        : '---';

    iepContainer.innerHTML = `
        <div class="iep-section">
            <h3>البيانات الأساسية</h3>
            <table class="student-info-table">
                <tr>
                    <th>اسم الطالب</th>
                    <td>${currentStudent.name}</td>
                    <th>تاريخ الإنشاء</th>
                    <td>${createdDate}</td>
                </tr>
                <tr>
                    <th>الصف</th>
                    <td>${studentIEP.grade || 'غير محدد'}</td>
                    <th>المادة</th>
                    <td>${studentIEP.subject || 'غير محدد'}</td>
                </tr>
                <tr>
                    <th>المعلم</th>
                    <td colspan="3">${studentIEP.teacherName || 'غير محدد'}</td>
                </tr>
            </table>
        </div>

        <div class="iep-section">
            <h3>نقاط القوة والاحتياج</h3>
            <table class="strengths-needs-table">
                <thead>
                    <tr>
                        <th style="width:50%">نقاط القوة</th>
                        <th style="width:50%">نقاط الاحتياج</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="strength-cell">
                            <ul>
                                ${studentIEP.strengths && studentIEP.strengths.length > 0 
                                    ? studentIEP.strengths.map(s => `<li>${s}</li>`).join('') 
                                    : '<li>لا توجد بيانات</li>'}
                            </ul>
                        </td>
                        <td class="needs-cell">
                            <ul>
                                ${studentIEP.needs && studentIEP.needs.length > 0 
                                    ? studentIEP.needs.map(n => `<li>${n}</li>`).join('') 
                                    : '<li>لا توجد بيانات</li>'}
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="iep-section">
            <h3>الهدف العام (البعيد)</h3>
            <div class="goal-section long-term-box">
                <p>${studentIEP.longTermGoal || 'لم يتم تحديد هدف بعيد المدى بعد.'}</p>
            </div>
        </div>

        <div class="iep-section">
            <h3>الأهداف التفصيلية</h3>
            <table class="goals-table">
                <thead>
                    <tr>
                        <th>الهدف قصير المدى</th>
                        <th>الهدف التدريسي</th>
                        <th>تاريخ التحقق</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderGoalsRows(studentIEP.goals)}
                </tbody>
            </table>
        </div>

        ${studentIEP.notes ? `
        <div class="iep-section">
            <h3>ملاحظات المعلم</h3>
            <div class="notes-section">
                <p>${studentIEP.notes}</p>
            </div>
        </div>
        ` : ''}
    `;
}

// دالة مساعدة لرسم صفوف الأهداف مع تنسيق التاريخ الصحيح
function renderGoalsRows(goals) {
    if (!goals || goals.length === 0) {
        return `<tr><td colspan="3" style="text-align: center; padding: 20px;">لا توجد أهداف مضافة حالياً</td></tr>`;
    }

    return goals.map(goal => {
        // التعامل مع اختلاف المسميات المحتمل
        const shortTerm = goal.shortTermGoal || goal.shortTerm || '---';
        const instructional = goal.instructionalGoal || goal.instructional || '---';
        
        // 🔴 التعديل هنا: تنسيق التاريخ ليظهر (يوم/شهر/سنة) فقط 🔴
        let dateContent = '<span class="badge badge-warning">جاري العمل</span>';
        
        if (goal.achievedDate) {
            const dateObj = new Date(goal.achievedDate);
            // التأكد من أن التاريخ صالح
            if (!isNaN(dateObj.getTime())) {
                const dateStr = dateObj.toLocaleDateString('ar-SA');
                dateContent = `<span class="badge badge-success">✔ ${dateStr}</span>`;
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

// دالة الطباعة (مع إصلاح التنسيق فيها أيضاً)
function printIEP() {
    const currentStudent = getCurrentUser();
    const studentIEP = getStudentIEP(currentStudent.id);

    if(!studentIEP) {
        alert('لا توجد خطة لطباعتها');
        return;
    }

    const createdDate = studentIEP.createdAt ? new Date(studentIEP.createdAt).toLocaleDateString('ar-SA') : '---';

    // نافذة الطباعة
    const printWindow = window.open('', '_blank');
    
    // تجهيز صفوف الأهداف للطباعة
    const goalsRows = (studentIEP.goals || []).map(goal => {
        const shortTerm = goal.shortTermGoal || goal.shortTerm || '';
        const instructional = goal.instructionalGoal || goal.instructional || '';
        
        let dateStr = '---';
        if (goal.achievedDate) {
            const d = new Date(goal.achievedDate);
            if (!isNaN(d.getTime())) dateStr = '✔ ' + d.toLocaleDateString('ar-SA');
        }

        return `
            <tr>
                <td>${shortTerm}</td>
                <td>${instructional}</td>
                <td>${dateStr}</td>
            </tr>
        `;
    }).join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>الخطة التربوية - ${currentStudent.name}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 20px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { margin: 0; color: #2c3e50; }
                h3 { background: #f8f9fa; padding: 10px; border-right: 5px solid #28a745; margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
                th { background-color: #f1f1f1; font-weight: bold; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>الخطة التربوية الفردية</h1>
                <p>الطالب: ${currentStudent.name}</p>
            </div>
            
            <h3>1. البيانات الأساسية</h3>
            <table>
                <tr>
                    <th>الصف</th><td>${studentIEP.grade || '-'}</td>
                    <th>المادة</th><td>${studentIEP.subject || '-'}</td>
                    <th>تاريخ الخطة</th><td>${createdDate}</td>
                </tr>
            </table>
            
            <h3>2. الأهداف التدريسية</h3>
            <table>
                <thead>
                    <tr>
                        <th width="30%">الهدف قصير المدى</th>
                        <th width="50%">الهدف التدريسي</th>
                        <th width="20%">تاريخ التحقق</th>
                    </tr>
                </thead>
                <tbody>
                    ${goalsRows || '<tr><td colspan="3">لا توجد أهداف</td></tr>'}
                </tbody>
            </table>
            
            <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
                تم استخراج التقرير بتاريخ ${new Date().toLocaleDateString('ar-SA')}
            </div>
            
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

// دالة مساعدة لجلب الخطة
function getStudentIEP(studentId) {
    // محاولة الجلب من التخزين المحلي (البيانات الحقيقية)
    const storedData = localStorage.getItem('studentIEPs');
    if (storedData) {
        try {
            const allPlans = JSON.parse(storedData);
            return allPlans.find(p => p.studentId === studentId);
        } catch (e) {
            console.error("خطأ في قراءة البيانات", e);
        }
    }
    return null;
}

// تصدير الدوال
window.printIEP = printIEP;
