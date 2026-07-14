import { sanitizeHtml } from './sanitizeHtml';

export const SHEET_NAMES = ['choice_multi', 'dragdrop', 'truefalse'];

/* ExcelJS is ~950kB — load on demand (template download / .xlsx parse) instead of
   bundling it into QuestionImportPage's chunk, so the page shell renders instantly. */
let _exceljsPromise;
const loadExcelJS = () => {
  if (!_exceljsPromise) _exceljsPromise = import('exceljs').then((m) => m.default ?? m);
  return _exceljsPromise;
};

const cell = (v) => (v == null ? '' : String(v).trim());

const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  const s = cell(v).toLowerCase();
  return s === 'true' || s === '1' || s === 'x' || s === 'có' || s === 'yes';
};

/* ── CSV parsing (RFC4180-ish: quoted fields, embedded commas/newlines, "" escaping) ── */
export function parseCsvText(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* line-end handled by \n */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(v => (v || '').trim() !== ''))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] ?? ''; });
      return obj;
    });
}

/* ── .xlsx parsing → { choice_multi: [rows], dragdrop: [rows], truefalse: [rows] } ── */
export async function parseWorkbookFile(arrayBuffer) {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(arrayBuffer);
  const sheets = {};
  for (const name of SHEET_NAMES) {
    const ws = wb.getWorksheet(name);
    if (!ws) continue;
    const headers = (ws.getRow(1).values || []).slice(1).map(cell);
    const rows = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = (row.values || []).slice(1);
      if (!values.some(v => cell(v) !== '')) return;
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cell(values[i]); });
      rows.push(obj);
    });
    sheets[name] = rows;
  }
  return sheets;
}

/* ── Resolve exam_id from level_version + level_number + exam_type + exam_number ── */
export function resolveExamId(row, { levels, exams }) {
  const version = cell(row.level_version).toUpperCase();
  const levelNumber = Number(row.level_number);
  const examType = cell(row.exam_type).toLowerCase();
  const examNumber = Number(row.exam_number);

  const level = levels.find(l => l.version.toUpperCase() === version && l.level_number === levelNumber);
  if (!level) return { error: `Không tìm thấy Level "${row.level_version} ${row.level_number}"` };

  const exam = exams.find(e => e.level_id === level.id && e.exam_type === examType && e.exam_number === examNumber);
  if (!exam) return { error: `Không tìm thấy bài "${examType || '?'} ${row.exam_number}" ở Level ${version} ${row.level_number}` };

  return { examId: exam.id };
}

/* ── Per-sheet validators ── */
export function validateChoiceMultiRows(rows, refs) {
  const questions = [];
  const errors = [];
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const { examId, error } = resolveExamId(row, refs);
    if (error) { errors.push({ sheet: 'choice_multi', row: rowNum, message: error }); return; }

    const questionType = cell(row.question_type).toLowerCase();
    if (!['choice', 'multi'].includes(questionType)) {
      errors.push({ sheet: 'choice_multi', row: rowNum, message: 'question_type phải là "choice" hoặc "multi"' });
      return;
    }
    const content = cell(row.content);
    if (!content) {
      errors.push({ sheet: 'choice_multi', row: rowNum, message: 'Thiếu nội dung câu hỏi' });
      return;
    }
    const answers = [];
    for (let i = 1; i <= 6; i++) {
      const text = cell(row[`answer_${i}`]);
      if (!text) continue;
      answers.push({ content: text, is_correct: toBool(row[`answer_${i}_correct`]) });
    }
    if (answers.length < 2) {
      errors.push({ sheet: 'choice_multi', row: rowNum, message: 'Cần ít nhất 2 đáp án' });
      return;
    }
    const correctCount = answers.filter(a => a.is_correct).length;
    if (questionType === 'choice' && correctCount !== 1) {
      errors.push({ sheet: 'choice_multi', row: rowNum, message: 'Câu "choice" cần đúng 1 đáp án đúng' });
      return;
    }
    if (questionType === 'multi' && correctCount < 1) {
      errors.push({ sheet: 'choice_multi', row: rowNum, message: 'Câu "multi" cần ít nhất 1 đáp án đúng' });
      return;
    }
    questions.push({
      examId, question_type: questionType, content,
      order_index: Number(row.order_index) || 0,
      answers: answers.map((a, i) => ({ ...a, image_url: null, order_index: i })),
    });
  });
  return { questions, errors };
}

export function validateTrueFalseRows(rows, refs) {
  const questions = [];
  const errors = [];
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const { examId, error } = resolveExamId(row, refs);
    if (error) { errors.push({ sheet: 'truefalse', row: rowNum, message: error }); return; }

    const content = cell(row.content);
    if (!content) {
      errors.push({ sheet: 'truefalse', row: rowNum, message: 'Thiếu nội dung câu hỏi' });
      return;
    }
    const statements = [];
    for (let i = 1; i <= 8; i++) {
      const text = cell(row[`statement_${i}`]);
      if (!text) continue;
      statements.push({ content: text, is_true: toBool(row[`statement_${i}_is_true`]) });
    }
    if (statements.length < 2) {
      errors.push({ sheet: 'truefalse', row: rowNum, message: 'Cần ít nhất 2 nhận định' });
      return;
    }
    questions.push({
      examId, question_type: 'truefalse', content,
      order_index: Number(row.order_index) || 0,
      statements: statements.map((s, i) => ({ ...s, order_index: i })),
    });
  });
  return { questions, errors };
}

export function validateDragdropRows(rows, refs) {
  const errors = [];
  const groups = new Map();
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const key = [
      cell(row.level_version), cell(row.level_number),
      cell(row.exam_type).toLowerCase(), cell(row.exam_number), cell(row.content),
    ].join('|');
    if (!groups.has(key)) groups.set(key, { rows: [], firstRowNum: rowNum, meta: row });
    groups.get(key).rows.push({ row, rowNum });
  });

  const questions = [];
  for (const { rows: groupRows, firstRowNum, meta } of groups.values()) {
    const { examId, error } = resolveExamId(meta, refs);
    if (error) { errors.push({ sheet: 'dragdrop', row: firstRowNum, message: error }); continue; }

    const content = cell(meta.content);
    if (!content) { errors.push({ sheet: 'dragdrop', row: firstRowNum, message: 'Thiếu nội dung câu hỏi' }); continue; }

    const pairs = [];
    let rowError = null;
    groupRows.forEach(({ row, rowNum }) => {
      const dragContent = cell(row.drag_content);
      const dropContent = cell(row.drop_content);
      if (!dragContent || !dropContent) {
        rowError = { sheet: 'dragdrop', row: rowNum, message: 'Mỗi cặp cần đủ drag_content và drop_content' };
      } else {
        pairs.push({ drag_content: dragContent, drop_content: dropContent });
      }
    });
    if (rowError) { errors.push(rowError); continue; }
    if (pairs.length < 1) { errors.push({ sheet: 'dragdrop', row: firstRowNum, message: 'Cần ít nhất 1 cặp kéo-thả' }); continue; }

    questions.push({
      examId, question_type: 'dragdrop', content,
      order_index: Number(meta.order_index) || 0,
      pairs: pairs.map((p, i) => ({ ...p, drag_image_url: null, drop_image_url: null, order_index: i })),
    });
  }
  return { questions, errors };
}

/* ── Combine all sheets ── */
export function validateRows(sheets, refs) {
  const cm = validateChoiceMultiRows(sheets.choice_multi || [], refs);
  const dd = validateDragdropRows(sheets.dragdrop || [], refs);
  const tf = validateTrueFalseRows(sheets.truefalse || [], refs);
  return {
    questions: [...cm.questions, ...dd.questions, ...tf.questions],
    errors: [...cm.errors, ...dd.errors, ...tf.errors],
  };
}

/* ── Commit validated questions to Supabase, mirroring QuestionFormPage's doSave insert pattern ── */
export async function commitQuestions(supabase, questions) {
  const affectedExamIds = new Set();
  const results = [];

  for (const q of questions) {
    let qId = null;
    try {
      const { data, error } = await supabase.from('questions').insert({
        exam_id: q.examId, question_type: q.question_type, content: sanitizeHtml(q.content),
        image_url: null, order_index: q.order_index, hotspot_multi: false,
      }).select('id').single();
      if (error) throw error;
      qId = data.id;

      if (q.question_type === 'truefalse') {
        const rows = q.statements.map(s => ({ question_id: qId, content: sanitizeHtml(s.content), is_true: s.is_true, order_index: s.order_index }));
        const { error: e2 } = await supabase.from('truefalse_statements').insert(rows);
        if (e2) throw e2;
      } else if (q.question_type === 'dragdrop') {
        const rows = q.pairs.map(p => ({
          question_id: qId, drag_content: p.drag_content, drag_image_url: p.drag_image_url,
          drop_content: p.drop_content, drop_image_url: p.drop_image_url, order_index: p.order_index,
        }));
        const { error: e2 } = await supabase.from('dragdrop_pairs').insert(rows);
        if (e2) throw e2;
      } else {
        const rows = q.answers.map(a => ({ question_id: qId, content: sanitizeHtml(a.content), image_url: a.image_url, is_correct: a.is_correct, order_index: a.order_index }));
        const { error: e2 } = await supabase.from('answers').insert(rows);
        if (e2) throw e2;
      }

      affectedExamIds.add(q.examId);
      results.push({ ok: true, question: q });
    } catch (err) {
      // The parent `questions` row may already be committed even though its
      // answers/pairs/statements failed to insert — without this, a transient
      // error here leaves a ghost question with zero sub-rows: renders blank
      // and unscoreable to a student, and silently pollutes QuestionsPage.
      if (qId) await supabase.from('questions').delete().eq('id', qId);
      results.push({ ok: false, question: q, message: err.message });
    }
  }

  for (const examId of affectedExamIds) {
    await supabase.rpc('reorder_questions_in_exam', { p_exam_id: examId });
  }

  return results;
}

/* ── Downloadable template workbook ── */
export async function buildTemplateWorkbook() {
  const ExcelJS = await loadExcelJS();
  const wb = new ExcelJS.Workbook();
  const common = ['level_version', 'level_number', 'exam_type', 'exam_number', 'order_index'];

  const cm = wb.addWorksheet('choice_multi');
  cm.columns = [...common, 'question_type', 'content',
    'answer_1', 'answer_1_correct', 'answer_2', 'answer_2_correct',
    'answer_3', 'answer_3_correct', 'answer_4', 'answer_4_correct',
    'answer_5', 'answer_5_correct', 'answer_6', 'answer_6_correct',
  ].map(key => ({ header: key, key, width: 16 }));
  cm.addRow({
    level_version: 'GS6', level_number: 1, exam_type: 'testing', exam_number: 1, order_index: 1,
    question_type: 'choice', content: 'Đâu là hệ điều hành?',
    answer_1: 'Windows', answer_1_correct: 'TRUE',
    answer_2: 'Word', answer_2_correct: 'FALSE',
    answer_3: 'Excel', answer_3_correct: 'FALSE',
  });

  const dd = wb.addWorksheet('dragdrop');
  dd.columns = [...common, 'content', 'pair_index', 'drag_content', 'drop_content']
    .map(key => ({ header: key, key, width: 18 }));
  dd.addRow({ level_version: 'GS6', level_number: 1, exam_type: 'testing', exam_number: 1, order_index: 2, content: 'Xếp phần mềm vào đúng nhóm', pair_index: 1, drag_content: 'Word', drop_content: 'Soạn thảo' });
  dd.addRow({ level_version: 'GS6', level_number: 1, exam_type: 'testing', exam_number: 1, order_index: 2, content: 'Xếp phần mềm vào đúng nhóm', pair_index: 2, drag_content: 'Excel', drop_content: 'Bảng tính' });

  const tf = wb.addWorksheet('truefalse');
  tf.columns = [...common, 'content',
    'statement_1', 'statement_1_is_true', 'statement_2', 'statement_2_is_true',
    'statement_3', 'statement_3_is_true', 'statement_4', 'statement_4_is_true',
  ].map(key => ({ header: key, key, width: 20 }));
  tf.addRow({
    level_version: 'GS6', level_number: 1, exam_type: 'testing', exam_number: 1, order_index: 3,
    content: 'Nhận định về máy tính',
    statement_1: 'RAM là bộ nhớ tạm', statement_1_is_true: 'TRUE',
    statement_2: 'CPU dùng để lưu trữ vĩnh viễn', statement_2_is_true: 'FALSE',
  });

  const readme = wb.addWorksheet('README');
  readme.columns = [{ header: 'Hướng dẫn nhập câu hỏi hàng loạt', key: 'text', width: 100 }];
  [
    'Điền câu hỏi vào đúng sheet theo loại: choice_multi (chọn một/chọn nhiều), dragdrop (kéo thả), truefalse (đúng/sai).',
    'Không hỗ trợ loại "hotspot" (chọn vùng ảnh) — cần toạ độ kéo chuột, không thể nhập qua bảng tính.',
    'Không hỗ trợ upload ảnh qua import — sau khi import, vào sửa câu hỏi để thêm ảnh nếu cần.',
    'level_version / level_number / exam_type / exam_number phải khớp với bài thi đã có sẵn trong hệ thống (vd: GS6, 1, testing, 1).',
    'order_index không bắt buộc — để trống hệ thống sẽ tự sắp xếp lại theo thứ tự import.',
    'Sheet choice_multi: answer_N_correct ghi TRUE cho đáp án đúng. Loại "choice" cần đúng 1 đáp án đúng, "multi" cần ít nhất 1.',
    'Sheet dragdrop: mỗi dòng là 1 cặp kéo-thả. Các dòng cùng content + cùng bài thi được gộp thành 1 câu hỏi. drop_content trùng nhau giữa các cặp = cùng 1 cột thả.',
    'Sheet truefalse: content là câu dẫn chung, mỗi statement_N là 1 nhận định, cần tối thiểu 2 nhận định.',
  ].forEach(line => readme.addRow({ text: line }));

  return wb;
}
