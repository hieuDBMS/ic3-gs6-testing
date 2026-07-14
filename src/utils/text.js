export function stripHtml(html) {
  return (html ?? '').replace(/<[^>]*>/g, '').trim();
}

// Strips Vietnamese diacritics (Nguyễn -> Nguyen) so search matches how most
// users actually type — quick, unaccented input against accented stored names.
export function removeDiacritics(str) {
  return (str ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
