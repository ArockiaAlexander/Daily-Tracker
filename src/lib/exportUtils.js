import * as XLSX from 'xlsx';

/**
 * Export entries to CSV format
 * @param {Array} entries - Array of entry objects
 * @param {string} filename - Base filename without extension
 */
export const exportToCSV = (entries, filename) => {
    if (!entries || entries.length === 0) {
        alert('No data to export');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(formatEntriesForExport(entries));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries');
    
    const fullFilename = `${filename}_${getTimestamp()}.csv`;
    XLSX.writeFile(workbook, fullFilename, { bookType: 'csv' });
};

/**
 * Export entries to Excel (.xlsx) format
 * @param {Array} entries - Array of entry objects
 * @param {string} filename - Base filename without extension
 */
export const exportToExcel = (entries, filename) => {
    if (!entries || entries.length === 0) {
        alert('No data to export');
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(formatEntriesForExport(entries));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Entries');
    
    // Auto-size columns
    const colWidths = [
        { wch: 12 },  // Date
        { wch: 20 },  // Performer
        { wch: 30 },  // Project/Title
        { wch: 25 },  // Task Type
        { wch: 12 },  // Work Done
        { wch: 15 },  // Est. Hours
        { wch: 12 },  // Taken Hours
        { wch: 18 },  // Target %
        { wch: 15 },  // Time %
        { wch: 15 },  // Status
    ];
    worksheet['!cols'] = colWidths;
    
    const fullFilename = `${filename}_${getTimestamp()}.xlsx`;
    XLSX.writeFile(workbook, fullFilename);
};

/**
 * Format entries for export with consistent column headers
 * @param {Array} entries - Raw entries from database
 * @returns {Array} Formatted entries
 */
const formatEntriesForExport = (entries) => {
    return entries.map(entry => ({
        'Date': entry.date,
        'Performer': entry.performerName,
        'Project/Title': entry.titleName,
        'Task Type': entry.taskType,
        'Work Done (Pages)': entry.completedPages,
        'Estimated Hours': entry.estimatedTime,
        'Taken Hours': entry.takenTime,
        'Target Achievement %': entry.targetAchieved,
        'Time Efficiency %': entry.timeAchieved,
        'Status': entry.status
    }));
};

/**
 * Get current timestamp for filename
 * @returns {string} Formatted timestamp (YYYY-MM-DD_HH-mm)
 */
const getTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}`;
};
