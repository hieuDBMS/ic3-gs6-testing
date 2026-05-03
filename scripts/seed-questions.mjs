/**
 * seed-questions.mjs
 * Đọc data từ tempdata/*.ts và insert vào Supabase
 * Chạy: node scripts/seed-questions.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://gvxpyjkcdavcgtzeouoq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2eHB5amtjZGF2Y2d0emVvdW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjEyNDIsImV4cCI6MjA5MzIzNzI0Mn0.-2kP84xDBGlvQXKAnAp1Ryp0SuAErVmeXoNrRHbGLfo';

// ===== EXAM IDs từ Supabase (GS6) =====
const EXAM_MAP = {
  'gs6_lvl1_testing1': '034de6ea-9e75-4cd4-ba9f-e7eeda50b2df',
  'gs6_lvl1_testing2': '33efa248-2c98-4255-9eb6-c6deef6e061e',
  'gs6_lvl1_testing3': 'e8150209-4e2e-48f9-a1a8-9697366fe67f',
  'gs6_lvl2_testing1': 'fd698ccb-f3e5-4ba3-8d47-96c2c2deb16f',
  'gs6_lvl2_testing2': 'd46ee07d-4a36-4e14-9ff3-b6acd52cde22',
  'gs6_lvl2_testing3': 'e9b62d34-5eea-4b34-8b90-7ad59a0725b4',
  'gs6_lvl2_testing4': '45113a7d-8713-4d84-877e-d664287bdfed',
  'gs6_lvl3_testing1': '4c5ac8b0-e931-4bee-8cd2-f5d31fe45bdf',
  'gs6_lvl3_testing2': '7d26dec0-3748-4a34-87cf-19b5d9266b92',
  'gs6_lvl3_testing3': 'c0f21e31-237e-4cca-810e-bc96ccc60515',
};

// Hàm gọi Supabase REST API
async function supabaseInsert(table, rows, returning = 'id') {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': `return=${returning}`,
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Insert into ${table} failed: ${response.status} - ${errText}`);
  }

  return response.json();
}

async function supabaseDelete(table, filter) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Delete from ${table} failed: ${response.status} - ${errText}`);
  }
}

// Parse TypeScript file thành JS object bằng cách strip TypeScript syntax
function parseTsFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');

  // Xóa import statements
  content = content.replace(/^import.*?;\n/gm, '');
  // Xóa TypeScript type annotations như `: Question[]`
  content = content.replace(/:\s*Question\[\]/g, '');
  // Xóa `export const` → `const`
  content = content.replace(/export const /g, 'const ');
  // Xóa `export default ...;`
  content = content.replace(/export default\s+.*?;/gs, '');
  // Xóa TypeScript `import type`
  content = content.replace(/import type.*?;\n/gm, '');

  return content;
}

// Evaluate parsed TS content và lấy các arrays
function evalTsContent(content, arrayNames) {
  // Tạo function để evaluate với các biến cần thiết
  const results = {};
  const fn = new Function(content + '\n' + arrayNames.map(n => `results["${n}"] = typeof ${n} !== 'undefined' ? ${n} : [];`).join('\n') + '\nreturn results;');

  // Bind results object
  const wrapped = new Function('results', content + '\n' + arrayNames.map(n => `results["${n}"] = typeof ${n} !== 'undefined' ? ${n} : [];`).join('\n'));
  wrapped(results);
  return results;
}

// Insert questions cho một exam
async function insertExamQuestions(examId, questions, examKey) {
  console.log(`\n📝 Inserting ${questions.length} questions for ${examKey} (exam: ${examId})`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const orderIndex = i + 1;

    // Xác định question_type
    let questionType;
    if (q.type === 'choice') questionType = 'choice';
    else if (q.type === 'multi') questionType = 'multi';
    else if (q.type === 'dragdrop') questionType = 'dragdrop';
    else {
      console.warn(`  ⚠️  Unknown type "${q.type}" at index ${i}, skipping`);
      skippedCount++;
      continue;
    }

    // Insert question
    let insertedQuestions;
    try {
      insertedQuestions = await supabaseInsert('questions', [{
        exam_id: examId,
        question_type: questionType,
        content: q.question,
        image_url: null,
        order_index: orderIndex,
      }]);
    } catch (err) {
      console.error(`  ❌ Failed to insert question ${i + 1}: ${err.message}`);
      skippedCount++;
      continue;
    }

    const questionId = insertedQuestions[0]?.id;
    if (!questionId) {
      console.error(`  ❌ No ID returned for question ${i + 1}`);
      skippedCount++;
      continue;
    }

    // Insert answers hoặc dragdrop_pairs
    if (questionType === 'choice' || questionType === 'multi') {
      const correctAnswers = Array.isArray(q.correct) ? q.correct : [q.correct];
      const answerRows = (q.options || []).map((opt, idx) => ({
        question_id: questionId,
        content: opt,
        image_url: null,
        is_correct: correctAnswers.includes(opt),
        order_index: idx + 1,
      }));

      if (answerRows.length > 0) {
        try {
          await supabaseInsert('answers', answerRows, 'minimal');
        } catch (err) {
          console.error(`  ❌ Failed to insert answers for question ${i + 1}: ${err.message}`);
        }
      }
    } else if (questionType === 'dragdrop') {
      // Tạo dragdrop_pairs từ items + zones + mapping
      const items = q.items || [];
      const zones = q.zones || [];
      const mapping = q.mapping || {};

      // Tạo zone lookup: id -> title
      const zoneMap = {};
      zones.forEach(z => { zoneMap[z.id] = z.title; });

      const pairRows = items.map((item, idx) => {
        const zoneId = mapping[item.id];
        const dropContent = zoneId ? (zoneMap[zoneId] || zoneId) : 'Unknown';
        return {
          question_id: questionId,
          drag_content: item.text,
          drag_image_url: item.img || null,
          drop_content: dropContent,
          drop_image_url: null,
          order_index: idx + 1,
        };
      });

      if (pairRows.length > 0) {
        try {
          await supabaseInsert('dragdrop_pairs', pairRows, 'minimal');
        } catch (err) {
          console.error(`  ❌ Failed to insert dragdrop pairs for question ${i + 1}: ${err.message}`);
        }
      }
    }

    insertedCount++;
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`  ✅ ${i + 1}/${questions.length} questions processed\r`);
    }
  }

  console.log(`  ✅ Done: ${insertedCount} inserted, ${skippedCount} skipped`);
  return insertedCount;
}

// Main function
async function main() {
  console.log('🚀 Bắt đầu seed câu hỏi vào Supabase...\n');
  console.log('⚠️  Lưu ý: Script này sẽ XÓA toàn bộ câu hỏi hiện có của các exam GS6 trước khi insert mới.\n');

  // Kiểm tra kết nối
  try {
    const testUrl = `${SUPABASE_URL}/rest/v1/exam_levels?select=id&limit=1`;
    const testResp = await fetch(testUrl, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    if (!testResp.ok) throw new Error(`HTTP ${testResp.status}`);
    console.log('✅ Kết nối Supabase thành công\n');
  } catch (err) {
    console.error('❌ Không thể kết nối Supabase:', err.message);
    process.exit(1);
  }

  // Xóa dữ liệu cũ (dragdrop_pairs và answers sẽ cascade delete khi question bị xóa)
  console.log('🗑️  Xóa câu hỏi cũ trong các exam GS6...');
  const gs6ExamIds = Object.values(EXAM_MAP);
  for (const examId of gs6ExamIds) {
    try {
      await supabaseDelete('questions', `exam_id=eq.${examId}`);
    } catch (err) {
      console.warn(`  ⚠️  Không xóa được questions cho exam ${examId}: ${err.message}`);
    }
  }
  console.log('✅ Đã xóa câu hỏi cũ\n');

  const tempDir = join(__dirname, '..', 'tempdata');
  let totalInserted = 0;

  // ===== GS6 Level 1 =====
  console.log('═══════════════════════════════════════');
  console.log('📚 GS6 Level 1');
  console.log('═══════════════════════════════════════');
  {
    const content = parseTsFile(join(tempDir, 'Gs6lvl1.ts'));
    const data = evalTsContent(content, ['testing1', 'testing2', 'testing3']);

    if (data.testing1?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl1_testing1'], data.testing1, 'GS6/Level1/Testing1');
    if (data.testing2?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl1_testing2'], data.testing2, 'GS6/Level1/Testing2');
    if (data.testing3?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl1_testing3'], data.testing3, 'GS6/Level1/Testing3');
  }

  // ===== GS6 Level 2 =====
  console.log('\n═══════════════════════════════════════');
  console.log('📚 GS6 Level 2');
  console.log('═══════════════════════════════════════');
  {
    const content = parseTsFile(join(tempDir, 'Gs6lvl2.ts'));
    const data = evalTsContent(content, ['testing1', 'testing2', 'testing3', 'testing4']);

    if (data.testing1?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl2_testing1'], data.testing1, 'GS6/Level2/Testing1');
    if (data.testing2?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl2_testing2'], data.testing2, 'GS6/Level2/Testing2');
    if (data.testing3?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl2_testing3'], data.testing3, 'GS6/Level2/Testing3');
    if (data.testing4?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl2_testing4'], data.testing4, 'GS6/Level2/Testing4');
  }

  // ===== GS6 Level 3 =====
  console.log('\n═══════════════════════════════════════');
  console.log('📚 GS6 Level 3');
  console.log('═══════════════════════════════════════');
  {
    const content = parseTsFile(join(tempDir, 'Gs6lvl3.ts'));
    const data = evalTsContent(content, ['testing1', 'testing2', 'testing3']);

    if (data.testing1?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl3_testing1'], data.testing1, 'GS6/Level3/Testing1');
    if (data.testing2?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl3_testing2'], data.testing2, 'GS6/Level3/Testing2');
    if (data.testing3?.length) totalInserted += await insertExamQuestions(EXAM_MAP['gs6_lvl3_testing3'], data.testing3, 'GS6/Level3/Testing3');
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`🎉 Hoàn thành! Tổng cộng ${totalInserted} câu hỏi đã được insert.`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('\n💥 Lỗi:', err);
  process.exit(1);
});
