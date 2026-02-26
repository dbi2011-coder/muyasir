// ============================================
// 📊 قسم التقارير داخل حساب اللجنة (محدث ليعمل مع Supabase)
// ============================================
async function loadMemberStudentsMultiSelect() { 
    const list = document.getElementById('studentOptionsList'); 
    if(!list) return; 
    
    const user = getCurrentUser(); 
    if (!user || !user.ownerId) return;

    try {
        // إظهار رسالة تحميل ريثما تأتي البيانات من السحابة
        list.innerHTML = '<div style="padding:10px; color:#666; text-align:center;">جاري جلب الطلاب من السحابة... <i class="fas fa-spinner fa-spin"></i></div>';

        // الجلب من سوبابيس (Supabase) بدلاً من المتصفح (localStorage)
        const { data: st, error } = await window.supabase
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .eq('teacherId', user.ownerId);

        if (error) throw error;
        
        if(!st || st.length === 0){
            list.innerHTML='<div style="padding:10px; color:#666;">لا يوجد طلاب مرتبطين بمعلمك حالياً.</div>';
            return;
        } 
        
        // بناء القائمة بناءً على البيانات القادمة من السحابة
        let h = `<div class="multi-select-option select-all-option" onclick="toggleSelectAllStudents(this)">
                    <input type="checkbox" id="selectAllCheckbox">
                    <label for="selectAllCheckbox">الكل</label>
                 </div>`; 
                 
        st.forEach(s => { 
            h += `<div class="multi-select-option" onclick="toggleStudentCheckbox(this)">
                    <input type="checkbox" value="${s.id}" class="student-checkbox">
                    <label>${s.name}</label>
                  </div>`; 
        }); 
        
        list.innerHTML = h; 
        
    } catch (e) { 
        console.error("Error fetching students from Supabase:", e); 
        list.innerHTML = '<div style="padding:10px; color:#dc3545; text-align:center;">حدث خطأ أثناء جلب الطلاب من قاعدة البيانات.</div>';
    }
}
