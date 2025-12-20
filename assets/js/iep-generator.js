function generateAutoIEP(failedObjectiveIds) {
    const user = getCurrentUser();
    const objectives = JSON.parse(localStorage.getItem('objectives') || '[]');
    const needs = [], strengths = [];
    
    failedObjectiveIds.forEach(id => { const o = objectives.find(x => x.id == id); if(o) needs.push(o.shortTerm); });
    
    const newIEP = {
        id: generateId(), studentId: user.id, teacherId: user.teacherId, createdAt: new Date().toISOString(),
        studentName: user.name, grade: user.grade,
        strengths: ["مهارات استماع جيدة"], needs: needs,
        longTermGoal: "أن يتقن المهارات بنسبة 80%",
        goals: needs.map(n => ({ id: generateId(), shortTerm: n, instructional: "هدف تدريسي", status: 'pending' })),
        status: 'active'
    };
    
    const plans = JSON.parse(localStorage.getItem('educationalPlans') || '[]');
    localStorage.setItem('educationalPlans', JSON.stringify(plans.filter(p => p.studentId !== user.id).concat([newIEP])));
    
    alert('تم إنشاء خطة تربوية تلقائياً بناءً على نتائج الاختبار');
    window.location.href = 'my-iep.html';
}
