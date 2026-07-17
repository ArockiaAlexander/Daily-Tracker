export const STANDARD_TARGETS = {
    Prestyle: 900,
    Preedit: 300,
    'FL Validation': 600,
    'FP Validation': 600,
    'Revises Validation': 1200,
    Normalisation: 300,
    'Cast-off XML Conversion': 4,
    'Ref Edit': 400,
    'Style Editing': 80,
};

export const STANDARD_WORK_HOURS_PER_DAY = 8;

export const TARGET_FREE_TASKS = new Set(['Miscellaneous']);

export function isTargetFreeTask(taskType) {
    return TARGET_FREE_TASKS.has(taskType);
}

export function calcTargetAchievement(taskType, completedPages, takenTime) {
    if (isTargetFreeTask(taskType)) return 0;
    const target = STANDARD_TARGETS[taskType];
    if (!target || !takenTime || !completedPages) return 0;
    return ((completedPages / ((target / STANDARD_WORK_HOURS_PER_DAY) * takenTime)) * 100).toFixed(2);
}

export function calcTimeEfficiency(estimatedTime, takenTime) {
    if (!estimatedTime || !takenTime) return 0;
    return ((estimatedTime / takenTime) * 100).toFixed(2);
}

/** Monday-start week boundaries as local YYYY-MM-DD strings */
export function getLocalISODate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function getCurrentWeekRange(now = new Date()) {
    const day = now.getDay(); // 0 Sun … 6 Sat
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { start: getLocalISODate(monday), end: getLocalISODate(sunday) };
}

export function getCurrentMonthPrefix(now = new Date()) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

/**
 * Weighted averages for a period.
 * Target achievement excludes target-free tasks (e.g. Miscellaneous);
 * time efficiency and count include all entries.
 */
export function aggregateDayMetrics(entries) {
    if (!entries.length) {
        return { avgTarget: 0, avgTime: 0, count: 0 };
    }

    const targetEntries = entries.filter((e) => !isTargetFreeTask(e.taskType));
    const targetHours = targetEntries.reduce((acc, e) => acc + Number(e.takenTime || 1), 0);
    const avgTarget = targetHours > 0
        ? targetEntries.reduce((acc, e) => acc + Number(e.targetAchieved || 0) * Number(e.takenTime || 1), 0) / targetHours
        : 0;

    const totalHours = entries.reduce((acc, e) => acc + Number(e.takenTime || 1), 0);
    const avgTime = totalHours > 0
        ? entries.reduce((acc, e) => acc + Number(e.timeAchieved || 0) * Number(e.takenTime || 1), 0) / totalHours
        : 0;

    return {
        avgTarget: avgTarget.toFixed(2),
        avgTime: avgTime.toFixed(2),
        count: entries.length,
    };
}

/**
 * Delay-based target correction suggestions.
 * Groups delayed entries by taskType + client + subdivision.
 * Suggests lower target when average delay exceeds 20%.
 */
export function buildTargetSuggestions(entries, getTargetForEntry) {
    const delayed = entries.filter(
        (e) =>
            !isTargetFreeTask(e.taskType) &&
            Number(e.estimatedTime) > 0 &&
            Number(e.takenTime) > Number(e.estimatedTime)
    );

    const groups = {};
    delayed.forEach((e) => {
        const client = e.client_id || 'DEFAULT_CLIENT';
        const subDiv = e.sub_division || '';
        const key = `${e.taskType}||${client}||${subDiv}`;
        if (!groups[key]) {
            groups[key] = {
                taskType: e.taskType,
                client_id: client,
                sub_division: subDiv,
                delayPctSum: 0,
                count: 0,
            };
        }
        const delay = Number(e.takenTime) - Number(e.estimatedTime);
        const delayPct = (delay / Number(e.estimatedTime)) * 100;
        groups[key].delayPctSum += delayPct;
        groups[key].count += 1;
    });

    return Object.values(groups)
        .map((g) => {
            const avgDelayPct = g.delayPctSum / g.count;
            const currentTarget = typeof getTargetForEntry === 'function'
                ? Number(getTargetForEntry(g.taskType, g.client_id, g.sub_division) || 0)
                : Number(STANDARD_TARGETS[g.taskType] || 0);
            const suggestedTarget =
                avgDelayPct > 20 && currentTarget > 0
                    ? Math.round(currentTarget * (1 - avgDelayPct / 100))
                    : null;
            return {
                taskType: g.taskType,
                client_id: g.client_id,
                sub_division: g.sub_division,
                count: g.count,
                avgDelayPercent: avgDelayPct.toFixed(1),
                currentTarget,
                suggestedTarget,
            };
        })
        .filter((s) => s.suggestedTarget != null)
        .sort((a, b) => Number(b.avgDelayPercent) - Number(a.avgDelayPercent));
}
