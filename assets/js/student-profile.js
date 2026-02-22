// 🔥 دالة التوليد التلقائي المطورة بمعالج النصوص الذكي 🔥
function autoGenerateLessons() {
    showConfirmModal('توليد الخطة العلاجية تلقائياً؟<br><small>سيتم حذف الدروس الحالية وتوليد قائمة جديدة بناءً على نتيجة التشخيص (محك الاجتياز).</small>', function() {
        const studentTests = JSON.parse(localStorage.getItem('studentTests') || '[]');
        const compDiag = studentTests.find(t => t.studentId == currentStudentId && t.type === 'diagnostic' && t.status === 'completed');
        
        if (!compDiag) { showError('يجب إكمال وتصحيح الاختبار التشخيصي أولاً.'); return; }
        
        const allObjectives = JSON.parse(localStorage.getItem('objectives') || '[]');
        const allLessons = JSON.parse(localStorage.getItem('lessons') || '[]');
        const allLibraryAssignments = JSON.parse(localStorage.getItem('assignments') || '[]'); 
        const originalTest = JSON.parse(localStorage.getItem('tests') || '[]').find(t => t.id == compDiag.testId);

        let newLessons = [];
        let newAssignments = []; 

        if(originalTest && originalTest.questions) {
            originalTest.questions.forEach(q => {
                const ans = compDiag.answers ? compDiag.answers.find(a => a.questionId == q.id) : null;
                const score = ans ? parseFloat(ans.score || 0) : 0;
                const maxScore = parseFloat(q.maxScore || q.passingScore || q.points || q.score || 1);
                const criterion = parseFloat(q.passingCriterion || 80);
                
                const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
                
                // إذا لم يتجاوز الطالب المحك، يحتاج إلى درس
                if(percentage < criterion && q.linkedGoalId) {
                    const obj = allObjectives.find(o => o.id == q.linkedGoalId);
                    if(obj) {
                        // 1. تجميع كل الأهداف (الرئيسي والفرعية) وتنظيفها من المسافات الزائدة
                        const targetGoals = [obj.shortTermGoal, ...(obj.instructionalGoals || [])]
                                            .filter(g => g) // إزالة القيم الفارغة
                                            .map(g => String(g).trim());

                        // 2. البحث الذكي في الدروس بمطابقة النصوص المنظفة
                        const matches = allLessons.filter(l => {
                            if (!l.linkedInstructionalGoal) return false;
                            const lessonGoal = String(l.linkedInstructionalGoal).trim();
                            return targetGoals.includes(lessonGoal);
                        });
                        
                        matches.forEach(m => {
                            // منع التكرار
                            if(!newLessons.find(x => x.originalLessonId == m.id)) {
                                newLessons.push({
                                    id: Date.now() + Math.floor(Math.random()*10000),
                                    studentId: currentStudentId, 
                                    title: m.title, 
                                    objective: m.linkedInstructionalGoal,
                                    originalLessonId: m.id, 
                                    status: 'pending', 
                                    assignedDate: new Date().toISOString()
                                });
                                
                                // البحث عن الواجب المرتبط وتوليده أيضاً
                                const lessonGoalForHomework = String(m.linkedInstructionalGoal).trim();
                                const linkedHomework = allLibraryAssignments.find(h => {
                                    if(!h.linkedInstructionalGoal) return false;
                                    return String(h.linkedInstructionalGoal).trim() === lessonGoalForHomework;
                                });

                                if (linkedHomework && !newAssignments.find(a => a.title === linkedHomework.title)) {
                                    newAssignments.push({
                                        id: Date.now() + Math.floor(Math.random()*10000) + 1,
                                        studentId: currentStudentId,
                                        title: linkedHomework.title,
                                        status: 'pending',
                                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                        assignedDate: new Date().toISOString()
                                    });
                                } 
                            }
                        });
                    }
                }
            });
        }

        if(newLessons.length === 0) { showInfoModal('الخطة العلاجية', 'الطالب متفوق! لقد تجاوز محك الاجتياز في جميع المهارات، ولا توجد نقاط ضعف تتطلب خطة علاجية.'); return; }
        
        saveAndReindexLessons(newLessons, true);
        
        if (newAssignments.length > 0) {
            let currentAssignments = JSON.parse(localStorage.getItem('studentAssignments') || '[]');
            currentAssignments = [...currentAssignments.filter(a => a.studentId != currentStudentId), ...newAssignments];
            localStorage.setItem('studentAssignments', JSON.stringify(currentAssignments));
            showSuccess(`تم إسناد ${newLessons.length} درس و ${newAssignments.length} واجب مرتبط للطالب.`);
        } else {
            showSuccess(`تم إسناد ${newLessons.length} درس للطالب ضمن الخطة العلاجية.`);
        }

        if (document.getElementById('section-assignments').classList.contains('active')) loadAssignmentsTab();
    });
}
