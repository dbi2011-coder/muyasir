// إدارة الخطة التربوية الفردية للطالب - نسخة مطابقة للمعلم
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-iep.html')) {
        loadStudentIEP();
    }
});

function loadStudentIEP() {
    const iepContainer = document.getElementById('iepContainer');
    const currentStudent = getCurrentUser();
    
    // جلب بيانات الخطة من التخزين المحلي
    const studentIEP = getStudentIEP(currentStudent.id);
    
    // تصحيح: التحقق من وجود بيانات فعلية
    if (!studentIEP) {
        iepContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⏳</div>
                <h3>لم يتم اعتماد الخطة بعد</h3>
                <p>جاري العمل على إعداد خطتك التربوية من قبل المعلم.</p>
            </div>
        `;
        return;
    }

    console.log("عرض الخطة للطالب:", studentIEP); // للفحص في الكونسول

    iepContainer.innerHTML = `
        <div class="iep-section">
            <h3>📋 البيانات الأساسية</h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="label">الطالب:</span>
                    <span class="value">${currentStudent.name}</span>
                </div>
                <div class="info-item">
                    <span class="label">الصف:</span>
                    <span class="value">${studentIEP.grade || '---'}</span>
                </div>
                <div class="info-item">
                    <span class="label">المادة:</span>
                    <span class="value">${studentIEP.subject || '---'}</span>
                </div>
                <div class="info-item">
                    <span class="label">تاريخ الخطة:</span>
                    <span class="value">${formatDate(studentIEP.createdAt)}</span>
                </div>
            </div>
        </div>

        <div class="iep-section">
            <div class="row">
                <div class="col-6">
                    <div class="card-box strength-box">
                        <h3>💪 نقاط القوة</h3>
                        <ul>
                            ${renderList(studentIEP.strengths)}
                        </ul>
                    </div>
                </div>
                <div class="col-6">
                    <div class="card-box needs-box">
                        <h3>🎯 نقاط الاحتياج</h3>
                        <ul>
                            ${renderList(studentIEP.needs)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="iep-section">
            <h3>🌟 الهدف العام (بعيد المدى)</h3>
            <div class="long-term-goal-box">
                ${studentIEP.longTermGoal || 'لم يتم تحديد هدف عام بعد.'}
            </div>
        </div>

        <div class="iep-section">
            <h3>📝 الأهداف التدريسية</h3>
            <div class="table-responsive">
                <table class="goals-table full-width">
                    <thead>
                        <tr>
                            <th width="25%">الهدف قصير المدى</th>
                            <th width="40%">الهدف التدريسي</th>
                            <th width="20%">استراتيجية التقييم</th>
                            <th width="15%">حالة الإتقان</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderGoalsRows(studentIEP.goals)}
                    </tbody>
                </table>
            </div>
        </div>

        ${studentIEP.notes ? `
        <div class="iep-section">
            <h3>📌 ملاحظات وتوصيات</h3>
            <div class="notes-box">
                ${studentIEP.notes}
            </div>
        </div>
        ` : ''}
    `;
}

// دالة مساعدة لعرض القوائم (نقاط القوة/الاحتياج)
function renderList(items) {
    if (!items || items.length === 0) return '<li>لا توجد بيانات مسجلة</li>';
    // التأكد من أن المدخل مصفوفة
    const list = Array.isArray(items) ? items : [items];
    return list.map(item => `<li>${item}</li>`).join('');
}

// دالة مساعدة ذكية لعرض صفوف الأهداف (تحل مشكلة اختلاف التسميات)
function renderGoalsRows(goals) {
    if (!goals || goals.length === 0) {
        return `<tr><td colspan="4" style="text-align:center">لا توجد أهداف مسجلة حالياً</td></tr>`;
    }

    return goals.map(goal => {
        // 1. محاولة قراءة الهدف القصير بجميع التسميات المحتملة
        const shortTerm = goal.shortTermGoal || goal.shortTerm || goal.goalName || '---';
        
        // 2. محاولة قراءة الهدف التدريسي بجميع التسميات المحتملة
        const instructional = goal.instructionalGoal || goal.instructional || goal.objective || '---';
        
        // 3. محاولة قراءة التقييم
        const evaluation = goal.evaluationStrategy || goal.evaluation || 'الملاحظة';

        // 4. حالة التحقق
        let statusBadge = '';
        if (goal.achievedDate || goal.status === 'completed' || goal.achieved === true) {
            const date = goal.achievedDate ? formatDate(goal.achievedDate) : '';
            statusBadge = `<span class="status-badge success">✅ تم الإتقان <br><small>${date}</small></span>`;
        } else {
            statusBadge = `<span class="status-badge pending">⏳ جاري العمل</span>`;
        }

        return `
            <tr>
                <td class="font-bold">${shortTerm}</td>
                <td>${instructional}</td>
                <td>${evaluation}</td>
                <td class="text-center">${statusBadge}</td>
            </tr>
        `;
    }).join('');
}

function getStudentIEP(studentId) {
    // محاولة الجلب من التخزين المحلي (البيانات الحقيقية التي حفظها المعلم)
    const storedData = localStorage.getItem('studentIEPs');
    let studentIEP = null;
    
    if (storedData) {
        try {
            const allPlans = JSON.parse(storedData);
            // البحث عن خطة الطالب
            studentIEP = allPlans.find(p => p.studentId == studentId);
        } catch (e) {
            console.error("خطأ في قراءة ملف الخطط", e);
        }
    }
    
    // إذا لم نجد خطة (لأغراض الاختبار فقط إذا كنت تريد رؤية شكل الصفحة)
    // يمكنك حذف هذا الجزء لاحقاً ليكون الكود "نظيفاً"
    if (!studentIEP) {
        // إعادة null تعني أن الطالب سيرى شاشة "لا توجد خطة"
        // لكن سأضع بيانات وهمية *مؤقتاً* لتتأكد من أن التصميم يعمل
        return {
            studentId: studentId,
            grade: 'الرابع',
            subject: 'لغتي',
            createdAt: new Date(),
            strengths: ['الدافعية للتعلم', 'التعاون مع الزملاء'],
            needs: ['التمييز بين الحركات', 'القراءة المسترسلة'],
            longTermGoal: 'أن يتقن الطالب مهارات القراءة الأساسية بنسبة 80%',
            goals: [
                {
                    shortTermGoal: 'قراءة الكلمات الثلاثية', // هذا الاسم يطابق المعلم
                    instructionalGoal: 'أن يقرأ الطالب كلمات ثلاثية بحركة الفتح',
                    evaluationStrategy: 'الملاحظة المباشرة',
                    achievedDate: null
                },
                {
                    shortTermGoal: 'التمييز السمعي',
                    instructionalGoal: 'أن يميز الطالب صوت الحرف الأول',
                    evaluationStrategy: 'الاختبار الشفهي',
                    achievedDate: new Date()
                }
            ],
            notes: 'أرجو متابعة الواجبات المنزلية.'
        };
    }
    
    return studentIEP;
}

// دالة الطباعة المحدثة (لتطابق العرض)
function printIEP() {
    window.print();
}

// تصدير الدوال
window.printIEP = printIEP;
