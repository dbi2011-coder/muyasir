// ============================================
// 📁 الملف: assets/js/committee.js (مع التمويه الأمني)
// ============================================

// ... (بداية الملف كما هي: إعدادات DB ودوال المساعدة) ...

// 🔥 دالة حفظ العضو (مع التمويه)
function saveMember() {
    const user = getCurrentUser();
    const id = document.getElementById('editMemId').value;
    const name = document.getElementById('memName').value.trim();
    const role = document.getElementById('memRole').value;
    const username = document.getElementById('memUser').value.trim();
    const pass = document.getElementById('memPass').value.trim();
    
    if(!name || !username || !pass) return alert('البيانات ناقصة');
    
    // الفحص الشامل
    const mainUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const committeeMembers = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    const allAccounts = [...mainUsers, ...committeeMembers];

    const isDuplicate = allAccounts.some(account => {
        if (id && account.id == id) return false;
        // تطابق تام (اسم + مرور)
        return account.username === username && account.password === pass;
    });

    if (isDuplicate) {
        // 🎭 رسالة التمويه
        alert('⚠️ تنبيه: كلمة المرور ضعيفة جداً.\nمن أجل سلامة الحساب، يرجى اختيار كلمة مرور أخرى.');
        return; 
    }
    
    let members = JSON.parse(localStorage.getItem('committeeMembers') || '[]');
    
    if(id) {
        const idx = members.findIndex(x => x.id == id);
        if(idx !== -1) members[idx] = { id: parseInt(id), ownerId: members[idx].ownerId, name, role, username, password: pass };
    } else {
        members.push({ id: Date.now(), ownerId: user.id, name, role, username, password: pass });
    }
    
    localStorage.setItem('committeeMembers', JSON.stringify(members));
    closeModal('addMemberModal');
    loadMembers();
    alert('تم حفظ العضو بنجاح ✅');
}

// ... (باقي الملف كما هو: الدوال الأخرى) ...
