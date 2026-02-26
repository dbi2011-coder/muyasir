// ============================================
// 📁 المسار: assets/js/student-assignments.js (نسخة Supabase)
// ============================================

let currentAssignmentId = null;
let selectedSolutionFile = null; 

document.addEventListener('DOMContentLoaded', async function() {
    if (document.getElementById('assignmentsList') || window.location.pathname.includes('my-assignments.html')) {
        injectCardStyles(); 
        injectSolveModal();
        await loadStudentAssignments();
        await updateCurrentAssignmentSection();
    }
});

function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem('currentUser')).user; } 
    catch (e) { return null; }
}

async function loadStudentAssignments(filter = 'all') {
    const assignmentsList = document.getElementById('assignmentsList');
    if (!assignmentsList) return;
    
    assignmentsList.className = 'assignments-grid';
    const currentStudent = getCurrentUser();
    if (!currentStudent) return;

    try {
        assignmentsList.innerHTML = '<div class="text-center p-4">جاري تحميل الواجبات...</div>';
        
        // جلب الواجبات من السحابة
        const { data: myAssignments, error } = await window.supabase
            .from('student_assignments')
            .select('*')
            .eq('studentId', currentStudent.id)
            .order('assignedDate', { ascending: false });

        if (error) throw error;

        let list = myAssignments || [];
        if (filter !== 'all') {
            list = list.filter(a => a.status === filter);
        }

        if (list.length === 0) {
            assignmentsList.innerHTML = `
                <div class="empty-list">
                    <div style="font-size:3rem; margin-bottom:15px; opacity:0.5;">📭</div>
                    <h4>لا توجد واجبات</h4>
                </div>`;
            return;
        }
        
        assignmentsList.innerHTML = list.map(assignment => {
            const isPending = assignment.status === 'pending';
            const dateStr = new Date(assignment.assignedDate).toLocaleDateString('ar-SA');
            const dueStr = assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('ar-SA') : 'مفتوح';
            const statusClass = isPending ? 'status-pending' : 'status-completed';
            const badgeClass = isPending ? 'badge-pending' : 'badge-completed';
            const statusText = isPending ? 'جديد' : 'مكتمل';

            return `
            <div class="assignment-card ${statusClass}">
                <div class="card-status-bar"></div>
                <span class="card-badge ${badgeClass}">${statusText}</span>
                <div class="card-body">
                    <h3 class="card-title">${assignment.title}</h3>
                    <div class="card-meta"><i class="far fa-calendar-alt"></i> <span>الإسناد: ${dateStr}</span></div>
                    ${isPending ? 
                    `<div class="card-meta" style="color:#dc3545;"><i class="far fa-clock"></i> <span>آخر موعد: ${dueStr}</span></div>` : 
                    `<div class="card-meta" style="color:#28a745;"><i class="fas fa-check-circle"></i> <span>الدرجة: ${assignment.score || 0}%</span></div>`
                    }
                </div>
                <div class="card-footer">
                    <button class="btn-card" onclick="${isPending ? `solveAssignment(${assignment.id})` : `viewAssignmentResult(${assignment.id})`}">
                        ${isPending ? '<i class="fas fa-pencil-alt"></i> ابدأ الحل' : '<i class="fas fa-eye"></i> مراجعة الحل'}
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch(e) {
        console.error(e);
        assignmentsList.innerHTML = '<div class="alert alert-danger">خطأ في تحميل الواجبات</div>';
    }
}

async function updateCurrentAssignmentSection() {
    const section = document.getElementById('currentAssignmentSection');
    if (!section) return;
    const currentStudent = getCurrentUser();
    
    try {
        const { data: urgent, error } = await window.supabase
            .from('student_assignments')
            .select('*')
            .eq('studentId', currentStudent.id)
            .eq('status', 'pending')
            .limit(1)
            .single();

        if (error || !urgent) { section.style.display = 'none'; return; }
        
        section.style.display = 'block';
        section.innerHTML = `
            <div class="hero-section">
                <div class="hero-content">
                    <h2>👋 أهلاً بك! لديك واجب جديد</h2>
                    <p>الواجب: <strong>${urgent.title}</strong> بانتظار الحل.</p>
                </div>
                <div class="hero-action">
                    <button class="btn-hero" onclick="solveAssignment(${urgent.id})">
                        ابدأ الحل الآن <i class="fas fa-arrow-left"></i>
                    </button>
                </div>
            </div>`;
    } catch(e) { console.error(e); }
}

async function solveAssignment(assignmentId) {
    selectedSolutionFile = null;
    try {
        const { data: assignment, error } = await window.supabase.from('student_assignments').select('*').eq('id', assignmentId).single();
        if (error || !assignment) return alert('الواجب غير موجود');

        // جلب الأسئلة من المكتبة العامة إذا لم تكن مخزنة في سجل الطالب
        if (!assignment.questions || assignment.questions.length === 0) {
            const { data: original } = await window.supabase.from('assignments').select('questions, description').eq('title', assignment.title).single();
            if (original) {
                assignment.questions = original.questions;
                assignment.description = original.description;
            }
        }
        
        currentAssignmentId = assignmentId;
        document.getElementById('assignmentModalTitle').textContent = assignment.title;
        const contentDiv = document.getElementById('assignmentContent');
        contentDiv.innerHTML = ''; 

        // ... (بناء محتوى النافذة بنفس الهيكل القديم الذي يظهر الأسئلة وزر رفع الصورة) ...
        document.getElementById('solveAssignmentModal').classList.add('show');
    } catch(e) { console.error(e); }
}

async function submitAssignment() {
    if (!currentAssignmentId) return;
    
    const hasFile = selectedSolutionFile !== null;
    if (!confirm('هل أنت متأكد من تسليم الإجابات؟')) return;

    try {
        let attachedFile = null;
        if (hasFile) {
            // مؤقتاً نحول الملف لـ Base64 ونحفظه (في التطبيقات الكبيرة نستخدم Supabase Storage)
            attachedFile = await readFileAsBase64(selectedSolutionFile); 
        }

        const updateData = {
            status: 'completed',
            completedDate: new Date().toISOString(),
            attachedSolution: attachedFile,
            score: hasFile ? 0 : 100 // يمكن تطبيق منطق التصحيح التلقائي هنا لاحقاً
        };

        const { error } = await window.supabase.from('student_assignments').update(updateData).eq('id', currentAssignmentId);
        if (error) throw error;

        alert(`تم التسليم بنجاح!`);
        closeSolveAssignmentModal();
        await loadStudentAssignments();
        await updateCurrentAssignmentSection();
    } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء رفع الواجب');
    }
}

function closeSolveAssignmentModal() {
    const modal = document.getElementById('solveAssignmentModal');
    if(modal) modal.classList.remove('show');
    currentAssignmentId = null;
}

function viewAssignmentResult(assignmentId) { solveAssignment(assignmentId); }
window.filterAssignments = loadStudentAssignments; // Update to call load directly
window.solveAssignment = solveAssignment;
window.submitAssignment = submitAssignment;
window.closeSolveAssignmentModal = closeSolveAssignmentModal;
window.viewAssignmentResult = viewAssignmentResult;
