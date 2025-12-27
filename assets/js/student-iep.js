// إدارة الخطة التربوية الفردية للطالب
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    const currentStudent = getCurrentUser();
    
    // في تطبيق حقيقي، سيتم جلب بيانات الخطة من قاعدة البيانات
    const studentIEP = getStudentIEP(currentStudent.id);
    
    if (!studentIEP) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h3>لا توجد خطة تربوية فردية</h3>
                <p>سيتم إنشاء الخطة التربوية الفردية بعد إكمال الاختبار التشخيصي</p>
            </div>
        `;
        return;
    }
    
    iepContainer.innerHTML = `
        <div class="iep-section">
            <h3>البيانات الأساسية</h3>
            <table class="student-info-table">
                <tr>
                    <td>اسم الطالب</td>
                    <td>${currentStudent.name}</td>
                </tr>
                <tr>
                    <td>الصف</td>
                    <td>${studentIEP.grade || 'غير محدد'}</td>
                </tr>
                <tr>
                    <td>المادة</td>
                    <td>${studentIEP.subject || 'غير محدد'}</td>
                </tr>
                <tr>
                    <td>المعلم</td>
                    <td>${studentIEP.teacherName || 'غير محدد'}</td>
                </tr>
                <tr>
                    <td>تاريخ الإنشاء</td>
                    <td>${formatDate(studentIEP.createdAt)}</td>
                </tr>
            </table>
        </div>

        <div class="iep-section">
            <h3>نقاط القوة والاحتياج</h3>
            <table class="strengths-needs-table">
                <thead>
                    <tr>
                        <th>نقاط القوة</th>
                        <th>نقاط الاحتياج</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <ul>
                                ${studentIEP.strengths ? studentIEP.strengths.map(strength => `<li>${strength}</li>`).join('') : '<li>لا توجد بيانات</li>'}
                            </ul>
                        </td>
                        <td>
                            <ul>
                                ${studentIEP.needs ? studentIEP.needs.map(need => `<li>${need}</li>`).join('') : '<li>لا توجد بيانات</li>'}
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="iep-section">
            <h3>الهدف البعيد</h3>
            <div class="goal-section">
                <p><strong>الهدف البعيد:</strong> ${studentIEP.longTermGoal || 'أن يتقن التلميذ مهارات القراءة والكتابة لذوي صعوبات التعلم حتى صفه الحالي وبنسبة لا تقل عن 80%'}</p>
            </div>
        </div>

        <div class="iep-section">
            <h3>الأهداف قصيرة المدى والتدريسية</h3>
            <table class="goals-table">
                <thead>
                    <tr>
                        <th>الهدف قصير المدى</th>
                        <th>الهدف التدريسي</th>
                        <th>تاريخ التحقق</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentIEP.goals ? studentIEP.goals.map(goal => `
                        <tr>
                            <td>${goal.shortTerm}</td>
                            <td>${goal.instructional}</td>
                            <td>${goal.achievedDate ? formatDate(goal.achievedDate) : 'لم يتحقق بعد'}</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td colspan="3" style="text-align: center;">لا توجد أهداف مضافة</td>
                        </tr>
                    `}
                </tbody>
            </table>
        </div>

        ${studentIEP.notes ? `
        <div class="iep-section">
            <h3>ملاحظات إضافية</h3>
            <div class="notes-section">
                <p>${studentIEP.notes}</p>
            </div>
        </div>
        ` : ''}
    `;
}

function printIEP() {
    showAuthNotification('جاري تحضير نسخة للطباعة...', 'info');
    
    setTimeout(() => {
        // في تطبيق حقيقي، سيتم إنشاء نسخة PDF من الخطة
        showAuthNotification('تم إنشاء نسخة للطباعة', 'success');
        
        // إنشاء نافذة طباعة
        const printWindow = window.open('', '_blank');
        const currentStudent = getCurrentUser();
        const studentIEP = getStudentIEP(currentStudent.id);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>الخطة التربوية الفردية - ${currentStudent.name}</title>
                <style>
                    body { 
                        font-family: 'Tajawal', sans-serif; 
                        margin: 20px;
                        line-height: 1.6;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                    }
                    th, td { 
                        border: 1px solid #333; 
                        padding: 10px; 
                        text-align: right;
                    }
                    th { 
                        background-color: #f0f0f0; 
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>الخطة التربوية الفردية</h1>
                    <h2>${currentStudent.name}</h2>
                    <p>تم إنشاء التقرير من موقع ميسر التعلم للأستاذ / صالح عبد العزيز عبدالله العجلان</p>
                </div>
                
                <h3>البيانات الأساسية</h3>
                <table>
                    <tr><td>اسم الطالب</td><td>${currentStudent.name}</td></tr>
                    <tr><td>الصف</td><td>${studentIEP?.grade || 'غير محدد'}</td></tr>
                    <tr><td>المادة</td><td>${studentIEP?.subject || 'غير محدد'}</td></tr>
                    <tr><td>تاريخ الإنشاء</td><td>${formatDate(studentIEP?.createdAt)}</td></tr>
                </table>
                
                ${studentIEP?.strengths || studentIEP?.needs ? `
                <h3>نقاط القوة والاحتياج</h3>
                <table>
                    <tr>
                        <th>نقاط القوة</th>
                        <th>نقاط الاحتياج</th>
                    </tr>
                    <tr>
                        <td>${studentIEP.strengths ? studentIEP.strengths.join('<br>') : 'لا توجد'}</td>
                        <td>${studentIEP.needs ? studentIEP.needs.join('<br>') : 'لا توجد'}</td>
                    </tr>
                </table>
                ` : ''}
                
                ${studentIEP?.goals ? `
                <h3>الأهداف</h3>
                <table>
                    <tr>
                        <th>الهدف قصير المدى</th>
                        <th>الهدف التدريسي</th>
                        <th>تاريخ التحقق</th>
                    </tr>
                    ${studentIEP.goals.map(goal => `
                        <tr>
                            <td>${goal.shortTerm}</td>
                            <td>${goal.instructional}</td>
                            <td>${goal.achievedDate ? formatDate(goal.achievedDate) : 'لم يتحقق'}</td>
                        </tr>
                    `).join('')}
                </table>
                ` : ''}
                
                <div class="footer">
                    <p>تم إنشاء التقرير في ${new Date().toLocaleDateString('ar-SA')}</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 1000);
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }, 1500);
}

function getStudentIEP(studentId) {
    const studentIEPs = JSON.parse(localStorage.getItem('studentIEPs') || '[]');
    let iep = studentIEPs.find(iep => iep.studentId === studentId);
    
    // إذا لم توجد خطة، إنشاء نموذج تجريبي
    if (!iep) {
        iep = {
            studentId: studentId,
            grade: 'الرابع الابتدائي',
            subject: 'لغتي',
            teacherName: 'أ/ صالح العجلان',
            createdAt: new Date().toISOString(),
            strengths: [
                'قدرة جيدة على الاستماع',
                'مهارات اجتماعية متطورة',
                'حب الاستكشاف والتعلم'
            ],
            needs: [
                'تحسين مهارات القراءة',
                'تنمية المفردات اللغوية',
                'تحسين السرعة في الكتابة'
            ],
            longTermGoal: 'أن يتقن التلميذ مهارات القراءة والكتابة لذوي صعوبات التعلم حتى صفه الحالي وبنسبة لا تقل عن 80%',
            goals: [
                {
                    shortTermGoal: 'تحسين مهارة القراءة',
                    instructionalGoal: 'قراءة كلمات مكونة من 3 أحرف',
                    achievedDate: null
                },
                {
                    shortTermGoal: 'تنمية المفردات',
                    instructionalGoal: 'تعرف 20 كلمة جديدة',
                    achievedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    shortTermGoal: 'تحسين الكتابة',
                    instructionalGoal: 'كتابة جملة مكونة من 3 كلمات',
                    achievedDate: null
                }
            ],
            notes: 'الطالب بحاجة إلى مزيد من التدريب على القراءة اليومية لمدة 15 دقيقة'
        };
        
        studentIEPs.push(iep);
        localStorage.setItem('studentIEPs', JSON.stringify(studentIEPs));
    }
    
    return iep;
}

// تصدير الدوال للاستخدام العالمي
window.printIEP = printIEP;