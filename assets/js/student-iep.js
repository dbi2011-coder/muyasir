// إدارة الخطة التربوية الفردية للطالب - نسخة مصححة
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    const currentStudent = getCurrentUser();
    
    // جلب بيانات الخطة
    const studentIEP = getStudentIEP(currentStudent.id);
    
    // في حال عدم وجود خطة
    if (!studentIEP) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>لا توجد خطة تربوية فردية معتمدة بعد</h3>
                <p>سقوم معلمك بإنشاء الخطة بعد الاطلاع على نتائج الاختبار التشخيصي.</p>
            </div>
        `;
        return;
    }
    
    // طباعة البيانات في الكونسول للتأكد (لأغراض التصحيح)
    console.log("تم تحميل الخطة:", studentIEP);

    iepContainer.innerHTML = `
        <div class="iep-section">
            <h3>البيانات الأساسية</h3>
            <table class="student-info-table">
                <tr>
                    <th>اسم الطالب</th>
                    <td>${currentStudent.name}</td>
                    <th>تاريخ الإنشاء</th>
                    <td>${formatDate(studentIEP.createdAt)}</td>
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
                        <th style="width: 50%">نقاط القوة</th>
                        <th style="width: 50%">نقاط الاحتياج</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="strength-cell">
                            <ul>
                                ${studentIEP.strengths && studentIEP.strengths.length > 0 
                                    ? studentIEP.strengths.map(strength => `<li>${strength}</li>`).join('') 
                                    : '<li>لا توجد بيانات</li>'}
                            </ul>
                        </td>
                        <td class="needs-cell">
                            <ul>
                                ${studentIEP.needs && studentIEP.needs.length > 0 
                                    ? studentIEP.needs.map(need => `<li>${need}</li>`).join('') 
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
                        <th style="width: 30%">الهدف قصير المدى</th>
                        <th style="width: 50%">الهدف التدريسي</th>
                        <th style="width: 20%">الحالة / التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentIEP.goals && studentIEP.goals.length > 0 ? studentIEP.goals.map(goal => `
                        <tr>
                            <td><strong>${goal.shortTermGoal || goal.shortTerm || '---'}</strong></td>
                            <td>${goal.instructionalGoal || goal.instructional || '---'}</td>
                            <td>
                                ${goal.achievedDate 
                                    ? `<span class="badge badge-success">تحقق في ${formatDate(goal.achievedDate)}</span>` 
                                    : '<span class="badge badge-warning">جاري العمل</span>'}
                            </td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="3" style="text-align: center; padding: 20px;">لا توجد أهداف مضافة حالياً</td>
                        </tr>
                    `}
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

function printIEP() {
    const currentStudent = getCurrentUser();
    const studentIEP = getStudentIEP(currentStudent.id);

    if(!studentIEP) {
        alert('لا توجد خطة لطباعتها');
        return;
    }

    showAuthNotification('جاري تحضير نسخة للطباعة...', 'info');
    
    setTimeout(() => {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>الخطة التربوية الفردية - ${currentStudent.name}</title>
                <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Tajawal', sans-serif; margin: 0; padding: 20px; line-height: 1.6; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px; }
                    .header h1 { margin: 0; color: #2c3e50; }
                    .header p { color: #666; margin-top: 5px; }
                    
                    h3 { background-color: #f8f9fa; padding: 10px; border-right: 5px solid #4CAF50; margin-top: 30px; }
                    
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
                    th { background-color: #f1f8e9; color: #2e7d32; font-weight: bold; }
                    
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                    
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>الخطة التربوية الفردية</h1>
                    <h3>الطالب: ${currentStudent.name}</h3>
                    <p>منصة ميسر التعلم - إشراف الأستاذ: صالح العجلان</p>
                </div>
                
                <h3>1. البيانات الأساسية</h3>
                <table>
                    <tr>
                        <th>الصف</th><td>${studentIEP.grade || '-'}</td>
                        <th>المادة</th><td>${studentIEP.subject || '-'}</td>
                        <th>تاريخ الخطة</th><td>${formatDate(studentIEP.createdAt)}</td>
                    </tr>
                </table>
                
                <h3>2. مستوى الأداء الحالي</h3>
                <table>
                    <tr>
                        <th width="50%">نقاط القوة</th>
                        <th width="50%">الاحتياجات</th>
                    </tr>
                    <tr>
                        <td valign="top">${studentIEP.strengths ? studentIEP.strengths.map(s => `• ${s}`).join('<br>') : 'لا توجد'}</td>
                        <td valign="top">${studentIEP.needs ? studentIEP.needs.map(n => `• ${n}`).join('<br>') : 'لا توجد'}</td>
                    </tr>
                </table>

                 <h3>3. الهدف بعيد المدى</h3>
                 <div style="border: 1px solid #ddd; padding: 15px; background: #fff;">
                    ${studentIEP.longTermGoal || '---'}
                 </div>
                
                <h3>4. الأهداف التدريسية</h3>
                <table>
                    <thead>
                        <tr>
                            <th>الهدف قصير المدى</th>
                            <th>الهدف التدريسي</th>
                            <th>حالة التحقق</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${studentIEP.goals && studentIEP.goals.length > 0 ? studentIEP.goals.map(goal => `
                        <tr>
                            <td>${goal.shortTermGoal || goal.shortTerm || ''}</td>
                            <td>${goal.instructionalGoal || goal.instructional || ''}</td>
                            <td>${goal.achievedDate ? '✅ تم (' + formatDate(goal.achievedDate) + ')' : '⏳ جاري العمل'}</td>
                        </tr>
                    `).join('') : '<tr><td colspan="3">لا توجد أهداف</td></tr>'}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>تم استخراج هذا التقرير بتاريخ ${new Date().toLocaleDateString('ar-SA')}</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        // إغلاق النافذة تلقائياً بعد الطباعة (اختياري)
                        // setTimeout(() => window.close(), 1000); 
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }, 1000);
}

// دالة مساعدة لجلب الخطة (تحاكي قاعدة البيانات)
function getStudentIEP(studentId) {
    // 1. محاولة الجلب من التخزين المحلي (البيانات الحقيقية)
    const storedData = localStorage.getItem('studentIEPs');
    let studentIEPs = [];
    
    if (storedData) {
        try {
            studentIEPs = JSON.parse(storedData);
        } catch (e) {
            console.error("خطأ في قراءة البيانات", e);
        }
    }
    
    let iep = studentIEPs.find(iep => iep.studentId === studentId);
    
    // 2. إذا لم توجد خطة، ننشئ بيانات وهمية للعرض (لغرض التجربة فقط)
    // ملاحظة: في التطبيق النهائي، يفضل إرجاع null إذا لم يكن للمعلم خطة
    if (!iep) {
        console.log("جاري إنشاء بيانات وهمية للتجربة...");
        iep = {
            studentId: studentId,
            grade: 'الرابع الابتدائي',
            subject: 'لغتي',
            teacherName: 'أ/ صالح العجلان',
            createdAt: new Date().toISOString(),
            strengths: [
                'يستطيع تمييز الحروف الهجائية',
                'يتفاعل جيداً مع الأنشطة البصرية',
                'لديه دافعية للتعلم'
            ],
            needs: [
                'قراءة الكلمات الثلاثية بالحركات',
                'التمييز بين المدود',
                'تحسين الخط'
            ],
            longTermGoal: 'أن يتقن التلميذ مهارات القراءة والكتابة الأساسية بنسبة إتقان 80%',
            goals: [
                {
                    // لاحظ هنا استخدمنا الأسماء الصحيحة
                    shortTermGoal: 'قراءة كلمات ثلاثية',
                    instructionalGoal: 'أن يقرأ الطالب 10 كلمات ثلاثية بحركة الفتح',
                    achievedDate: null
                },
                {
                    shortTermGoal: 'التمييز بين المدود',
                    instructionalGoal: 'أن يستخرج الطالب حرف المد من 5 كلمات معروضة عليه',
                    achievedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // تحقق قبل 3 أيام
                }
            ],
            notes: 'يرجى متابعة الطالب في المنزل في قراءة القصة المصورة.'
        };
        
        // حفظ هذه البيانات الوهمية مؤقتاً لنراها
        // studentIEPs.push(iep);
        // localStorage.setItem('studentIEPs', JSON.stringify(studentIEPs));
    }
    
    return iep;
}

// تصدير الدوال للاستخدام
window.printIEP = printIEP;
