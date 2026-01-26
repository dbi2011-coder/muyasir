// ============================================
// 📁 الملف: assets/js/member.js
// الوصف: كود تشغيل بوابة عضو اللجنة
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. عرض اسم العضو
    const user = getCurrentUser();
    if(user && document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }

    // 2. تحميل البيانات
    loadMyMeetings();
    loadStudentsForReports();
});

// ✅ دالة التبديل بين التبويبات (التي كان يشتكي من اختفائها)
function switchMemberTab(tabName) {
    // إخفاء كل الأقسام
    const sections = ['meetings', 'reports'];
    sections.forEach(sec => {
        const el = document.getElementById(`section-${sec}`);
        if(el) el.style.display = 'none';
        
        const link = document.getElementById(`link-${sec}`);
        if(link) link.classList.remove('active');
    });

    // إظهار القسم المطلوب
    const targetEl = document.getElementById(`section-${tabName}`);
    if(targetEl) targetEl.style.display = 'block';

    const targetLink = document.getElementById(`link-${tabName}`);
    if(targetLink) targetLink.classList.add('active');
}

// تحميل اجتماعات العضو
function loadMeetings() {
    const user = getCurrentUser();
    if(!user) return;

    const allMeetings = JSON.parse(localStorage.getItem('committeeMeetings') || '[]');
    // جلب الاجتماعات التي يكون العضو مدعواً لها
    const myMeetings = allMeetings.filter(m => m.attendees && m.attendees.includes(user.id));
    
    const container = document.getElementById('myMeetingsContainer');
    if(!container) return;

    if(myMeetings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">لا توجد اجتماعات مجدولة حالياً.</div>';
        return;
    }

    let html = '<table class="table table-bordered bg-white"><thead><tr><th>الموضوع</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
    
    myMeetings.forEach(m => {
        const isSigned = m.signatures && m.signatures[user.id];
        const status = isSigned ? '<span class="badge badge-success">تم التوقيع</span>' : '<span class="badge badge-warning">بانتظار التوقيع</span>';
        
        html += `
            <tr>
                <td>${m.title}</td>
                <td>${m.date}</td>
                <td>${status}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewMeetingDetails(${m.id})">عرض وتوقيع</button>
                </td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// عرض تفاصيل الاجتماع للتوقيع
function viewMeetingDetails(id) {
    // هنا يمكن إضافة منطق فتح المودال، حالياً سنكتفي بتنبيه للتجربة
    alert("سيتم فتح تفاصيل الاجتماع رقم: " + id);
}

// تحميل الطلاب للقائمة المنسدلة في التقارير
function loadStudentsForReports() {
    const select = document.getElementById('memberStudentSelect');
    if(!select) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const students = users.filter(u => u.role === 'student');

    select.innerHTML = '<option value="">اختر الطالب...</option>';
    students.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}
