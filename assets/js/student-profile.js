// assets/js/student-profile.js

document.addEventListener('DOMContentLoaded', () => {
    // جلب معرف الطالب
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');

    if (!studentId) {
        alert('حدث خطأ: لم يتم تحديد الطالب.');
        window.location.href = 'students.html';
        return;
    }

    // تحميل البيانات
    loadStudentProfile(studentId);
    
    // تشغيل دالة تعبئة الجدول الآلي
    fillStudentIEPSchedule(studentId);
});

// التبديل بين التبويبات
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // تفعيل الزر المناسب
    const buttons = document.querySelectorAll('.tab-btn');
    if(tabName === 'info') buttons[0].classList.add('active');
    if(tabName === 'iep') buttons[1].classList.add('active');
    if(tabName === 'progress') buttons[2].classList.add('active');
}

// تحميل بيانات الطالب
function loadStudentProfile(id) {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.id == id);

    if (student) {
        document.getElementById('studentNameDisplay').textContent = student.name;
        document.getElementById('studentGradeDisplay').textContent = `الصف: ${student.grade} - ${student.class || ''}`;
        
        const detailsGrid = document.getElementById('studentDetailsGrid');
        detailsGrid.innerHTML = `
            <div class="info-item"><strong>رقم السجل:</strong> ${student.idNumber || '-'}</div>
            <div class="info-item"><strong>تاريخ الميلاد:</strong> ${student.dob || '-'}</div>
            <div class="info-item"><strong>نوع الصعوبة:</strong> ${student.diagnosis || 'غير محدد'}</div>
            <div class="info-item"><strong>ولي الأمر:</strong> ${student.parentPhone || '-'}</div>
        `;
        
        loadSavedIEP(id);
    }
}

// --- الدالة المحدثة: تعبئة الجدول بعلامة (✓) ---
function fillStudentIEPSchedule(studentId) {
    // 1. جلب الجدول الدراسي
    const masterSchedule = JSON.parse(localStorage.getItem('study_schedule')) || [];
    
    // 2. تصفير الجدول
    const tableCells = document.querySelectorAll('#iepStudentScheduleTable td');
    tableCells.forEach(cell => {
        cell.innerHTML = ''; // تفريغ الخلية
        cell.style.backgroundColor = '';
    });

    // 3. البحث عن الحصص ووضع العلامة
    masterSchedule.forEach(session => {
        // إذا كان الطالب مسجلاً في هذه الحصة
        if (session.studentIds && session.studentIds.includes(studentId)) {
            
            // تحديد الخلية (اليوم والحصة)
            const row = document.querySelector(`#iepStudentScheduleTable tr[data-day="${session.day}"]`);
            if (row) {
                const cell = row.querySelector(`td[data-period="${session.period}"]`);
                if (cell) {
                    // === التغيير هنا: وضع أيقونة الصح ===
                    cell.innerHTML = '<i class="fas fa-check"></i>';
                    
                    // تنسيق العلامة (لون أخضر، خط عريض، توسيط)
                    cell.style.color = '#28a745'; // أخضر
                    cell.style.fontSize = '1.5rem'; // حجم كبير وواضح
                    cell.style.verticalAlign = 'middle';
                    cell.style.backgroundColor = '#f0fff4'; // خلفية خضراء فاتحة جداً للتمييز
                }
            }
        }
    });
}

// حفظ الخطة
function saveIEPData() {
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    
    const iepData = {
        studentId: studentId,
        strengths: document.getElementById('strengths').value,
        needs: document.getElementById('needs').value,
        supportServices: document.getElementById('supportServices').value,
        planDate: document.getElementById('planDate').value
    };

    let allPlans = JSON.parse(localStorage.getItem('iep_plans')) || [];
    allPlans = allPlans.filter(p => p.studentId !== studentId);
    allPlans.push(iepData);
    localStorage.setItem('iep_plans', JSON.stringify(allPlans));
    
    alert('تم حفظ الخطة بنجاح');
}

// استرجاع الخطة المحفوظة
function loadSavedIEP(studentId) {
    const allPlans = JSON.parse(localStorage.getItem('iep_plans')) || [];
    const plan = allPlans.find(p => p.studentId === studentId);
    
    if (plan) {
        document.getElementById('strengths').value = plan.strengths || '';
        document.getElementById('needs').value = plan.needs || '';
        document.getElementById('supportServices').value = plan.supportServices || '';
        document.getElementById('planDate').value = plan.planDate || '';
    }
}

function printReport() {
    window.print();
}
