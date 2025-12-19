// ===============================================
// منطق الخطة التربوية (IEP Logic)
// ===============================================

// 1. التوليد الآلي من نقاط الاحتياج
function generateIEPGoalsFromNeeds() {
    // محاكاة: جلب نقاط الاحتياج من النظام
    // في الواقع ستكون: const needs = currentStudent.diagnosticResults.needs;
    const needs = [
        { title: "التمييز بين الحروف المتشابهة", sub: ["التمييز بين ج ح خ", "التمييز بين ع غ"] },
        { title: "قراءة المدود", sub: ["المد بالألف", "المد بالواو", "المد بالياء"] }
    ];

    const container = document.getElementById('iepGoalsWrapper');
    container.innerHTML = ''; // مسح القديم

    needs.forEach((need, idx) => {
        addGoalRow(need.title, need.sub, idx);
    });
    
    // تحديث المستوى الفعلي في الترويسة
    document.getElementById('iepActualLevel').innerText = "لم يتقن 40% من المهارات الأساسية";
}

// 2. إضافة صف جديد للجدول
function addGoalRow(shortGoalText = "", instructionalGoals = [], index = Date.now()) {
    const container = document.getElementById('iepGoalsWrapper');
    
    // بناء قائمة الأهداف التدريسية
    let subGoalsHtml = instructionalGoals.map(g => 
        `<div class="sub-goal-item"><span>• ${g}</span></div>`
    ).join('');
    
    if(instructionalGoals.length === 0) subGoalsHtml = '<div class="text-muted small">أضف أهداف تدريسية...</div>';

    const rowHtml = `
    <div class="iep-goal-row" id="row-${index}">
        <div class="td-1">
            <input type="text" class="form-control mb-0" value="${shortGoalText}" placeholder="الهدف قصير المدى">
        </div>
        <div class="td-2">
            ${subGoalsHtml}
            <button class="btn btn-sm btn-link p-0" onclick="addSubGoalPrompt(${index})">+ إضافة هدف تدريسي</button>
        </div>
        <div class="td-3">
            <input type="date" class="form-control mb-0" style="font-size:0.8rem">
        </div>
        <div class="td-4">
            <button class="btn btn-sm text-secondary" title="تحريك للأعلى"><i class="fas fa-arrow-up"></i></button>
            <button class="btn btn-sm text-danger" onclick="document.getElementById('row-${index}').remove()"><i class="fas fa-trash"></i></button>
        </div>
    </div>
    <div class="p-2 bg-light text-center small text-muted border-bottom">
        عدد الأسابيع المتوقعة: ( 2 ) أسبوع
    </div>
    `;

    container.insertAdjacentHTML('beforeend', rowHtml);
}

// إضافة صف يدوي
function addManualGoalRow() {
    addGoalRow("", [], Date.now());
}

// إضافة هدف تدريسي فرعي
function addSubGoalPrompt(idx) {
    const val = prompt("اكتب الهدف التدريسي:");
    if(val) {
        // إعادة رسم الصف أو تحديث الـ HTML (تبسيطاً للكود هنا)
        alert("سيتم إضافة: " + val); 
        // في النسخة الكاملة سنقوم بتحديث الـ DOM مباشرة
    }
}
