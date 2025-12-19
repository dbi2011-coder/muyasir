// ============================================
// 📁 المسار: assets/js/student-profile.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadStudentData();
});

// بيانات وهمية للمحاكاة (يجب استبدالها ببيانات حقيقية من localStorage)
let currentStudent = { id: 1, name: "نايف محمد", grade: "الأول الابتدائي - لغتي", attendanceDays: [0, 1, 2, 3, 4] };
let currentIEP = [];

// تحميل بيانات الطالب الأساسية
function loadStudentData() {
    // 1. تعبئة القائمة الجانبية
    document.getElementById('sidebarStudentName').textContent = currentStudent.name;
    document.getElementById('sidebarStudentGrade').textContent = currentStudent.grade;
    document.getElementById('avatarInitials').textContent = currentStudent.name.charAt(0);

    // 2. تعبئة ترويسة الخطة
    document.getElementById('contentStudentName').textContent = currentStudent.name;
    document.getElementById('contentStudentGrade').textContent = currentStudent.grade;

    // 3. رسم مربعات أيام الحضور
    renderAttendanceDays();

    // 4. محاولة تحميل خطة محفوظة، أو ترك المكان فارغاً للتوليد
    loadSavedIEP();
}

// رسم Checkboxes لأيام الحضور
function renderAttendanceDays() {
    const container = document.getElementById('attendanceDays');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    container.innerHTML = days.map((day, index) => `
        <label class="day-check-label">
            <input type="checkbox" value="${index}" 
                ${currentStudent.attendanceDays.includes(index) ? 'checked' : ''} 
                onchange="updateAttendanceDays()"> ${day}
        </label>
    `).join('');
}

function updateAttendanceDays() {
    const checkboxes = document.querySelectorAll('#attendanceDays input:checked');
    currentStudent.attendanceDays = Array.from(checkboxes).map(cb => parseInt(cb.value));
    // هنا يجب حفظ التعديل في قاعدة البيانات
    console.log("تم تحديث أيام الحضور:", currentStudent.attendanceDays);
}

// ==========================================
// 🧠 المحرك الذكي: توليد الخطة من التشخيص
// ==========================================

function generateIEPFromDiagnostic() {
    if (!confirm("هل أنت متأكد؟ سيقوم النظام بجلب نتائج آخر اختبار تشخيصي وبناء الخطة آلياً.")) return;

    // محاكاة نتائج التشخيص (نقاط قوة ونقاط احتياج)
    // في الواقع: Fetch diagnostic results from DB
    const diagnosticResults = {
        strengths: [
            "التمييز بين الحروف المتشابهة رسماً",
            "قراءة الحروف بأصواتها القصيرة"
        ],
        needs: [ // هذه تتحول لأهداف
            { 
                id: 101, 
                goal: "أن يقرأ الطالب الكلمات التي تحتوي على مدود", 
                subGoals: ["مد بالألف", "مد بالواو", "مد بالياء"] 
            },
            { 
                id: 102, 
                goal: "أن يكتب الطالب كلمات ثلاثية بحركة الفتح", 
                subGoals: ["كتابة كلمات منفصلة", "كتابة كلمات متصلة"] 
            },
            {
                id: 103,
                goal: "أن يميز الطالب بين التاء المربوطة والمفتوحة",
                subGoals: ["التمييز نطقاً", "التمييز كتابة"]
            }
        ]
    };

    // 1. تعبئة نقاط القوة (للعرض فقط)
    const sList = document.getElementById('strengthsList');
    sList.innerHTML = diagnosticResults.strengths.map(s => `<li>${s}</li>`).join('');

    // 2. تعبئة نقاط الاحتياج (للعرض فقط)
    const nList = document.getElementById('needsList');
    nList.innerHTML = diagnosticResults.needs.map(n => `<li>${n.goal}</li>`).join('');

    // 3. تحويل نقاط الاحتياج إلى خطة (IEP Goals)
    currentIEP = diagnosticResults.needs.map((need, index) => ({
        id: Date.now() + index,
        title: need.goal,
        instructionalGoals: need.subGoals,
        startDate: "", // يحددها المعلم
        checkDate: ""  // يحددها المعلم
    }));

    renderIEPGoals();
    alert("تم توليد الخطة بنجاح بناءً على نقاط الاحتياج!");
}

// رسم بطاقات الأهداف
function renderIEPGoals() {
    const container = document.getElementById('iepGoalsContainer');
    container.innerHTML = '';

    currentIEP.forEach((goal, index) => {
        const html = `
        <div class="iep-goal-card" draggable="true" data-index="${index}">
            <div class="goal-header">
                <div class="goal-title">
                    <i class="fas fa-grip-vertical drag-handle"></i>
                    الهدف قصير المدى (${index + 1}): ${goal.title}
                </div>
                <button class="btn btn-sm text-danger" onclick="deleteGoal(${index})"><i class="fas fa-trash"></i></button>
            </div>
            
            <div class="goal-details">
                <strong>الأهداف التدريسية:</strong>
                <ul class="mb-2 pl-3" style="list-style: inside disc; margin-top:5px;">
                    ${goal.instructionalGoals.map(g => `<li>${g}</li>`).join('')}
                </ul>
                
                <div class="goal-dates">
                    <div class="date-input-group">
                        <label>تاريخ البداية:</label>
                        <input type="date" value="${goal.startDate}" onchange="updateGoalDate(${index}, 'startDate', this.value)">
                    </div>
                    <div class="date-input-group">
                        <label>تاريخ التحقق:</label>
                        <input type="date" value="${goal.checkDate}" onchange="updateGoalDate(${index}, 'checkDate', this.value)">
                    </div>
                </div>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });

    setupDragAndDrop();
}

function deleteGoal(index) {
    if(confirm("حذف هذا الهدف من الخطة؟")) {
        currentIEP.splice(index, 1);
        renderIEPGoals();
    }
}

function addManualGoal() {
    const title = prompt("اكتب نص الهدف قصير المدى الجديد:");
    if(title) {
        currentIEP.push({
            id: Date.now(),
            title: title,
            instructionalGoals: ["هدف تدريسي 1 (اضغط للتعديل)"],
            startDate: "",
            checkDate: ""
        });
        renderIEPGoals();
    }
}

// ==========================================
// ✋ منطق السحب والإفلات (Drag & Drop)
// ==========================================
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.iep-goal-card');
    const container = document.getElementById('iepGoalsContainer');

    cards.forEach(card => {
        card.addEventListener('dragstart', () => {
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            // تحديث المصفوفة بناءً على الترتيب الجديد في DOM
            updateArrayOrder();
        });
    });

    container.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            container.appendChild(draggable);
        } else {
            container.insertBefore(draggable, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.iep-goal-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateArrayOrder() {
    const newOrder = [];
    const cardElements = document.querySelectorAll('.iep-goal-card');
    cardElements.forEach(card => {
        const index = card.getAttribute('data-index');
        newOrder.push(currentIEP[index]); // ملاحظة: هذا منطق مبسط، الأفضل استخدام IDs
    });
    // إعادة رسم لضبط الـ Indexes
    // currentIEP = newOrder; // (يحتاج ضبط أدق في الإنتاج الفعلي)
}

// حفظ واسترجاع (Mock)
function loadSavedIEP() {
    // محاولة استرجاع خطة سابقة
    const saved = localStorage.getItem('iep_student_1');
    if(saved) {
        currentIEP = JSON.parse(saved);
        renderIEPGoals();
    }
}
