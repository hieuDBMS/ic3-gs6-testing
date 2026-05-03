/**
 * gen-sql.cjs - Generate SQL từ tempdata TS files
 * Chạy: node scripts/gen-sql.cjs > scripts/seed.sql
 */

const fs = require('fs');
const path = require('path');

// Escape SQL string
function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// Escape boolean
function bool(b) {
  return b ? 'true' : 'false';
}

// Parse TypeScript file
function parseTsFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/import.*?;\n/g, '');
  content = content.replace(/import type.*?;\n/g, '');
  content = content.replace(/: Question\[\]/g, '');
  content = content.replace(/export const /g, 'const ');
  content = content.replace(/export default[\s\S]*?;/g, '');
  return content;
}

function evalTsContent(content, arrayNames) {
  const results = {};
  try {
    const fn = new Function(content + '\n' + arrayNames.map(n => `results["${n}"] = typeof ${n} !== 'undefined' ? ${n} : [];`).join('\n'));
    fn.call({ results });
  } catch (e) {
    // Try with bound results
  }
  
  // Fallback: eval in wrapper
  try {
    const evalFn = eval(`(function() { ${content}; return { ${arrayNames.map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : []`).join(', ')} }; })`);
    const r = evalFn();
    arrayNames.forEach(n => { results[n] = r[n] || []; });
  } catch (e2) {
    console.error('Parse error:', e2.message);
  }
  
  return results;
}

// Exam ID mapping
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

function generateSqlForExam(examId, questions, examLabel) {
  const lines = [];
  lines.push(`\n-- ============================================`);
  lines.push(`-- ${examLabel} (exam_id: ${examId})`);
  lines.push(`-- ============================================`);
  lines.push(`-- Xóa câu hỏi cũ`);
  lines.push(`DELETE FROM questions WHERE exam_id = '${examId}'::uuid;`);
  lines.push('');

  let questionCount = 0;
  let answerCount = 0;
  let dragCount = 0;

  questions.forEach((q, i) => {
    const orderIndex = i + 1;
    let questionType;
    
    if (q.type === 'choice') questionType = 'choice';
    else if (q.type === 'multi') questionType = 'multi';
    else if (q.type === 'dragdrop') questionType = 'dragdrop';
    else return; // skip unknown

    const qId = `q_${examId.replace(/-/g, '').substring(0, 8)}_${orderIndex}`;
    
    lines.push(`DO $$ DECLARE ${qId} uuid;`);
    lines.push(`BEGIN`);
    lines.push(`  INSERT INTO questions (exam_id, question_type, content, image_url, order_index)`);
    lines.push(`  VALUES ('${examId}'::uuid, '${questionType}', ${esc(q.question)}, NULL, ${orderIndex})`);
    lines.push(`  RETURNING id INTO ${qId};`);
    lines.push('');
    
    questionCount++;

    if (questionType === 'choice' || questionType === 'multi') {
      const correctAnswers = Array.isArray(q.correct) ? q.correct : [q.correct];
      const options = q.options || [];
      
      if (options.length > 0) {
        lines.push(`  INSERT INTO answers (question_id, content, image_url, is_correct, order_index) VALUES`);
        const answerValues = options.map((opt, idx) => {
          answerCount++;
          return `    (${qId}, ${esc(opt)}, NULL, ${bool(correctAnswers.includes(opt))}, ${idx + 1})`;
        });
        lines.push(answerValues.join(',\n') + ';');
        lines.push('');
      }
    } else if (questionType === 'dragdrop') {
      const items = q.items || [];
      const zones = q.zones || [];
      const mapping = q.mapping || {};
      
      const zoneMap = {};
      zones.forEach(z => { zoneMap[z.id] = z.title; });
      
      if (items.length > 0) {
        lines.push(`  INSERT INTO dragdrop_pairs (question_id, drag_content, drag_image_url, drop_content, drop_image_url, order_index) VALUES`);
        const pairValues = items.map((item, idx) => {
          const zoneId = mapping[item.id];
          const dropContent = zoneId ? (zoneMap[zoneId] || zoneId) : 'Unknown';
          const dragImg = item.img ? esc(item.img) : 'NULL';
          dragCount++;
          return `    (${qId}, ${esc(item.text)}, ${dragImg}, ${esc(dropContent)}, NULL, ${idx + 1})`;
        });
        lines.push(pairValues.join(',\n') + ';');
        lines.push('');
      }
    }

    lines.push(`END $$;`);
    lines.push('');
  });

  lines.push(`-- ${examLabel}: ${questionCount} questions, ${answerCount} answers, ${dragCount} dragdrop pairs`);
  return lines.join('\n');
}

// Main
const tempDir = path.join(__dirname, '..', 'tempdata');
const outputLines = [];

outputLines.push('-- ================================================');
outputLines.push('-- IC3 GS6 Question Seed Script');
outputLines.push('-- Generated automatically from tempdata/*.ts');
outputLines.push('-- ================================================');
outputLines.push('BEGIN;');

// GS6 Level 1
{
  const content = parseTsFile(path.join(tempDir, 'Gs6lvl1.ts'));
  const data = evalTsContent(content, ['testing1', 'testing2', 'testing3']);
  
  if (data.testing1?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl1_testing1'], data.testing1, 'GS6/Level1/Testing1'));
  if (data.testing2?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl1_testing2'], data.testing2, 'GS6/Level1/Testing2'));
  if (data.testing3?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl1_testing3'], data.testing3, 'GS6/Level1/Testing3'));
  
  process.stderr.write(`✅ GS6 Level 1: t1=${data.testing1?.length}, t2=${data.testing2?.length}, t3=${data.testing3?.length}\n`);
}

// GS6 Level 2
{
  const content = parseTsFile(path.join(tempDir, 'Gs6lvl2.ts'));
  const data = evalTsContent(content, ['testing1', 'testing2', 'testing3', 'testing4']);
  
  if (data.testing1?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl2_testing1'], data.testing1, 'GS6/Level2/Testing1'));
  if (data.testing2?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl2_testing2'], data.testing2, 'GS6/Level2/Testing2'));
  if (data.testing3?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl2_testing3'], data.testing3, 'GS6/Level2/Testing3'));
  if (data.testing4?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl2_testing4'], data.testing4, 'GS6/Level2/Testing4'));
  
  process.stderr.write(`✅ GS6 Level 2: t1=${data.testing1?.length}, t2=${data.testing2?.length}, t3=${data.testing3?.length}, t4=${data.testing4?.length}\n`);
}

// GS6 Level 3
{
  const content = parseTsFile(path.join(tempDir, 'Gs6lvl3.ts'));
  const data = evalTsContent(content, ['testing1', 'testing2', 'testing3']);
  
  if (data.testing1?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl3_testing1'], data.testing1, 'GS6/Level3/Testing1'));
  if (data.testing2?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl3_testing2'], data.testing2, 'GS6/Level3/Testing2'));
  if (data.testing3?.length) outputLines.push(generateSqlForExam(EXAM_MAP['gs6_lvl3_testing3'], data.testing3, 'GS6/Level3/Testing3'));
  
  process.stderr.write(`✅ GS6 Level 3: t1=${data.testing1?.length}, t2=${data.testing2?.length}, t3=${data.testing3?.length}\n`);
}

outputLines.push('\nCOMMIT;');
outputLines.push('\n-- Verify counts');
outputLines.push("SELECT COUNT(*) as total_questions FROM questions WHERE exam_id IN (");
outputLines.push("  SELECT id FROM exams e JOIN exam_levels el ON e.level_id = el.id WHERE el.version = 'GS6'");
outputLines.push(");");

console.log(outputLines.join('\n'));
