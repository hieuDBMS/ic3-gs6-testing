import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ImageUploader } from './ImageUploader';

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
  const update = (index, field, val) => {
    const next = answers.map((a, i) => {
      if (i !== index) {
        // For single-choice: deselect others when one is selected
        if (!multiSelect && field === 'is_correct' && val) {
          return { ...a, is_correct: false };
        }
        return a;
      }
      return { ...a, [field]: val };
    });
    onChange(next);
  };

  const addAnswer = () => {
    onChange([...answers, { ...DEFAULT_ANSWER(), order_index: answers.length }]);
  };

  const removeAnswer = (index) => {
    onChange(answers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-700 flex items-center flex-wrap gap-1.5">
          Đáp án
          {multiSelect
            ? <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Chọn nhiều đáp án đúng</span>
            : <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Chọn một đáp án đúng</span>
          }
        </p>
        <button
          type="button"
          onClick={addAnswer}
          className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium gap-1 whitespace-nowrap flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm đáp án
        </button>
      </div>

      {answers.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center py-4 border border-dashed border-gray-200 rounded-lg">
          Chưa có đáp án nào. Bấm "Thêm đáp án" để bắt đầu.
        </p>
      )}

      <div className="space-y-2">
        {answers.map((answer, index) => (
          <div
            key={answer.id}
            className={`relative border rounded-xl p-3 transition-colors ${
              answer.is_correct
                ? 'border-emerald-400 bg-emerald-50/50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Header row */}
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 pt-1 flex-shrink-0">
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                <span className="text-xs font-bold text-gray-400 w-5 text-center">
                  {String.fromCharCode(65 + index)}
                </span>
              </div>

              {/* Correct checkbox */}
              <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 pt-1">
                <input
                  type={multiSelect ? 'checkbox' : 'radio'}
                  name="correct-answer"
                  checked={answer.is_correct}
                  onChange={(e) => update(index, 'is_correct', e.target.checked)}
                  className={multiSelect
                    ? 'w-4 h-4 rounded accent-emerald-500'
                    : 'w-4 h-4 accent-emerald-500'
                  }
                />
                <span className="text-xs text-gray-500">Đúng</span>
              </label>

              {/* Content */}
              <textarea
                value={answer.content}
                onChange={(e) => update(index, 'content', e.target.value)}
                placeholder={`Nội dung đáp án ${String.fromCharCode(65 + index)}...`}
                rows={2}
                className="flex-1 min-w-0 text-sm border-0 bg-transparent resize-none outline-none focus:ring-0 placeholder-gray-300"
              />

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 pt-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Image uploader */}
            <div className="ml-[52px] sm:ml-[64px] mt-2">
              <ImageUploader
                bucket="answer-images"
                value={answer.image_url}
                onChange={(url) => update(index, 'image_url', url)}
                label="Ảnh đáp án (tuỳ chọn)"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
