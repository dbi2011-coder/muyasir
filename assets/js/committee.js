// ============================================
// 📁 الملف: assets/js/committee.js (النسخة السحابية الكاملة + إصلاح التبويبات)
// ============================================

// =========================================================
// 🔥 دوال النوافذ المنبثقة والإشعارات 🔥
// =========================================================
if (!window.showConfirmModal) { window.showConfirmModal = function(message, onConfirm) { let modal = document.getElementById('globalConfirmModal'); if (!modal) { const modalHtml = `<div id="globalConfirmModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:999999; justify-content:center; align-items:center; backdrop-filter:blur(4px);"><div style="background:white; padding:25px; border-radius:15px; width:90%; max-width:350px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.2); animation:popIn 0.3s ease;"><div style="font-size:3.5rem; color:#dc3545; margin-bottom:15px;"><i class="fas fa-exclamation-circle"></i></div><div style="font-size:1.3rem; font-weight:bold; margin-bottom:10px; color:#333;">تأكيد الإجراء</div><div id="globalConfirmMessage" style="color:#666; margin-bottom:25px; font-size:0.95rem; line-height:1.6;"></div><div style="display:flex; gap:15px; justify-content:center;"><button id="globalConfirmCancel" style="background:#e2e8f0; color:#333; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">إلغاء</button><button id="globalConfirmOk" style="background:#dc3545; color:white; border:none; padding:12px 20px; border-radius:8px; cursor:pointer; font-weight:bold; flex:1; transition:0.2s; font-family:'Tajawal';">نعم، متأكد</button></div></div></div>`; document.body.insertAdjacentHTML('beforeend', modalHtml); modal = document.getElementById('globalConfirmModal'); } document.getElementById('globalConfirmMessage').innerHTML = message; modal.style.display = 'flex'; document.getElementById('globalConfirmOk').onclick = function() { modal.style.display = 'none'; if (typeof onConfirm === 'function') onConfirm(); }; document.getElementById('globalConfirmCancel').onclick = function() { modal.style.display = 'none'; }; }; }
if (!window.showSuccess) { window.showSuccess = function(message) { let toast = document.getElementById('globalSuccessToast'); if (!toast) { const toastHtml = `<div id="globalSuccessToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#10b981; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-check-circle"></i> <span id="globalSuccessMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalSuccessToast'); } document.getElementById('globalSuccessMessage').textContent = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 3000); }; }
if (!window.showError) { window.showError = function(message) { let toast = document.getElementById('globalErrorToast'); if (!toast) { const toastHtml = `<div id="globalErrorToast" style="display:none; position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#dc3545; color:white; padding:12px 25px; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.2); z-index:999999; font-weight:bold; font-family:'Tajawal'; align-items:center; gap:10px;"><i class="fas fa-exclamation-triangle"></i> <span id="globalErrorMessage"></span></div>`; document.body.insertAdjacentHTML('beforeend', toastHtml); toast = document.getElementById('globalErrorToast'); } document.getElementById('globalErrorMessage').innerHTML = message; toast.style.display = 'flex'; setTimeout(() => { toast.style.display = 'none'; }, 4000); }; }

// =========================================================
// العمليات الأساسية
// =========================================================

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('committeeTableBody')) {
        loadCommitteeData();
    }
});

function getCurrentUser() { 
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null'); 
}

// 🌟 دالة التبديل بين التبويبات (لحل المشكلة)
function switchTab(tabId) {
    // 1. إخفاء جميع الأقسام والتبويبات
    document.querySelectorAll('.tab-content, .content-section').forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });
    
    // 2. إزالة التفعيل من جميع الأزرار والروابط
    document.querySelectorAll('.tab-btn, .nav-link, .btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.classList.contains('btn-primary')) {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
        }
    });
    
    // 3. إظهار القسم المطلوب
    const targetTab = document.getElementById(tabId) || document.getElementById(`section-${tabId}`);
    if (targetTab) {
        targetTab.style.display = 'block';
        targetTab.classList.add('active');
    }
    
    // 4. تفعيل الزر الذي تم الضغط عليه
    const targetBtn = document.querySelector(`[onclick*="switchTab('${tabId}')"]`) || document.getElementById(`link-${tabId}`);
    if (targetBtn) {
        targetBtn.classList.add('active');
        if(targetBtn.classList.contains('btn-outline-primary')) {
            targetBtn.classList.remove('btn-outline-primary');
            targetBtn.classList.add('btn-primary');
        }
    }
}

// 1. جلب الأعضاء من السحابة
async function loadCommitteeData() {
    const tableBody = document.getElementById('committeeTableBody');
    const emptyState = document.getElementById('emptyState');

    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">جاري جلب البيانات من السحابة...</td></tr>';

    try {
        const { data: members, error } = await window.supabase
            .from('committee_members')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!members || members.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            tableBody.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        tableBody.innerHTML = members.map((member, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${member.name}</td>
                    <td>${member.role || 'عضو لجنة'}</td>
                    <td>${member.username}</td>
                    <td>
                        <div style="display:flex; gap:5px; justify-content:center;">
                            <button class="btn btn-sm btn-info" onclick="viewMemberCredentials('${member.username}', '${member.password}')">بيانات الدخول</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteMember(${member.id})">حذف</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    } catch (error) {
        console.error("Error loading committee members:", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">حدث خطأ أثناء جلب البيانات</td></tr>';
    }
}

// 2. النوافذ المنبثقة للإضافة
function showAddCommitteeModal() {
    const nameEl = document.getElementById('committeeName');
    const roleEl = document.getElementById('committeeRole');
    const userEl = document.getElementById('committeeUsername');
    const passEl = document.getElementById('committeePassword');
    
    if(nameEl) nameEl.value = '';
    if(roleEl) roleEl.value = '';
    if(userEl) userEl.value = '';
    if(passEl) passEl.value = '';
    
    const modal = document.getElementById('addCommitteeModal');
    if (modal) modal.classList.add('show');
}

function closeAddCommitteeModal() {
    const modal = document.getElementById('addCommitteeModal');
    if (modal) modal.classList.remove('show');
}

// 3. إضافة عضو لجنة جديد للسحابة
async function addNewCommitteeMember() {
    const nameVal = document.getElementById('committeeName')?.value.trim();
    const roleVal = document.getElementById('committeeRole')?.value.trim() || 'عضو لجنة';
    const userVal = document.getElementById('committeeUsername')?.value.trim();
    const passVal = document.getElementById('committeePassword')?.value.trim();

    if (!nameVal || !userVal || !passVal) {
        return showError('الرجاء إكمال جميع الحقول الأساسية (الاسم، المستخدم، المرور)');
    }

    const currentUser = getCurrentUser();

    try {
        // التحقق من عدم تكرار اسم المستخدم
        const { data: existing } = await window.supabase.from('committee_members').select('id').eq('username', userVal);
        if (existing && existing.length > 0) {
            return showError('اسم المستخدم مسجل مسبقاً. يرجى اختيار اسم آخر.');
        }

        // الإضافة للسحابة
        const { error } = await window.supabase.from('committee_members').insert([{
            id: Date.now(),
            name: nameVal,
            role: roleVal,
            username: userVal,
            password: passVal,
            ownerId: currentUser ? currentUser.id : null
        }]);

        if (error) throw error;

        showSuccess('تمت إضافة عضو اللجنة بنجاح ✅');
        closeAddCommitteeModal();
        loadCommitteeData();
    } catch (error) {
        console.error("Add Member Error:", error);
        showError("حدث خطأ أثناء الحفظ في قاعدة البيانات.");
    }
}

// 4. دالة الحذف
function deleteMember(id) {
    showConfirmModal('⚠️ هل أنت متأكد من حذف عضو اللجنة هذا نهائياً؟', async function() {
        try {
            const { error } = await window.supabase.from('committee_members').delete().eq('id', id);
            if (error) throw error;
            
            showSuccess('تم الحذف بنجاح');
            loadCommitteeData();
        } catch (error) {
            console.error("Delete Error:", error);
            showError("حدث خطأ أثناء الحذف من السحابة.");
        }
    });
}

// 5. عرض بيانات الدخول للعضو
function viewMemberCredentials(username, password) {
    const uEl = document.getElementById('viewMemberUsername');
    const pEl = document.getElementById('viewMemberPassword');
    const modal = document.getElementById('viewCredentialsModal');
    
    if (uEl && pEl && modal) {
        uEl.textContent = username;
        pEl.value = password;
        modal.classList.add('show');
    } else {
        alert(`اسم المستخدم: ${username}\nكلمة المرور: ${password}`);
    }
}

function closeViewCredentialsModal() {
    const m = document.getElementById('viewCredentialsModal');
    if (m) m.classList.remove('show');
}

function togglePasswordVisibility() {
    const el = document.getElementById('viewMemberPassword');
    if (el) el.type = (el.type === 'password' ? 'text' : 'password');
}

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    if(!el) return;
    const txt = el.tagName === 'INPUT' ? el.value : el.innerText;
    navigator.clipboard.writeText(txt).then(() => showSuccess('تم النسخ بنجاح'));
}

// =========================================================
// تصدير الدوال لتكون متاحة لأزرار الـ HTML
// =========================================================
window.loadCommitteeData = loadCommitteeData;
window.showAddCommitteeModal = showAddCommitteeModal;
window.closeAddCommitteeModal = closeAddCommitteeModal;
window.addNewCommitteeMember = addNewCommitteeMember;
window.deleteMember = deleteMember;
window.viewMemberCredentials = viewMemberCredentials;
window.closeViewCredentialsModal = closeViewCredentialsModal;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyToClipboard = copyToClipboard;
window.switchTab = switchTab; // الدالة المضافة
