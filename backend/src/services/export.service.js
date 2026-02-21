// ==========================================
// FleetFlow - CSV Export Service
// ==========================================

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects
 * @param {Array} fields - Array of { label, value } or strings
 * @returns {string} CSV string
 */
function generateCSV(data, fields) {
    if (!data || data.length === 0) {
        return "";
    }

    // Build header row
    const headers = fields.map((f) => (typeof f === "string" ? f : f.label));
    const keys = fields.map((f) => (typeof f === "string" ? f : f.value));

    const rows = data.map((item) => {
        return keys
            .map((key) => {
                let value = key.split(".").reduce((obj, k) => (obj ? obj[k] : ""), item);
                if (value === null || value === undefined) value = "";
                // Escape commas and quotes in CSV
                const str = String(value);
                if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            })
            .join(",");
    });

    return [headers.join(","), ...rows].join("\n");
}

/**
 * Send CSV as downloadable file response
 * @param {object} res - Express response
 * @param {Array} data - Array of objects
 * @param {Array} fields - Array of { label, value } or strings
 * @param {string} filename - Download filename
 */
function sendCSVResponse(res, data, fields, filename) {
    const csv = generateCSV(data, fields);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
}

module.exports = {
    generateCSV,
    sendCSVResponse,
};
