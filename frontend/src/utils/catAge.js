export function getDateOnly(value) {
  if (!value) return '';

  const raw = String(value);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function parseDateOnly(value) {
  const dateOnly = getDateOnly(value);
  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function formatDateOnlyBR(value, options = {}) {
  const date = parseDateOnly(value);
  if (!date) return options.fallback || '';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: options.month || '2-digit',
    year: 'numeric',
  });
}

export function calculateAgeParts(catOrDate) {
  const isObject = catOrDate && typeof catOrDate === 'object';
  const birthDate = isObject ? catOrDate.birthDate : catOrDate;

  const birth = parseDateOnly(birthDate);
  if (birth) {
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (today.getDate() < birth.getDate()) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return {
      years: Math.max(0, years),
      months: Math.max(0, months),
      estimated: false,
    };
  }

  if (isObject) {
    const years = Number(catOrDate.ageYears);
    const months = Number(catOrDate.ageMonths);
    const hasYears = Number.isFinite(years);
    const hasMonths = Number.isFinite(months);

    if (hasYears || hasMonths) {
      return {
        years: hasYears ? Math.max(0, years) : 0,
        months: hasMonths ? Math.max(0, months) : 0,
        estimated: true,
      };
    }
  }

  return null;
}

export function formatCatAge(cat, options = {}) {
  const parts = calculateAgeParts(cat);
  if (!parts) return options.fallback || 'Nao informado';

  const years = Math.floor(parts.years || 0);
  const months = Math.floor(parts.months || 0);
  const compact = options.compact !== false;

  if (compact) {
    if (years > 0 && months > 0) return `${years}a ${months}m`;
    if (years > 0) return `${years}a`;
    if (months > 0) return `${months}m`;
    return '0m';
  }

  const labels = [];
  if (years > 0) labels.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (months > 0) labels.push(`${months} ${months === 1 ? 'mes' : 'meses'}`);
  return labels.join(' e ') || 'menos de 1 mes';
}

export function getCatLifeStage(cat) {
  const parts = calculateAgeParts(cat);
  if (!parts) return null;

  const totalMonths = Math.max(0, Math.floor((parts.years || 0) * 12 + (parts.months || 0)));

  if (totalMonths < 12) return 'BABY';
  if (totalMonths < 36) return 'JUNIOR';
  if (totalMonths < 96) return 'GROWN';
  return 'SENIOR';
}

export const LIFE_STAGE_META = {
  BABY: { label: 'BABY', description: 'Filhote', className: 'bg-pink-50 text-pink-600 border-pink-200' },
  JUNIOR: { label: 'JUNIOR', description: 'Jovem', className: 'bg-sky-50 text-sky-600 border-sky-200' },
  GROWN: { label: 'GROWN', description: 'Adulto', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  SENIOR: { label: 'SENIOR', description: 'Senior', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};
