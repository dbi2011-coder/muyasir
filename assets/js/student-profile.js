// ==========================================
// student-profile.js - معالج ملف الطالب والخطة
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // تشغيل الصفحة الافتراضية
    initPage();
});

// 1. التنقل بين التبويبات (Tabs)
function switchSection(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    // إظهار القسم المطلوب
    const targetSection = document.getElementById('section-' + sectionId);
    const targetLink = document.getElementById('link-' + sectionId);
    
    if (targetSection) targetSection.classList.add('active');
    if (targetLink) targetLink.classList.add('active');

    // **مهم جداً:** إذا فتحنا الخطة التربوية، قم بتحميل البيانات فوراً
    if (sectionId === 'iep') {
        generateIEP();
    }
}

// 2. دالة توليد الخطة التربوية (المحرك الذكي)
function generateIEP() {
    console.log("جاري بناء الخطة التربوية...");

    // === محاكاة بيانات الاختبار (هذه البيانات تأتي لاحقاً من قاعدة البيانات الحقيقية) ===
    // تخيل أن هذا هو ناتج الاختبار الذي قام به الطالب
    const mockTestResult = {
        studentName: "نايف عبدالله",
        grade: "الصف الثاني",
        subject: "لغتي",
        questions: [
            {
                id: 1,
                text: "أي الكلمات تنتهي بتاء مربوطة؟",
                userCorrect: false, // أجاب خطأ -> يذهب للاحتياج
                goalShort: "التمييز بين التاء المربوطة والمفتوحة",
                subGoals: [
                    "أن يستخرج الكلمات المختومة بتاء مربوطة من نص.",
                    "أن ينطق التاء المربوطة هاءً عند الوقف.",
                    "أن يكتب كلمات تنتهي بتاء مربوطة إملاءً."
                ]
            },
            {
                id: 2,
                text: "كلمة (سماء) تحتوي على مد بـ...",
                userCorrect: true, // أجاب صح -> يذهب للقوة
                goalShort: "معرفة أنواع المدود (الألف، الواو، الياء)",
                subGoals: [] // لا يهم هنا لأنه أتقنها
            },
            {
                id: 3,
                text: "حلل كلمة (مدرسة) إلى مقاطع",
                userCorrect: false, // أجاب خطأ -> يذهب للاحتياج
                goalShort: "تحليل الكلمات إلى مقاطع وحروف",
                subGoals: [
                    "أن يحدد المقطع الساكن في الكلمة.",
                    "أن يحلل الكلمة التي تحوي شداً."
                ]
            },
            {
                id: 4,
                text: "قراءة النص قراءة مسترسلة",
                userCorrect: true, // أجاب صح
                goalShort: "القراءة المسترسلة للنصوص",
                subGoals: []
            }
        ]
    };

    // --- البدء في تعبئة البيانات في HTML ---

    // 1. تعبئة البيانات الأساسية
    document.getElementById('iep_student_name').value = mockTestResult.studentName;
    document.getElementById('iep_subject').value = mockTestResult.subject;
    document.getElementById('iep_grade').value = mockTestResult.grade;

    // 2. فرز البيانات (القوة vs الاحتياج)
    let strengths = [];
    let needs = [];

    mockTestResult.questions.forEach(q => {
        if (q.userCorrect) {
            strengths.push(q.goalShort);
        } else {
            needs.push(q); // نحتفظ بكامل الكائن لنستخرج الأهداف الفرعية لاحقاً
        }
    });

    // 3. تعبئة جدول القوة والاحتياج
    const tableBody = document.getElementById('strengths_needs_body');
    tableBody.innerHTML = ""; // تفريغ الجدول القديم

    // حساب عدد الصفوف المطلوب (الأكبر بين القائمتين)
    const maxRows = Math.max(strengths.length, needs.length);

    if (maxRows === 0) {
        tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center'>لا توجد بيانات اختبار بعد</td></tr>";
    } else {
        for (let i = 0; i < maxRows; i++) {
            let sText = strengths[i] || ""; // نص نقطة القوة
            let nText = needs[i] ? needs[i].goalShort : ""; // نص نقطة الاحتياج
            
            let rowHtml = `
                <tr>
                    <td>${i + 1}</td>
                    <td><textarea rows="2" class="text-right" readonly style="width:100%; border:none;">${sText}</textarea></td>
                    <td>${i + 1}</td>
                    <td><textarea rows="2" class="text-right" readonly style="width:100%; border:none;">${nText}</textarea></td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', rowHtml);
        }
    }

    // 4. تعبئة الجدول التفصيلي (الأهداف التدريسية) للاحتياجات فقط
    const detailedBody = document.getElementById('detailed_objectives_body');
    detailedBody.innerHTML = ""; // تفريغ

    let counter = 1;
    needs.forEach(needItem => {
        // أ. إضافة صف العنوان (الهدف القصير) مميز بلون مختلف
        let headerRow = `
            <tr style="background-color: #f0f0f0; border-top: 2px solid #ccc;">
                <td><strong>${counter}</strong></td>
                <td colspan="2" class="text-right">
                    <strong>الهدف قصير المدى:</strong> ${needItem.goalShort}
                </td>
            </tr>
        `;
        detailedBody.insertAdjacentHTML('beforeend', headerRow);

        // ب. إضافة الأهداف الفرعية تحته
        if (needItem.subGoals && needItem.subGoals.length > 0) {
            needItem.subGoals.forEach(sub => {
                let subRow = `
                    <tr>
                        <td>-</td>
                        <td><textarea rows="1" class="text-right" style="width:100%; border:1px solid #eee;">${sub}</textarea></td>
                        <td><input type="date" style="border:1px solid #eee;"></td>
                    </tr>
                `;
                detailedBody.insertAdjacentHTML('beforeend', subRow);
            });
        } else {
            // صفوف فارغة إذا لم تكن هناك أهداف فرعية مسجلة
            detailedBody.insertAdjacentHTML('beforeend', `
                <tr><td>-</td><td><textarea placeholder="أضف هدفاً تدريسياً..."></textarea></td><td><input type="date"></td></tr>
            `);
        }
        counter++;
    });
}

// دوال مساعدة (للعرض فقط)
function showAssignTestModal() { document.getElementById('assignTestModal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// تهيئة أولية للصفحة
function initPage() {
    // تعبئة بيانات الهيدر الجانبي (وهمي حالياً)
    document.getElementById('sideName').innerText = "نايف عبدالله";
    document.getElementById('headerStudentName').innerText = "نايف عبدالله";
    document.getElementById('sideGrade').innerText = "الصف الثاني";
}
