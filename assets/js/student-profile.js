// ==============================================================
// ضع هذه الدالة في آخر ملف student-profile.js
// وظيفتها: قراءة اختبارات الطالب الحقيقية وتعبئة النموذج 9 للتعديل
// ==============================================================
function fillIEPData(studentId) {
    // 1. جلب البيانات الحقيقية فقط
    const allResults = JSON.parse(localStorage.getItem('testResults') || '[]');
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    
    // البحث عن أحدث اختبار تشخيصي للطالب
    const result = allResults
        .filter(r => r.studentId == studentId && r.type === 'diagnostic')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!result) return; // لا يوجد اختبار، لا نفعل شيئاً

    let strengths = [];
    let needs = [];
    let tableRows = [];

    // البحث في الأسئلة (سواء كانت محفوظة في الاختبار أو النتيجة)
    const answers = result.answers || [];
    
    // جلب تفاصيل الأسئلة من بنك الأسئلة (questionBanks أو tests)
    let allTests = [];
    ['questionBanks', 'tests', 'assessments'].forEach(k => {
        try { let d = JSON.parse(localStorage.getItem(k)); if(Array.isArray(d)) allTests.push(...d); } catch(e){}
    });
    const testRef = allTests.find(t => t.id == result.testId);
    const questionsRef = testRef ? (testRef.questions || testRef.items || []) : [];

    answers.forEach(ans => {
        // محاولة ربط السؤال بالهدف
        let q = questionsRef.find(x => x.id == ans.questionId);
        let goalId = (q && q.linkedGoalId) ? q.linkedGoalId : ans.linkedGoalId;

        if (goalId) {
            const obj = objectives.find(o => o.id == goalId);
            if (obj) {
                if (ans.isCorrect) {
                    if (!strengths.includes(obj.shortTermGoal)) strengths.push(obj.shortTermGoal);
                } else {
                    if (!needs.includes(obj.shortTermGoal)) {
                        needs.push(obj.shortTermGoal);
                        const subs = (obj.instructionalGoals && obj.instructionalGoals.length > 0) ? obj.instructionalGoals : [obj.shortTermGoal];
                        tableRows.push({ short: obj.shortTermGoal, subs: subs });
                    }
                }
            }
        }
    });

    // 2. التعبئة في الحقول (Inputs) لتكون قابلة للتعديل
    
    // نقاط القوة
    const sInput = document.getElementById('iep-strengths');
    if (sInput && !sInput.value) sInput.value = strengths.join('\n');

    // نقاط الاحتياج
    const nInput = document.getElementById('iep-needs');
    if (nInput && !nInput.value) nInput.value = needs.join('\n');

    // الجدول
    const tbody = document.getElementById('iep-goals-body');
    if (tbody && tableRows.length > 0) {
        tbody.innerHTML = ''; 
        tableRows.forEach(row => {
            row.subs.forEach(sub => {
                tbody.insertAdjacentHTML('beforeend', `
                    <tr>
                        <td><input type="text" class="form-control" value="${row.short}"></td>
                        <td><input type="text" class="form-control" value="${sub}"></td>
                        <td><input type="date" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                        <td><input type="text" class="form-control"></td>
                    </tr>
                `);
            });
        });
    }
}
