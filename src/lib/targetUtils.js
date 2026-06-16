export const STANDARD_TARGETS = {
    Prestyle: 900,
    Preedit: 300,
    'FL Validation': 600,
    'Revises Validation': 1200,
    Normalisation: 300,
    'Cast-off XML Conversion': 4,
    'Ref Edit': 400,
    'Style Editing': 80,
};

export const STANDARD_WORK_HOURS_PER_DAY = 8;

export function calcTargetAchievement(taskType, completedPages, takenTime) {
    const target = STANDARD_TARGETS[taskType];
    if (!target || !takenTime || !completedPages) return 0;
    return ((completedPages / ((target / STANDARD_WORK_HOURS_PER_DAY) * takenTime)) * 100).toFixed(2);
}

export function calcTimeEfficiency(estimatedTime, takenTime) {
    if (!estimatedTime || !takenTime) return 0;
    return ((estimatedTime / takenTime) * 100).toFixed(2);
}

export function aggregateDayMetrics(entries) {
    if (!entries.length) {
        return { avgTarget: 0, avgTime: 0, count: 0 };
    }
    const avgTarget = entries.reduce((acc, e) => acc + Number(e.targetAchieved || 0), 0) / entries.length;
    const avgTime = entries.reduce((acc, e) => acc + Number(e.timeAchieved || 0), 0) / entries.length;
    return {
        avgTarget: avgTarget.toFixed(2),
        avgTime: avgTime.toFixed(2),
        count: entries.length,
    };
}
