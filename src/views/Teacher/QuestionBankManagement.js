import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Badge, ButtonGroup, Image, Modal, Tabs, Tab, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useTeacherData } from 'contexts/TeacherDataContext';
import { getCourseQuestions, getMyPendingSuggestions, reviewQuestion, deleteQuestion, suggestQuestion, updateQuestion, revertQuestionReview } from 'services/teacher/teacherService';
import { generateQuestionsFromText, generateQuestionsFromFile } from 'services/shared/aiService';

// --- دوال مساعدة (لا تغييرات) ---
const translateAndColor = (key, value) => {
    const translations = {
        difficultyLevel: { Easy: { text: 'سهل', bg: 'success' }, Medium: { text: 'متوسط', bg: 'warning' }, Hard: { text: 'صعب', bg: 'danger' } },
        status: { Approved: { bg: 'success', text: 'معتمد' }, Pending: { bg: 'warning', text: 'قيد المراجعة' }, Rejected: { bg: 'danger', text: 'مرفوض' } }
    };
    return translations[key]?.[value] || { text: value, bg: 'secondary' };
};
const getDifficultyCardClass = (difficultyLevel) => {
    const { bg } = translateAndColor('difficultyLevel', difficultyLevel);
    return `border-start border-5 border-${bg}`;
};
const getDetailedErrorMessage = (error, defaultMessage) => {
    if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).flat();
        return validationErrors.join('\n');
    }
    return error.response?.data?.message || defaultMessage;
};
const GeneratingLoader = () => (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }} />
        <h4 className="mt-4 text-primary">جاري توليد الأسئلة...</h4>
        <p className="text-muted">قد تستغرق هذه العملية بضع لحظات. شكرًا لصبرك.</p>
    </div>
);

function QuestionBankManagement() {
    // --- حالات (States) أصلية ---
    const { coordinatedCourses, loadingCoordinatorStatus, classrooms } = useTeacherData();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [questions, setQuestions] = useState([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDifficulty, setFilterDifficulty] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [questionToReview, setQuestionToReview] = useState(null);
    const [questionToEdit, setQuestionToEdit] = useState(null);
    const [imageToShow, setImageToShow] = useState('');
    const initialFormState = { text: '', questionType: 'MultipleChoice', difficultyLevel: 'Easy', options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }] };
    const [formData, setFormData] = useState(initialFormState);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [deleteCurrentImage, setDeleteCurrentImage] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [submittingForm, setSubmittingForm] = useState(false);

    // --- حالات (States) خاصة بالـ AI ومحدثة ---
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiFlowState, setAiFlowState] = useState('idle');
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastGenerationParams, setLastGenerationParams] = useState(null);
    const [savingQuestionId, setSavingQuestionId] = useState(null);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [aiFormData, setAiFormData] = useState({
        contextText: '', file: null, numberOfQuestions: 3, difficulty: 'Medium', questionType: 'MultipleChoice', language: 'Arabic'
    });

    const isCurrentUserCoordinator = useMemo(() =>
        coordinatedCourses.some(c => c.courseId === parseInt(selectedCourseId)),
        [selectedCourseId, coordinatedCourses]);
    const availableCourses = useMemo(() => {
        const courseMap = new Map();
        coordinatedCourses.forEach(c => courseMap.set(c.courseId, c));
        classrooms.forEach(c => { if (!courseMap.has(c.courseId)) { courseMap.set(c.courseId, { courseId: c.courseId, name: c.courseName, academicProgramName: c.academicProgramName }); } });
        return Array.from(courseMap.values());
    }, [coordinatedCourses, classrooms]);
    const filteredQuestions = useMemo(() => questions.filter(q => isCurrentUserCoordinator ? (filterStatus === 'All' || q.status === filterStatus) : true).filter(q => isCurrentUserCoordinator ? (filterDifficulty === 'All' || q.difficultyLevel === filterDifficulty) : true).filter(q => !searchTerm || q.text?.toLowerCase().includes(searchTerm.toLowerCase())), [questions, filterStatus, filterDifficulty, searchTerm, isCurrentUserCoordinator]);
    const fetchQuestions = useCallback(async () => {
        if (!selectedCourseId) { setQuestions([]); return; }
        setLoadingQuestions(true);
        try { const response = isCurrentUserCoordinator ? await getCourseQuestions(selectedCourseId) : await getMyPendingSuggestions(selectedCourseId); setQuestions(response.data); } catch (error) { toast.error(getDetailedErrorMessage(error, "فشل في جلب الأسئلة.")); setQuestions([]); }
        finally { setLoadingQuestions(false); }
    }, [selectedCourseId, isCurrentUserCoordinator]);
    useEffect(() => { if (availableCourses.length > 0 && !selectedCourseId) { setSelectedCourseId(availableCourses[0].courseId); } }, [availableCourses, selectedCourseId]);
    useEffect(() => { fetchQuestions(); }, [fetchQuestions]);
    useEffect(() => { return () => { if (imagePreview) { URL.revokeObjectURL(imagePreview); } }; }, [imagePreview]);
    const handleShowReviewModal = (question) => { setQuestionToReview(question); setShowReviewModal(true); };
    const handleCloseReviewModal = () => { setShowReviewModal(false); setQuestionToReview(null); };
    const handleShowAddModal = () => { setQuestionToEdit(null); setFormData(initialFormState); setImageFile(null); setImagePreview(null); setDeleteCurrentImage(false); setShowFormModal(true); };
    const handleShowEditModal = (question) => { setQuestionToEdit(question); setFormData({ text: question.text || '', questionType: question.questionType, difficultyLevel: question.difficultyLevel, options: question.options.map(opt => ({ ...opt })) }); setImageFile(null); setImagePreview(null); setDeleteCurrentImage(false); setShowFormModal(true); };
    const handleCloseFormModal = () => setShowFormModal(false);
    const handleShowImage = (imageUrl) => { setImageToShow(`${imageUrl}`); setShowImageModal(true); };
    const handleCloseImageModal = () => setShowImageModal(false);
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); } else { setImageFile(null); setImagePreview(null); } };
    const handleQuestionTypeChange = (e) => {
        const newType = e.target.value; const isEditMode = !!questionToEdit;
        let newOptions = isEditMode ? formData.options : (newType === 'TrueFalse' ? [{ text: 'صح', isCorrect: true }, { text: 'خطأ', isCorrect: false }] : initialFormState.options);
        setFormData({ ...formData, questionType: newType, options: newOptions });
    };
    const handleOptionChange = (index, field, value) => {
        const updatedOptions = formData.options.map((opt, i) => { let newOpt = { ...opt }; if (i === index) { newOpt[field] = value; } if (field === 'isCorrect' && value === true && i !== index) { newOpt.isCorrect = false; } return newOpt; });
        setFormData({ ...formData, options: updatedOptions });
    };
    const addOption = () => setFormData({ ...formData, options: [...formData.options, { text: '', isCorrect: false }] });
    const removeOption = (index) => { if (formData.options.length <= 2) { toast.warn("يجب وجود خيارين على الأقل."); return; } setFormData({ ...formData, options: formData.options.filter((_, i) => i !== index) }); };
    const handleReviewSubmit = async (newStatus) => { if (!questionToReview) return; setIsSubmittingReview(true); try { await reviewQuestion(questionToReview.questionId, { newStatus }); toast.success(`تم ${newStatus === 'Approved' ? 'قبول' : 'رفض'} السؤال.`); handleCloseReviewModal(); await fetchQuestions(); } catch (error) { toast.error(getDetailedErrorMessage(error, "فشل في مراجعة السؤال.")); } finally { setIsSubmittingReview(false); } };
    const handleDelete = async (questionId) => { if (window.confirm("هل أنت متأكد من حذف هذا السؤال نهائيًا؟")) { try { await deleteQuestion(questionId); toast.success("تم حذف السؤال بنجاح."); await fetchQuestions(); } catch (error) { toast.error(getDetailedErrorMessage(error, "فشل في حذف السؤال.")); } } };
    const handleRevertReview = async (questionId) => { if (window.confirm("هل أنت متأكد من إعادة هذا السؤال إلى حالة 'قيد المراجعة'؟")) { try { await revertQuestionReview(questionId); toast.success("تمت إعادة السؤال إلى حالة المراجعة بنجاح."); await fetchQuestions(); } catch (error) { toast.error(getDetailedErrorMessage(error, "فشل في التراجع عن المراجعة.")); } } };
    const handleFormSubmit = async (e) => {
        e.preventDefault(); const isEditMode = !!questionToEdit;
        if (!formData.text?.trim() && !imageFile && !isEditMode) { return toast.warn("يجب إدخال نص للسؤال أو رفع صورة."); }
        if (isEditMode && !formData.text?.trim() && !questionToEdit.imageUrl && !imageFile && !deleteCurrentImage) { return toast.warn("يجب إدخال نص للسؤال."); }
        if (formData.options.some(opt => !opt.text.trim())) { return toast.warn("يجب تعبئة جميع خيارات الإجابة."); }
        if (!formData.options.some(opt => opt.isCorrect)) { return toast.warn("يجب تحديد إجابة صحيحة."); }
        setSubmittingForm(true);
        const data = new FormData();
        data.append('Text', formData.text || ""); data.append('QuestionType', formData.questionType); data.append('DifficultyLevel', formData.difficultyLevel);
        formData.options.forEach((opt, index) => { data.append(`Options[${index}].QuestionOptionId`, opt.questionOptionId || 0); data.append(`Options[${index}].Text`, opt.text); data.append(`Options[${index}].IsCorrect`, opt.isCorrect); });
        try {
            if (isEditMode) { if (imageFile) { data.append('NewImage', imageFile); } data.append('DeleteCurrentImage', deleteCurrentImage); await updateQuestion(questionToEdit.questionId, data); toast.success("تم تعديل السؤال بنجاح."); }
            else { if (imageFile) { data.append('Image', imageFile); } await suggestQuestion(selectedCourseId, data); toast.success("تم اقتراح السؤال بنجاح."); }
            await fetchQuestions(); handleCloseFormModal();
        } catch (error) { toast.error(getDetailedErrorMessage(error, `فشل في ${isEditMode ? 'تعديل' : 'إضافة'} السؤال.`)); }
        finally { setSubmittingForm(false); }
    };
    const handleShowAiModal = () => setShowAiModal(true);
    const handleCloseAiModal = () => setShowAiModal(false);
    const handleAiFormChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "numberOfQuestions") { const num = Math.max(1, Math.min(20, Number(value))); setAiFormData(prev => ({ ...prev, [name]: num })); }
        else { setAiFormData(prev => ({ ...prev, [name]: files ? files[0] : value })); }
    };
    const handleAiSubmit = async (e, generationType) => {
        e.preventDefault(); setIsGenerating(true); setAiFlowState('generating'); handleCloseAiModal();
        try {
            let response;
            if (generationType === 'text') {
                if (!aiFormData.contextText.trim() || aiFormData.contextText.length < 100) { toast.warn("الرجاء إدخال نص لا يقل عن 100 حرف."); setAiFlowState('idle'); return; }
                const data = { contextText: aiFormData.contextText, numberOfQuestions: aiFormData.numberOfQuestions, difficulty: aiFormData.difficulty, questionType: aiFormData.questionType };
                setLastGenerationParams({ type: 'text', params: data, language: aiFormData.language });
                response = await generateQuestionsFromText(selectedCourseId, data, aiFormData.language);
            } else {
                if (!aiFormData.file) { toast.warn("الرجاء اختيار ملف أولاً."); setAiFlowState('idle'); return; }
                const formData = new FormData();
                formData.append('File', aiFormData.file); formData.append('NumberOfQuestions', aiFormData.numberOfQuestions); formData.append('Difficulty', aiFormData.difficulty); formData.append('QuestionType', aiFormData.questionType);
                setLastGenerationParams({ type: 'file', params: formData, language: aiFormData.language });
                response = await generateQuestionsFromFile(selectedCourseId, formData, aiFormData.language);
            }
            if (response.data && response.data.length > 0) {
                setGeneratedQuestions(response.data.map(q => ({ ...q, tempId: Math.random() }))); setAiFlowState('reviewing');
                toast.success(`تم توليد ${response.data.length} سؤال بنجاح. الرجاء مراجعتها.`);
            } else { toast.warn("لم يتمكن الذكاء الاصطناعي من توليد أسئلة من المحتوى المقدم."); setAiFlowState('idle'); }
        } catch (error) { toast.error(getDetailedErrorMessage(error, "حدث خطأ أثناء توليد الأسئلة.")); setAiFlowState('idle'); }
        finally { setIsGenerating(false); }
    };
    const handleRegenerate = async () => {
        if (!lastGenerationParams) { toast.error("لا توجد معلومات عن عملية التوليد السابقة."); return; }
        const keepCurrent = window.confirm("هل تريد الاحتفاظ بالأسئلة الحالية وإضافة أسئلة جديدة إليها؟\n\n- اضغط 'موافق' (OK) للإضافة.\n- اضغط 'إلغاء' (Cancel) لاستبدال الكل.");
        setIsGenerating(true);
        try {
            let response;
            if (lastGenerationParams.type === 'text') { response = await generateQuestionsFromText(selectedCourseId, lastGenerationParams.params, lastGenerationParams.language); }
            else { response = await generateQuestionsFromFile(selectedCourseId, lastGenerationParams.params, lastGenerationParams.language); }
            if (response.data && response.data.length > 0) {
                const newQuestions = response.data.map(q => ({ ...q, tempId: Math.random() }));
                if (keepCurrent) { setGeneratedQuestions(prev => [...prev, ...newQuestions]); toast.success(`تم إضافة ${newQuestions.length} سؤال جديد للمراجعة.`); }
                else { setGeneratedQuestions(newQuestions); toast.success(`تم توليد ${newQuestions.length} سؤال جديد بالكامل.`); }
            } else { toast.warn("لم يتمكن الذكاء الاصطناعي من توليد أسئلة إضافية."); }
        } catch (error) { toast.error(getDetailedErrorMessage(error, "فشل في إعادة توليد الأسئلة.")); }
        finally { setIsGenerating(false); }
    };
    const handleGeneratedQuestionChange = (index, field, value, optionIndex = null) => {
        const updatedQuestions = [...generatedQuestions];
        if (optionIndex !== null) {
            updatedQuestions[index].options[optionIndex][field] = value;
            if (field === 'isCorrect' && value === true) { updatedQuestions[index].options.forEach((opt, i) => { if (i !== optionIndex) opt.isCorrect = false; }); }
        } else { updatedQuestions[index][field] = value; }
        setGeneratedQuestions(updatedQuestions);
    };
    const removeGeneratedQuestion = (index) => { setGeneratedQuestions(prev => prev.filter((_, i) => i !== index)); };
    const handleCancelReview = () => { if (window.confirm("هل أنت متأكد من إلغاء هذه المراجعة؟ ستفقد كل الأسئلة المقترحة.")) { setAiFlowState('idle'); setGeneratedQuestions([]); } };
    const handleSaveSingleQuestion = async (tempId, index) => {
        setSavingQuestionId(tempId);
        const q = generatedQuestions[index];
        if (!q.text.trim() || q.options.some(opt => !opt.text.trim()) || !q.options.some(opt => opt.isCorrect)) { toast.warn(`البيانات ناقصة في السؤال المقترح. الرجاء إكمالها قبل الحفظ.`); setSavingQuestionId(null); return; }
        const data = new FormData();
        data.append('Text', q.text || ""); data.append('QuestionType', q.questionType); data.append('DifficultyLevel', q.difficultyLevel);
        q.options.forEach((opt, idx) => { data.append(`Options[${idx}].Text`, opt.text); data.append(`Options[${idx}].IsCorrect`, opt.isCorrect); });
        try {
            await suggestQuestion(selectedCourseId, data); toast.success("تم اعتماد وحفظ السؤال بنجاح.");
            setGeneratedQuestions(prev => prev.filter(item => item.tempId !== tempId)); await fetchQuestions();
        } catch (error) { toast.error(getDetailedErrorMessage(error, "فشل حفظ السؤال.")); }
        finally { setSavingQuestionId(null); }
    };
    const handleSaveAllReviewedQuestions = async () => {
        setIsGenerating(true); let successCount = 0; let errorCount = 0;
        for (const q of generatedQuestions) {
            if (!q.text.trim() || q.options.some(opt => !opt.text.trim()) || !q.options.some(opt => opt.isCorrect)) { errorCount++; continue; }
            const data = new FormData();
            data.append('Text', q.text || ""); data.append('QuestionType', q.questionType); data.append('DifficultyLevel', q.difficultyLevel);
            q.options.forEach((opt, index) => { data.append(`Options[${index}].Text`, opt.text); data.append(`Options[${index}].IsCorrect`, opt.isCorrect); });
            try { await suggestQuestion(selectedCourseId, data); successCount++; } catch (error) { errorCount++; }
        }
        if (successCount > 0) toast.success(`تم حفظ ${successCount} سؤال بنجاح.`);
        if (errorCount > 0) toast.error(`فشل حفظ ${errorCount} سؤال. تأكد من اكتمال بياناتها.`);
        setIsGenerating(false); setAiFlowState('idle'); setGeneratedQuestions([]); await fetchQuestions();
    };

    const getBadge = (type, value) => { const { bg, text } = translateAndColor(type, value); return <Badge bg={bg}>{text}</Badge>; };

    if (loadingCoordinatorStatus) { return <div className="text-center py-5"><Spinner animation="border" /></div>; }
    if (aiFlowState === 'generating') { return <Container fluid><GeneratingLoader /></Container>; }

    return (
        <>
            <Container fluid>
                {aiFlowState === 'reviewing' && (
                    <Card className="mb-4 border-primary shadow">
                        <Card.Header className="bg-primary text-white"><Card.Title as="h4"><i className="fas fa-magic me-2"></i>مراجعة الأسئلة المقترحة من AI</Card.Title><p className="card-category">راجع الأسئلة التالية، قم بتعديلها، ثم اعتمدها بشكل فردي أو جماعي.</p></Card.Header>
                        <Card.Body>
                            {generatedQuestions.length === 0 ? (
                                <Alert variant="success" className="text-center"><h4>ممتاز!</h4><p>لقد قمت بمراجعة واعتماد جميع الأسئلة المقترحة.</p><Button variant="outline-secondary" onClick={handleCancelReview}>العودة إلى بنك الأسئلة</Button></Alert>
                            ) : (
                                generatedQuestions.map((q, index) => (
                                    <Card key={q.tempId} className="mb-3">
                                        <Card.Header className="d-flex justify-content-between align-items-center"><strong>السؤال المقترح #{index + 1}</strong><ButtonGroup><Button variant="success" size="sm" onClick={() => handleSaveSingleQuestion(q.tempId, index)} disabled={savingQuestionId === q.tempId}>{savingQuestionId === q.tempId ? <Spinner size="sm" /> : <><i className="fas fa-check me-2" />اعتماد وحفظ</>}</Button><Button variant="outline-danger" size="sm" onClick={() => removeGeneratedQuestion(index)} title="إزالة هذا السؤال من المراجعة"><i className="fas fa-trash" /></Button></ButtonGroup></Card.Header>
                                        <Card.Body><Form.Group className="mb-3"><Form.Label>نص السؤال</Form.Label><Form.Control as="textarea" rows={2} value={q.text} onChange={e => handleGeneratedQuestionChange(index, 'text', e.target.value)} /></Form.Group><hr /><h6>خيارات الإجابة</h6>{q.options.map((opt, optIndex) => (<Row key={optIndex} className="align-items-center mb-2"><Col xs="auto"><Form.Check type="radio" name={`generatedCorrect_${index}`} checked={opt.isCorrect} onChange={e => handleGeneratedQuestionChange(index, 'isCorrect', e.target.checked, optIndex)} /></Col><Col><Form.Control type="text" placeholder={`نص الخيار ${optIndex + 1}`} value={opt.text} onChange={e => handleGeneratedQuestionChange(index, 'text', e.target.value, optIndex)} required /></Col></Row>))}</Card.Body>
                                    </Card>
                                ))
                            )}
                            {generatedQuestions.length > 0 && (
                                <div className="d-flex justify-content-end gap-2 mt-4"><Button variant="secondary" onClick={handleCancelReview} disabled={isGenerating}>إلغاء المراجعة</Button><Button variant="outline-info" onClick={handleRegenerate} disabled={isGenerating || savingQuestionId}>{isGenerating ? <><Spinner size="sm" /> ...</> : <><i className="fas fa-sync-alt me-2" />إعادة توليد</>}</Button><Button variant="primary" onClick={handleSaveAllReviewedQuestions} disabled={isGenerating || savingQuestionId}>{isGenerating ? <><Spinner size="sm" /> جار الحفظ...</> : <><i className="fas fa-check-double me-2" />اعتماد وحفظ الكل ({generatedQuestions.length})</>}</Button></div>
                            )}
                        </Card.Body>
                    </Card>
                )}
                {aiFlowState !== 'reviewing' && (
                    <>
                        <Card className="mb-4">
                            <Card.Header><Card.Title as="h4">بنك الأسئلة</Card.Title><p className="card-category">{isCurrentUserCoordinator ? "عرض ومراجعة أسئلة الدورات التي تنسقها" : "عرض وإدارة الأسئلة التي اقترحتها"}</p></Card.Header>
                            <Card.Body><Row className="align-items-end"><Col md={4}><Form.Group><Form.Label>اختر الدورة:</Form.Label><Form.Select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>{availableCourses.map(course => (<option key={course.courseId} value={course.courseId}>{course.name} ({course.academicProgramName})</option>))}</Form.Select></Form.Group></Col><Col md={4}><Form.Group><Form.Label>بحث في نص السؤال:</Form.Label><Form.Control type="text" placeholder="اكتب للبحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></Form.Group></Col><Col md={4} className="d-flex justify-content-end gap-2"><Button variant="info" onClick={handleShowAiModal} disabled={!selectedCourseId}><i className="fas fa-magic me-2"></i> إنشاء بالـ AI</Button><Button variant="success" onClick={handleShowAddModal}><i className="fas fa-plus me-2"></i> {isCurrentUserCoordinator ? 'إضافة سؤال' : 'اقتراح سؤال'}</Button></Col></Row></Card.Body>
                        </Card>
                        {isCurrentUserCoordinator && (<div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"><h5 className="mb-0">الأسئلة ({filteredQuestions.length})</h5><div className="d-flex flex-wrap gap-2"><ButtonGroup><Button variant={filterStatus === 'All' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setFilterStatus('All')}>الكل</Button><Button variant={filterStatus === 'Pending' ? 'warning' : 'outline-warning'} size="sm" onClick={() => setFilterStatus('Pending')}>قيد المراجعة</Button><Button variant={filterStatus === 'Approved' ? 'success' : 'outline-success'} size="sm" onClick={() => setFilterStatus('Approved')}>معتمد</Button><Button variant={filterStatus === 'Rejected' ? 'danger' : 'outline-danger'} size="sm" onClick={() => setFilterStatus('Rejected')}>مرفوض</Button></ButtonGroup><ButtonGroup><Button variant={filterDifficulty === 'All' ? 'dark' : 'outline-dark'} size="sm" onClick={() => setFilterDifficulty('All')}>كل الصعوبات</Button><Button variant={filterDifficulty === 'Easy' ? 'success' : 'outline-success'} size="sm" onClick={() => setFilterDifficulty('Easy')}>سهل</Button><Button variant={filterDifficulty === 'Medium' ? 'warning' : 'outline-warning'} size="sm" onClick={() => setFilterDifficulty('Medium')}>متوسط</Button><Button variant={filterDifficulty === 'Hard' ? 'danger' : 'outline-danger'} size="sm" onClick={() => setFilterDifficulty('Hard')}>صعب</Button></ButtonGroup></div></div>)}
                        {loadingQuestions ? (<div className="text-center py-5"><Spinner animation="border" /></div>)
                            : filteredQuestions.length > 0 ? (
                                filteredQuestions.map(q => (
                                    <Card key={q.questionId} className={`mb-3 shadow-sm ${getDifficultyCardClass(q.difficultyLevel)}`}>
                                        <Card.Header className="d-flex justify-content-between align-items-center bg-light"><div className='d-flex align-items-center flex-wrap gap-2'>{isCurrentUserCoordinator && <><span> {q.createdBy} <strong> :أنشئ بواسطة</strong></span><Badge bg="white" text="dark" className='p-1'>|</Badge></>}<span>{getBadge('status', q.status)}</span></div><div className="d-flex gap-2">{isCurrentUserCoordinator && (q.status === 'Approved' || q.status === 'Rejected') && <Button variant="outline-secondary" size="sm" title="إعادة للمراجعة" onClick={() => handleRevertReview(q.questionId)}><i className="fas fa-undo"></i></Button>}{isCurrentUserCoordinator && q.status === 'Pending' && <Button variant="info" size="sm" title="مراجعة" onClick={() => handleShowReviewModal(q)}><i className="fas fa-check-double"></i></Button>}<Button variant="secondary" size="sm" title="تعديل" onClick={() => handleShowEditModal(q)}><i className="fas fa-edit"></i></Button><Button variant="danger" size="sm" title="حذف" onClick={() => handleDelete(q.questionId)}><i className="fas fa-trash"></i></Button></div></Card.Header>
                                        <Card.Body style={{ textAlign: 'end', paddingRight: '25px' }}>{q.text && <p className="lead">{q.text}</p>}{q.imageUrl && <Image src={`${q.imageUrl}`} thumbnail style={{ maxHeight: '200px', cursor: 'pointer' }} onClick={() => window.open(`${q.imageUrl}`, '_blank')} />}<hr /><ul className="list-unstyled" style={{ textAlign: 'start', paddingLeft: '20px' }}>{q.options.map((opt) => (<li key={opt.questionOptionId} className={opt.isCorrect ? 'font-weight-bold text-success' : ''}><i className={`fas ${opt.isCorrect ? 'fa-check-circle text-success' : 'fa-circle text-muted'} me-2`}></i>{opt.text}</li>))}</ul></Card.Body>
                                    </Card>
                                ))
                            ) : (<Card><Card.Body className="text-center text-muted p-5"><i className="nc-icon nc-zoom-split display-4 mb-3"></i><h4>لا توجد أسئلة</h4><p>لا توجد أسئلة تطابق معايير البحث والفلترة الحالية.</p></Card.Body></Card>)}
                    </>
                )}
            </Container>
            <Modal show={showAiModal} onHide={handleCloseAiModal} size="lg" centered>
                <Modal.Header closeButton><Modal.Title><i className="fas fa-magic text-info me-2"></i>مساعد توليد الأسئلة</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Alert variant="info">اختر طريقة التوليد. يمكنك إما لصق محتوى نصي مباشرة أو رفع ملف (PDF) ليقوم الذكاء الاصطناعي بتحليله.</Alert>
                    <Tabs defaultActiveKey="text" id="ai-generation-tabs" className="mb-3">
                        <Tab eventKey="text" title="من نص"><Form onSubmit={(e) => handleAiSubmit(e, 'text')}><Form.Group className="mb-3"><Form.Label>المحتوى النصي <span className="text-danger">*</span></Form.Label><Form.Control as="textarea" rows={8} placeholder="الصق هنا المادة العلمية (100 حرف على الأقل)..." name="contextText" value={aiFormData.contextText} onChange={handleAiFormChange} required /></Form.Group><Button variant="primary" type="submit" disabled={isGenerating}>{isGenerating ? <><Spinner size="sm" /> جار التوليد...</> : "توليد الأسئلة"}</Button></Form></Tab>
                        <Tab eventKey="file" title="من ملف"><Form onSubmit={(e) => handleAiSubmit(e, 'file')}><Form.Group className="mb-3"><Form.Label>رفع ملف (PDF) <span className="text-danger">*</span></Form.Label><Form.Control type="file" accept=".pdf" name="file" onChange={handleAiFormChange} required /></Form.Group><Button variant="primary" type="submit" disabled={isGenerating}>{isGenerating ? <><Spinner size="sm" /> جار التوليد...</> : "توليد الأسئلة"}</Button></Form></Tab>
                    </Tabs>
                    <hr />
                    <Row>
                        <Col md={3}><Form.Group><Form.Label>لغة المخرجات</Form.Label><Form.Select name="language" value={aiFormData.language} onChange={handleAiFormChange}><option value="Arabic">العربية</option><option value="English">الإنجليزية</option></Form.Select></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label>عدد الأسئلة</Form.Label><Form.Control type="number" min="1" max="20" name="numberOfQuestions" value={aiFormData.numberOfQuestions} onChange={handleAiFormChange} /></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label>مستوى الصعوبة</Form.Label><Form.Select name="difficulty" value={aiFormData.difficulty} onChange={handleAiFormChange}><option value="Easy">سهل</option><option value="Medium">متوسط</option><option value="Hard">صعب</option></Form.Select></Form.Group></Col>
                        <Col md={3}><Form.Group><Form.Label>نوع السؤال</Form.Label><Form.Select name="questionType" value={aiFormData.questionType} onChange={handleAiFormChange}><option value="MultipleChoice">اختيار متعدد</option><option value="TrueFalse">صح / خطأ</option></Form.Select></Form.Group></Col>
                    </Row>
                </Modal.Body>
            </Modal>
            <Modal show={showReviewModal} onHide={handleCloseReviewModal} centered><Modal.Header closeButton><Modal.Title>مراجعة السؤال</Modal.Title></Modal.Header><Modal.Body><p>أنت على وشك مراجعة السؤال التالي:</p><blockquote className="blockquote"><p className="mb-0">{questionToReview?.text || "سؤال مصور"}</p></blockquote><p className="mt-3">الرجاء اختيار الإجراء:</p></Modal.Body><Modal.Footer><Button variant="secondary" onClick={handleCloseReviewModal} disabled={isSubmittingReview}>إلغاء</Button><Button variant="danger" onClick={() => handleReviewSubmit('Rejected')} disabled={isSubmittingReview}>{isSubmittingReview ? <Spinner size="sm" /> : "رفض"}</Button><Button variant="success" onClick={() => handleReviewSubmit('Approved')} disabled={isSubmittingReview}>{isSubmittingReview ? <Spinner size="sm" /> : "قبول"}</Button></Modal.Footer></Modal>
            <Modal show={showFormModal} onHide={handleCloseFormModal} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>{!!questionToEdit ? 'تعديل سؤال' : 'اقتراح سؤال جديد'}</Modal.Title></Modal.Header>
                <Form onSubmit={handleFormSubmit}>
                    <fieldset disabled={submittingForm}>
                        <Modal.Body>
                            <Form.Group className="mb-3"><Form.Label>نص السؤال</Form.Label><Form.Control as="textarea" rows={3} name="text" value={formData.text} onChange={handleInputChange} /></Form.Group>
                            {questionToEdit?.imageUrl && !imagePreview && (<div className="mb-3 p-2 border rounded"> <div className="d-flex justify-content-between align-items-center"><small>الصورة الحالية:</small><Button variant="link" size="sm" onClick={() => handleShowImage(questionToEdit.imageUrl)}>عرض وتكبير</Button></div><Image src={`${questionToEdit.imageUrl}`} thumbnail style={{ maxHeight: '100px' }} /><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Form.Check type="checkbox" id="delete-image-check" className="mt-2" checked={deleteCurrentImage} onChange={(e) => setDeleteCurrentImage(e.target.checked)} /><label>حذف الصورة الحالية </label></div></div>)}
                            <Form.Group className="mb-3"><Form.Label>{!!questionToEdit ? 'رفع صورة جديدة (اختياري)' : 'صورة السؤال (اختياري)'}</Form.Label><Form.Control type="file" accept="image/*" onChange={handleImageChange} />{imagePreview && <Image src={imagePreview} thumbnail className="mt-2" style={{ maxHeight: '150px' }} />}</Form.Group>
                            <Row className="mb-3"><Col md={6}><Form.Group><Form.Label>نوع السؤال</Form.Label><Form.Select name="questionType" value={formData.questionType} onChange={handleQuestionTypeChange} disabled={!!questionToEdit}><option value="MultipleChoice">اختيار من متعدد</option><option value="TrueFalse">صح / خطأ</option></Form.Select></Form.Group></Col><Col md={6}><Form.Group><Form.Label>مستوى الصعوبة</Form.Label><Form.Select name="difficultyLevel" value={formData.difficultyLevel} onChange={handleInputChange}><option value="Easy">سهل</option><option value="Medium">متوسط</option><option value="Hard">صعب</option></Form.Select></Form.Group></Col></Row>
                            <hr /><h6>خيارات الإجابة <span className="text-danger">*</span></h6>
                            {formData.options.map((opt, index) => (<Row key={index} className="align-items-center mb-2"><Col xs="auto"><Form.Check type="radio" name={`correctOption_${questionToEdit?.questionId || 'new'}`} checked={opt.isCorrect} onChange={e => handleOptionChange(index, 'isCorrect', e.target.checked)} /></Col><Col><Form.Control type="text" placeholder={`نص الخيار ${index + 1}`} value={opt.text} onChange={e => handleOptionChange(index, 'text', e.target.value)} required disabled={formData.questionType === 'TrueFalse' && !questionToEdit} /></Col><Col xs="auto">{formData.questionType === 'MultipleChoice' && <Button variant="outline-danger" size="sm" onClick={() => removeOption(index)} disabled={formData.options.length <= 2}><i className="fas fa-times" /></Button>}</Col></Row>))}
                            {formData.questionType === 'MultipleChoice' && <Button variant="link" size="sm" onClick={addOption}>+ إضافة خيار</Button>}
                        </Modal.Body>
                    </fieldset>
                    <Modal.Footer><Button variant="secondary" onClick={handleCloseFormModal} disabled={submittingForm}>إلغاء</Button><Button variant="primary" type="submit" disabled={submittingForm}>{submittingForm ? <><Spinner size="sm" as="span" animation="border" role="status" aria-hidden="true" /> جار الحفظ...</> : "حفظ"}</Button></Modal.Footer>
                </Form>
            </Modal>
            <Modal show={showImageModal} onHide={handleCloseImageModal} size="lg" centered><Modal.Header closeButton><Modal.Title>عرض الصورة</Modal.Title></Modal.Header><Modal.Body className="text-center"><Image src={imageToShow} fluid /></Modal.Body></Modal>
        </>
    );
}

export default QuestionBankManagement;