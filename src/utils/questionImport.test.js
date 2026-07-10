import { describe, it, expect } from 'vitest';
import {
  parseCsvText, resolveExamId, validateChoiceMultiRows,
  validateTrueFalseRows, validateDragdropRows, validateRows,
} from './questionImport';

const LEVEL_1 = { id: 'lvl-1', version: 'GS6', level_number: 1, label: 'Level 1' };
const EXAM_T1 = { id: 'exam-t1', level_id: 'lvl-1', exam_type: 'testing', exam_number: 1 };
const refs = { levels: [LEVEL_1], exams: [EXAM_T1] };

describe('parseCsvText', () => {
  it('parses headers and rows, skipping blank lines', () => {
    const csv = 'content,answer_1\n"Câu hỏi, có phẩy",Đáp án\n\n';
    expect(parseCsvText(csv)).toEqual([{ content: 'Câu hỏi, có phẩy', answer_1: 'Đáp án' }]);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsvText('')).toEqual([]);
  });
});

describe('resolveExamId', () => {
  it('resolves a matching level + exam', () => {
    const row = { level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1' };
    expect(resolveExamId(row, refs)).toEqual({ examId: 'exam-t1' });
  });

  it('errors when the level does not exist', () => {
    const row = { level_version: 'GS7', level_number: '1', exam_type: 'testing', exam_number: '1' };
    expect(resolveExamId(row, refs).error).toMatch(/Level/);
  });

  it('errors when the exam does not exist under a valid level', () => {
    const row = { level_version: 'GS6', level_number: '1', exam_type: 'gmetrix', exam_number: '9' };
    expect(resolveExamId(row, refs).error).toMatch(/bài/);
  });
});

describe('validateChoiceMultiRows', () => {
  const baseRow = {
    level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1', order_index: '1',
    question_type: 'choice', content: 'Câu hỏi mẫu',
    answer_1: 'A', answer_1_correct: 'TRUE',
    answer_2: 'B', answer_2_correct: 'FALSE',
  };

  it('accepts a valid choice row', () => {
    const { questions, errors } = validateChoiceMultiRows([baseRow], refs);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(1);
    expect(questions[0].answers).toHaveLength(2);
  });

  it('accepts a valid multi row with 2+ correct answers', () => {
    const row = { ...baseRow, question_type: 'multi', answer_2_correct: 'TRUE' };
    const { questions, errors } = validateChoiceMultiRows([row], refs);
    expect(errors).toHaveLength(0);
    expect(questions[0].answers.filter(a => a.is_correct)).toHaveLength(2);
  });

  it('rejects a choice row with 0 correct answers', () => {
    const row = { ...baseRow, answer_1_correct: 'FALSE' };
    const { errors } = validateChoiceMultiRows([row], refs);
    expect(errors[0].message).toMatch(/đúng 1 đáp án đúng/);
  });

  it('rejects a choice row with 2 correct answers', () => {
    const row = { ...baseRow, answer_2_correct: 'TRUE' };
    const { errors } = validateChoiceMultiRows([row], refs);
    expect(errors[0].message).toMatch(/đúng 1 đáp án đúng/);
  });

  it('rejects a row with fewer than 2 answers', () => {
    const row = { ...baseRow, answer_2: '', answer_2_correct: '' };
    const { errors } = validateChoiceMultiRows([row], refs);
    expect(errors[0].message).toMatch(/ít nhất 2 đáp án/);
  });

  it('rejects an unresolvable exam', () => {
    const row = { ...baseRow, exam_number: '99' };
    const { errors } = validateChoiceMultiRows([row], refs);
    expect(errors[0].message).toMatch(/bài/);
  });

  it('rejects missing content', () => {
    const row = { ...baseRow, content: '' };
    const { errors } = validateChoiceMultiRows([row], refs);
    expect(errors[0].message).toMatch(/nội dung/);
  });
});

describe('validateTrueFalseRows', () => {
  const baseRow = {
    level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1', order_index: '1',
    content: 'Nhận định chung',
    statement_1: 'A đúng', statement_1_is_true: 'TRUE',
    statement_2: 'B sai', statement_2_is_true: 'FALSE',
  };

  it('accepts a row with 2+ statements', () => {
    const { questions, errors } = validateTrueFalseRows([baseRow], refs);
    expect(errors).toHaveLength(0);
    expect(questions[0].statements).toHaveLength(2);
  });

  it('rejects a row with fewer than 2 statements', () => {
    const row = { ...baseRow, statement_2: '', statement_2_is_true: '' };
    const { errors } = validateTrueFalseRows([row], refs);
    expect(errors[0].message).toMatch(/ít nhất 2 nhận định/);
  });
});

describe('validateDragdropRows', () => {
  it('groups pair rows sharing the same content into one question', () => {
    const rows = [
      { level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1', order_index: '2', content: 'Xếp nhóm', drag_content: 'Word', drop_content: 'Soạn thảo' },
      { level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1', order_index: '2', content: 'Xếp nhóm', drag_content: 'Excel', drop_content: 'Bảng tính' },
    ];
    const { questions, errors } = validateDragdropRows(rows, refs);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(1);
    expect(questions[0].pairs).toHaveLength(2);
  });

  it('rejects a pair missing drop_content', () => {
    const rows = [
      { level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1', content: 'Xếp nhóm', drag_content: 'Word', drop_content: '' },
    ];
    const { errors } = validateDragdropRows(rows, refs);
    expect(errors[0].message).toMatch(/drag_content và drop_content/);
  });
});

describe('validateRows (combined)', () => {
  it('merges questions and errors across all three sheets', () => {
    const sheets = {
      choice_multi: [{
        level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1',
        question_type: 'choice', content: 'Q1', answer_1: 'A', answer_1_correct: 'TRUE', answer_2: 'B', answer_2_correct: 'FALSE',
      }],
      truefalse: [{
        level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1',
        content: 'Q2', statement_1: 'S1', statement_1_is_true: 'TRUE', statement_2: 'S2', statement_2_is_true: 'FALSE',
      }],
      dragdrop: [
        { level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1', content: 'Q3', drag_content: 'A', drop_content: 'X' },
      ],
    };
    const { questions, errors } = validateRows(sheets, refs);
    expect(errors).toHaveLength(0);
    expect(questions).toHaveLength(3);
  });

  it('rejects a "hotspot" question_type in the choice_multi sheet', () => {
    const sheets = {
      choice_multi: [{
        level_version: 'GS6', level_number: '1', exam_type: 'testing', exam_number: '1',
        question_type: 'hotspot', content: 'Q1', answer_1: 'A', answer_1_correct: 'TRUE', answer_2: 'B', answer_2_correct: 'FALSE',
      }],
    };
    const { errors } = validateRows(sheets, refs);
    expect(errors[0].message).toMatch(/choice.*multi/);
  });
});
