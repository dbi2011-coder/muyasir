// ============================================================
// 🧠 منطق الخطة التربوية الفردية (IEP Logic)
// ============================================================

// 1. محاكاة بيانات الاختبار التشخيصي (Mock Data)
// في الواقع، هذه البيانات تأتي من قاعدة البيانات
const mockDiagnosticResult = {
    studentName: "أحمد محمد العلي",
    grade: "الرابع الابتدائي",
    subject: "لغتي الجميلة",
    skills: [
        { id: 101, name: "قراءة الكلمات الثلاثية", status: "passed" },      // نقطة قوة
        { id: 102, name: "التمييز بين الهاء والتاء المربوطة", status: "failed", relatedGoal: "أن يميز الطالب بين الهاء والتاء المربوطة وصلاً ووقفاً بنسبة إتقان 80%" },
        { id: 103, name: "اللام الشمسية والقمرية", status: "failed", relatedGoal: "أن يقرأ الطالب كلمات تحتوي على لام شمسية وقمرية قراءة صحيحة" },
        { id: 104, name: "النسخ الصحيح", status: "passed" },                // نقطة قوة
        { id: 105, name: "المدود (الألف، الواو، الياء)", status: "failed", relatedGoal: "أن يستخرج الطالب أحرف المد من كلمات معطاة بشكل صحيح" }
    ]
};

// متغير لتخزين بيانات الخطة الحالية
let currentPlanData = {
    schedule: {}, // { "الأحد": [1, 3], "الثلاثاء": [2] }
    actualLevel: "",
    longTermGoal: "أن يتقن الطالب مهارات الحد الأدنى للصف الحالي بنسبة لا تقل عن 80%.",
    strengths: [],
    weaknesses: [],
    goals: [] // { id, text, date, sessions, eval }
};

// الدالة الرئيسية التي يتم استدعاؤها عند فتح التبويب
function loadIEPTab() {
    const contentDiv = document.getElementById('iepContent'); // تأكد أن هذا الـ ID موجود في HTML
    
    // محاولة جلب خطة محفوظة مسبقاً، أو توليد خطة جديدة من التشخيص
    const savedPlan = localStorage.getItem(`iep_plan_${currentStudentId}`);
    
    if (savedPlan) {
        currentPlanData = JSON.parse(savedPlan);
    } else {
        // 🚀 التعبئة التلقائية الذكية من النظام
        generatePlanFromDiagnosis();
    }

    renderIEPInterface(contentDiv);
}

// دالة توليد الخطة تلقائياً بناءً على نتائج التشخيص
function generatePlanFromDiagnosis() {
    // تصفير المصفوفات
    currentPlanData.strengths = [];
    currentPlanData.weaknesses = [];
    currentPlanData.goals = [];

    // تحليل المهارات
    mockDiagnosticResult.skills.forEach(skill => {
        if (skill.status === 'passed') {
            currentPlanData.strengths.push(skill.name);
        } else {
            currentPlanData.weaknesses.push(skill.name);
            
            // إضافة هدف تلقائي مرتبط بنقطة الضعف
            currentPlanData.goals.push({
                id: Date.now() + Math.random(), // ID فريد
                text: skill.relatedGoal,
                date: "", // التاريخ يعبأ لاحقاً كما طلبت
                sessions: "",
                evaluation: ""
            });
        }
    });
}

// دالة رسم الواجهة (Rendering)
function renderIEPInterface(container) {
    let html = `
    <div class="iep-container">
        
        <div class="iep-section">
            <div class="iep-header"><h3>📄 البيانات الأساسية</h3></div>
            <div class="p-3">
                <div class="row">
                    <div class="col-md-4"><strong>الطالب:</strong> ${mockDiagnosticResult.studentName}</div>
                    <div class="col-md-4"><strong>الصف:</strong> ${mockDiagnosticResult.grade}</div>
                    <div class="col-md-4">
                        <div class="form-group">
                            <label>المستوى الفعلي:</label>
                            <input type="text" class="form-control" value="${currentPlanData.actualLevel}" 
                            onchange="currentPlanData.actualLevel = this.value" placeholder="اكتب المستوى الفعلي هنا...">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="iep-section">
            <div class="iep-header"><h3>📅 الجدول الدراسي (حدد الحصص)</h3></div>
            <table class="schedule-grid">
                <thead>
                    <tr>
                        <th>اليوم</th>
                        ${[1,2,3,4,5,6,7].map(n => `<th>${n}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].map(day => `
                        <tr>
                            <td><strong>${day}</strong></td>
                            ${[1,2,3,4,5,6,7].map(p => `
                                <td>
                                    <input type="checkbox" class="check-box-input" 
                                    ${isChecked(day, p) ? 'checked' : ''} 
                                    onchange="toggleSchedule('${day}', ${p})">
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="iep-section">
            <div class="iep-header"><h3>📊 تحليل الأداء (من الاختبار التشخيصي)</h3></div>
            <div class="analysis-grid">
                <div class="analysis-box">
                    <h5 class="text-success">نقاط القوة</h5>
                    <ul class="analysis-list">
                        ${currentPlanData.strengths.map(s => `<li>✅ ${s}</li>`).join('')}
                        </ul>
                </div>
                <div class="analysis-box">
                    <h5 class="text-danger">نقاط الاحتياج</h5>
                    <ul class="analysis-list">
                        ${currentPlanData.weaknesses.map(w => `<li>⚠️ ${w}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="iep-section">
            <div class="iep-header">
                <h3>🎯 الأهداف التدريسية</h3>
            </div>
            <div class="p-3">
                <label><strong>الهدف بعيد المدى:</strong></label>
                <textarea class="form-control mb-3" rows="2" 
                onchange="currentPlanData.longTermGoal = this.value">${currentPlanData.longTermGoal}</textarea>
                
                <table class="goals-table">
                    <thead>
                        <tr>
                            <th width="5%">م</th>
                            <th width="50%">الهدف قصير المدى</th>
                            <th width="15%">تاريخ التحقق</th>
                            <th width="10%">عدد الحصص</th>
                            <th width="10%">التقييم</th>
                            <th width="10%">تحكم</th>
                        </tr>
                    </thead>
                    <tbody id="goalsTableBody">
                        ${renderGoalsRows()}
                    </tbody>
                </table>
                <button class="btn-add-goal" onclick="addNewGoal()">+ إضافة هدف جديد</button>
            </div>
        </div>

        <button class="save-fab" onclick="savePlan()" title="حفظ الخطة">💾</button>
    </div>
    `;
    
    container.innerHTML = html;
}

// دالة مساعدة لرسم صفوف الأهداف
function renderGoalsRows() {
    if (currentPlanData.goals.length === 0) return '<tr><td colspan="6" class="text-center">لا توجد أهداف حالياً</td></tr>';

    return currentPlanData.goals.map((goal, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>
                <input type="text" class="goal-input" value="${goal.text}" 
                onchange="updateGoal(${index}, 'text', this.value)">
            </td>
            <td>
                <input type="date" class="goal-input" value="${goal.date}" 
                onchange="updateGoal(${index}, 'date', this.value)">
            </td>
            <td>
                <input type="number" class="goal-input" value="${goal.sessions}" 
                onchange="updateGoal(${index}, 'sessions', this.value)">
            </td>
            <td>
                <input type="text" class="goal-input" value="${goal.evaluation}" 
                onchange="updateGoal(${index}, 'evaluation', this.value)">
            </td>
            <td>
                <div style="display:flex; justify-content:center;">
                    ${index > 0 ? `<button class="action-btn btn-up" onclick="reorderGoal(${index}, -1)" title="تحريك لأعلى">⬆️</button>` : ''}
                    ${index < currentPlanData.goals.length - 1 ? `<button class="action-btn btn-down" onclick="reorderGoal(${index}, 1)" title="تحريك للأسفل">⬇️</button>` : ''}
                    <button class="action-btn btn-delete" onclick="deleteGoal(${index})" title="حذف">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ===================== دوال التفاعل (Actions) =====================

// 1. إدارة الجدول الدراسي
function isChecked(day, period) {
    return currentPlanData.schedule[day] && currentPlanData.schedule[day].includes(period);
}

function toggleSchedule(day, period) {
    if (!currentPlanData.schedule[day]) currentPlanData.schedule[day] = [];
    
    const idx = currentPlanData.schedule[day].indexOf(period);
    if (idx > -1) {
        currentPlanData.schedule[day].splice(idx, 1); // إزالة
    } else {
        currentPlanData.schedule[day].push(period); // إضافة
    }
}

// 2. إدارة الأهداف (تعديل، إضافة، حذف، ترتيب)
function updateGoal(index, field, value) {
    currentPlanData.goals[index][field] = value;
}

function addNewGoal() {
    currentPlanData.goals.push({
        id: Date.now(),
        text: "هدف جديد...",
        date: "",
        sessions: "",
        evaluation: ""
    });
    refreshGoalsTable();
}

function deleteGoal(index) {
    if(confirm('هل أنت متأكد من حذف هذا الهدف؟')) {
        currentPlanData.goals.splice(index, 1);
        refreshGoalsTable();
    }
}

// إعادة الترتيب: direction -1 للأعلى، 1 للأسفل
function reorderGoal(index, direction) {
    const targetIndex = index + direction;
    // تبديل العناصر في المصفوفة
    [currentPlanData.goals[index], currentPlanData.goals[targetIndex]] = 
    [currentPlanData.goals[targetIndex], currentPlanData.goals[index]];
    
    refreshGoalsTable();
}

// إعادة رسم جدول الأهداف فقط (لتجنب إعادة تحميل الصفحة كاملة)
function refreshGoalsTable() {
    document.getElementById('goalsTableBody').innerHTML = renderGoalsRows();
}

// 3. الحفظ
function savePlan() {
    // هنا يتم الحفظ في LocalStorage مؤقتاً
    // ويمكن لاحقاً إرسال البيانات للسيرفر عبر API
    localStorage.setItem(`iep_plan_${currentStudentId}`, JSON.stringify(currentPlanData));
    alert('✅ تم حفظ الخطة التربوية بنجاح!');
    console.log("Saved Data:", currentPlanData);
}
