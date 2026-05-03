/**
 * gen-sql-parts.cjs - Generate SQL cho từng exam riêng lẻ
 * Output: scripts/sql-parts/exam-<key>.sql
 */

const fs = require('fs');
const path = require('path');

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function bool(b) {
  return b ? 'true' : 'false';
}

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
    const evalFn = eval(`(function() { ${content}; return { ${arrayNames.map(n => `${n}: typeof ${n} !== 'undefined' ? ${n} : []`).join(', ')} }; })`);
    const r = evalFn();
    arrayNames.forEach(n => { results[n] = r[n] || []; });
  } catch (e) {
    console.error('Parse error:', e.message);
  }
  return results;
}

function generateSqlForExam(examId, questions, examLabel) {
  const lines = [];
  lines.push(`-- ${examLabel} (exam_id: ${examId})`);
  lines.push(`-- ${questions.length} questions`);
  lines.push('');
  lines.push(`DELETE FROM questions WHERE exam_id = '${examId}'::uuid;`);
  lines.push('');

  questions.forEach((q, i) => {
    const orderIndex = i + 1;
    let questionType;
    if (q.type === 'choice') questionType = 'choice';
    else if (q.type === 'multi') questionType = 'multi';
    else if (q.type === 'dragdrop') questionType = 'dragdrop';
    else return;

    // Sử dụng CTE thay vì DO $$ để dễ parse hơn
    lines.push(`DO $q${orderIndex}$ DECLARE qid uuid;`);
    lines.push(`BEGIN`);
    lines.push(`  INSERT INTO questions (exam_id, question_type, content, image_url, order_index)`);
    lines.push(`  VALUES ('${examId}'::uuid, '${questionType}', ${esc(q.question)}, NULL, ${orderIndex})`);
    lines.push(`  RETURNING id INTO qid;`);
    lines.push('');

    if (questionType === 'choice' || questionType === 'multi') {
      const correctAnswers = Array.isArray(q.correct) ? q.correct : [q.correct];
      const options = q.options || [];
      if (options.length > 0) {
        lines.push(`  INSERT INTO answers (question_id, content, image_url, is_correct, order_index) VALUES`);
        const vals = options.map((opt, idx) =>
          `    (qid, ${esc(opt)}, NULL, ${bool(correctAnswers.includes(opt))}, ${idx + 1})`
        );
        lines.push(vals.join(',\n') + ';');
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
        const vals = items.map((item, idx) => {
          const zoneId = mapping[item.id];
          const dropContent = zoneId ? (zoneMap[zoneId] || zoneId) : 'Unknown';
          const dragImg = item.img ? esc(item.img) : 'NULL';
          return `    (qid, ${esc(item.text)}, ${dragImg}, ${esc(dropContent)}, NULL, ${idx + 1})`;
        });
        lines.push(vals.join(',\n') + ';');
        lines.push('');
      }
    }

    lines.push(`END $q${orderIndex}$;`);
    lines.push('');
  });

  return lines.join('\n');
}

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

const tempDir = path.join(__dirname, '..', 'tempdata');
const outDir = path.join(__dirname, 'sql-parts');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// GS6 Level 1
{
  const content = parseTsFile(path.join(tempDir, 'Gs6lvl1.ts'));
  const data = evalTsContent(content, ['testing1', 'testing2', 'testing3']);
  ['testing1', 'testing2', 'testing3'].forEach((key, i) => {
    const examKey = `gs6_lvl1_${key}`;
    const sql = generateSqlForExam(EXAM_MAP[examKey], data[key], `GS6/Level1/${key}`);
    fs.writeFileSync(path.join(outDir, `${examKey}.sql`), sql);
    console.log(`✅ ${examKey}: ${data[key]?.length} questions → ${path.join(outDir, `${examKey}.sql`)}`);
  });
}

// GS6 Level 2
{
  const content = parseTsFile(path.join(tempDir, 'Gs6lvl2.ts'));
  const data = evalTsContent(content, ['testing1', 'testing2', 'testing3', 'testing4']);
  ['testing1', 'testing2', 'testing3', 'testing4'].forEach((key) => {
    const examKey = `gs6_lvl2_${key}`;
    const sql = generateSqlForExam(EXAM_MAP[examKey], data[key], `GS6/Level2/${key}`);
    fs.writeFileSync(path.join(outDir, `${examKey}.sql`), sql);
    console.log(`✅ ${examKey}: ${data[key]?.length} questions → ${path.join(outDir, `${examKey}.sql`)}`);
  });
}

// GS6 Level 3
{
  const content = parseTsFile(path.join(tempDir, 'Gs6lvl3.ts'));
  const data = evalTsContent(content, ['testing1', 'testing2', 'testing3']);
  ['testing1', 'testing2', 'testing3'].forEach((key) => {
    const examKey = `gs6_lvl3_${key}`;
    const sql = generateSqlForExam(EXAM_MAP[examKey], data[key], `GS6/Level3/${key}`);
    fs.writeFileSync(path.join(outDir, `${examKey}.sql`), sql);
    console.log(`✅ ${examKey}: ${data[key]?.length} questions → ${path.join(outDir, `${examKey}.sql`)}`);
  });
}

console.log('\n✅ All SQL parts generated!');
