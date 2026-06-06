import React, { useId } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { RichTextEditor } from './RichTextEditor';

const DEFAULT_ANSWER = () => ({
  id: crypto.randomUUID(),
  content: '',
  image_url: null,
  is_correct: false,
  order_index: 0,
});

/**
 * @param {object} props
 * @param {Array} props.answers - list of answer objects
 * @param {function} props.onChange - called with updated answers array
 * @param {boolean} props.multiSelect - true for 'multi', false for 'choice'
 */
export const AnswerEditor = ({ answers, onChange, multiSelect = false }) => {
  const groupName = useId();

  const update = (index, field, val) => {
    const next = answers.map((a, i) => {
      if (i !== index) {
        if (!multiSelect && field === 'is_correct' && val) {
          return { ...a, is_correct: false };
        }
        return a;
      }
      return { ...a, [field]: val };
    });
    onChange(next);
  };

  const handleRadioChange = (index) => {
    const next = answers.map((a, i) => ({ ...a, is_correct: i === index }));
    onChange(next);
  };

  const addAnswer = () => {
    onChange([...answers, { ...DEFAULT_ANSWER(), order_index: answers.length }]);
  };

  const removeAnswer = (index) => {
    onChange(answers.filter((_, i) => i !== index));
  };

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-700 flex items-center flex-wrap gap-1.5">
          Đáp án
          {multiSelect
            ? <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">☑ Chọn nhiều đáp án đúng</span>
            : <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">🔘 Chọn một đáp án đúng</span>
          }
        </p>
        <button
          type="button"
          onClick={addAnswer}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-semibold gap-1 whitespace-nowrap flex-shrink-0 px-3 py-1.5 border border-indigo-200 hover:border-indigo-400 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm đáp án
        </button>
      </div>

      {answers.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
          Chưa có đáp án nào. Bấm "Thêm đáp án" để bắt đầu.
        </p>
      )}

      <div className="space-y-3">
        {answers.map((answer, index) => (
          <div
            key={answer.id}
            className={`relative rounded-2xl border-2 overflow-hidden transition-all ${
              answer.is_correct
                ? 'border-emerald-400 shadow-sm shadow-emerald-100'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* ── Card header: letter badge + correct toggle + delete ── */}
            <div className={`flex items-center gap-3 px-3 py-2.5 border-b ${
              answer.is_correct ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />

              {/* Letter badge */}
              <span className={`w-7 h-7 rounded-xl text-sm font-extrabold flex items-center justify-center flex-shrink-0 ${
                answer.is_correct
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {LETTERS[index] ?? index + 1}
              </span>

              {/* Correct toggle */}
              <label className="flex items-center gap-2 cursor-pointer flex-1">
                <input
                  type={multiSelect ? 'checkbox' : 'radio'}
                  name={groupName}
                  checked={answer.is_correct}
                  onChange={
                    multiSelect
                      ? (e) => update(index, 'is_correct', e.target.checked)
                      : () => handleRadioChange(index)
                  }
                  className="w-4 h-4 accent-emerald-500 flex-shrink-0"
                />
                <span className={`text-xs font-semibold ${answer.is_correct ? 'text-emerald-700' : 'text-gray-400'}`}>
                  {answer.is_correct ? '✔ Đáp án đúng' : 'Đánh dấu là đúng'}
                </span>
              </label>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                title="Xóa đáp án"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* ── Card body: rich text editor ── */}
            <div className="p-3 space-y-2 bg-white">
              <RichTextEditor
                value={answer.content}
                onChange={(html) => update(index, 'content', html)}
                placeholder={`Nội dung đáp án ${LETTERS[index] ?? index + 1}... (có thể in đậm, đổi màu...)`}
                minHeight={52}
                hasError={false}
              />

              {/* Image uploader */}
              <div className="pt-1">
                <ImageUploader
                  bucket="answer-images"
                  value={answer.image_url}
                  onChange={(url) => update(index, 'image_url', url)}
                  label="Ảnh đáp án (tuỳ chọn)"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
