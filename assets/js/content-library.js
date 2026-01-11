// ============================================
// 📁 المسار: assets/js/content-library.js (محدث لإصلاح الربط)
// ============================================

// ... [الجزء الأول من الملف: loadContentLibrary, loadTests, loadLessons, etc. يبقى كما هو] ...

// 🛠️ دالة عرض نافذة الربط (محدثة لدعم الواجبات بدقة)
function showLinkModal(type, id) {
    document.getElementById('linkTargetId').value = id;
    document.getElementById('linkTargetType').value = type;
    
    const container = document.getElementById('linkContentBody');
    const instruction = document.getElementById('linkInstructionText');
    container.innerHTML = '';

    const objectives = getAllObjectives();
    if(objectives.length === 0) {
        container.innerHTML = '<div class="text-center text-danger p-3">لا توجد أهداف مضافة. الرجاء إضافة أهداف أولاً.</div>';
        document.getElementById('linkContentModal').classList.add('show');
        return;
    }

    if (type === 'test') {
        // [كود ربط الاختبارات يبقى كما هو]
        instruction.textContent = 'قم بربط كل سؤال بالهدف قصير المدى الذي يقيسه.';
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const test = tests.find(t => t.id === id);
        if(!test || !test.questions) return;
        const relevantObjs = objectives.filter(o => o.subject === test.subject);
        let optionsHtml = '<option value="">-- اختر الهدف --</option>';
        relevantObjs.forEach(o => { optionsHtml += `<option value="${o.id}">${o.shortTermGoal}</option>`; });
        test.questions.forEach((q, idx) => {
            const row = document.createElement('div');
            row.className = 'linking-row';
            row.innerHTML = `<div class="linking-question-text"><strong>س${idx+1}:</strong> ${q.text || 'سؤال بدون نص'}</div><select class="form-control linking-select question-link-select" data-question-id="${q.id}">${optionsHtml}</select>`;
            if(q.linkedGoalId) row.querySelector('select').value = q.linkedGoalId;
            container.appendChild(row);
        });
    } else {
        // 🔥 كود ربط الدروس والواجبات (المصحح) 🔥
        instruction.textContent = 'قم باختيار هدف تدريسي واحد لربط هذا المحتوى به.';
        
        let currentItem;
        if (type === 'lesson') {
            currentItem = JSON.parse(localStorage.getItem('lessons')).find(x => x.id === id);
        } else if (type === 'homework') { // تأكدنا من النوع
            currentItem = JSON.parse(localStorage.getItem('assignments')).find(x => x.id === id);
        }

        const relevantObjs = objectives.filter(o => o.subject === currentItem.subject);
        
        let selectHtml = '<select class="form-control" id="singleInstructionalLink"><option value="">-- غير مرتبط --</option>';
        relevantObjs.forEach(o => {
            if(o.instructionalGoals && o.instructionalGoals.length > 0) {
                selectHtml += `<optgroup label="${o.shortTermGoal}">`;
                o.instructionalGoals.forEach(ig => {
                    selectHtml += `<option value="${ig}">${ig}</option>`;
                });
                selectHtml += `</optgroup>`;
            }
        });
        selectHtml += '</select>';
        
        container.innerHTML = `<div class="p-3"><label>الهدف التدريسي:</label>${selectHtml}</div>`;
        
        // تعيين القيمة المحفوظة مسبقاً
        if(currentItem.linkedInstructionalGoal) {
            setTimeout(() => {
                const el = document.getElementById('singleInstructionalLink');
                if(el) el.value = currentItem.linkedInstructionalGoal;
            }, 0);
        }
    }
    document.getElementById('linkContentModal').classList.add('show');
}

// 🛠️ دالة حفظ الربط (محدثة لحفظ الواجبات في 'assignments')
function saveContentLinks() {
    const id = parseInt(document.getElementById('linkTargetId').value);
    const type = document.getElementById('linkTargetType').value;

    if (type === 'test') {
        // [كود حفظ الاختبارات]
        const tests = JSON.parse(localStorage.getItem('tests') || '[]');
        const testIndex = tests.findIndex(t => t.id === id);
        if(testIndex !== -1) {
            const selects = document.querySelectorAll('.question-link-select');
            selects.forEach(sel => {
                const qId = parseFloat(sel.getAttribute('data-question-id'));
                const goalId = sel.value;
                const q = tests[testIndex].questions.find(qx => qx.id === qId || Math.abs(qx.id - qId) < 0.0001);
                if(q) q.linkedGoalId = goalId ? parseInt(goalId) : null;
            });
            localStorage.setItem('tests', JSON.stringify(tests));
            loadTests();
        }
    } else {
        // 🔥 كود حفظ الدروس والواجبات 🔥
        // تحديد المفتاح الصحيح بناءً على النوع
        const key = (type === 'lesson') ? 'lessons' : 'assignments';
        
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        const idx = arr.findIndex(x => x.id === id);
        
        if(idx !== -1) {
            arr[idx].linkedInstructionalGoal = document.getElementById('singleInstructionalLink').value || null;
            localStorage.setItem(key, JSON.stringify(arr));
            
            // إعادة تحميل الشبكة المناسبة
            if(type === 'lesson') loadLessons();
            else loadHomeworks();
        }
    }
    document.getElementById('linkContentModal').classList.remove('show');
    alert('تم حفظ الارتباطات بنجاح');
}

// ... [بقية الملف يبقى كما هو] ...
