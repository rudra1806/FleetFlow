// ==========================================
// FleetFlow - CSV Export Service
// ==========================================
// Utility service for generating and sending CSV files.
// Used by the Analytics controller for data exports.
//
// No external dependencies — CSV is generated manually with proper
// escaping for commas, quotes, and newlines within cell values.
//
// Functions:
//   generateCSV     — Converts array of objects to CSV string
//   sendCSVResponse — Sets headers and sends CSV as downloadable file
// ==========================================

/**
 * Convert an array of objects to a CSV-formatted string.
 *
 * @param {Array<Object>} data   — Array of data objects to convert
 * @param {Array<Object|string>} fields — Column definitions:
 *   - String: used as both header label and object key
 *   - Object: { label: "Display Name", value: "objectKey" }
 *   - Supports nested keys via dot notation (e.g., "vehicle.name")
 * @returns {string} CSV string with header row + data rows, or "" if empty
 *
 * Example:
 *   generateCSV([{ name: "Truck A", km: 500 }], [
 *     { label: "Vehicle Name", value: "name" },
 *     { label: "Kilometers", value: "km" }
 *   ]);
 *   // → "Vehicle Name,Kilometers\nTruck A,500"
 */
function generateCSV(data, fields) {
    if (!data || data.length === 0) {
        return "";
    }

    // Extract header labels and data keys from field definitions
    const headers = fields.map((f) => (typeof f === "string" ? f : f.label));
    const keys = fields.map((f) => (typeof f === "string" ? f : f.value));

    // Map each data object to a CSV row
    const rows = data.map((item) => {
        return keys
            .map((key) => {
                // Support nested keys like "vehicle.name" via reduce
                let value = key.split(".").reduce((obj, k) => (obj ? obj[k] : ""), item);
                if (value === null || value === undefined) value = "";

                // Escape CSV special characters (commas, quotes, newlines)
                const str = String(value);
                if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            })
            .join(",");
    });

    // Combine header row + all data rows with newline separators
    return [headers.join(","), ...rows].join("\n");
}

/**
 * Send a CSV file as a downloadable HTTP response.
 *
 * @param {object} res       — Express response object
 * @param {Array}  data      — Array of data objects
 * @param {Array}  fields    — Column definitions (same format as generateCSV)
 * @param {string} filename  — Filename shown in the download dialog (e.g., "vehicles_report.csv")
 *
 * Sets headers:
 *   Content-Type: text/csv
 *   Content-Disposition: attachment; filename="<filename>"
 */
function sendCSVResponse(res, data, fields, filename) {
    const csv = generateCSV(data, fields);

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);
}

module.exports = {
    generateCSV,
    sendCSVResponse,
};
