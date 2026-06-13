import XLSX from "xlsx";

export const exportExcel = (
    res,
    data,
    fileName,
    sheetName = "Sheet1"
) => {
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        sheetName
    );

    const buffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
    });

    res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}.xlsx`
    );

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(buffer);
};

export const exportCSV = (
    res,
    data,
    fileName
) => {
    const worksheet = XLSX.utils.json_to_sheet(data);

    const csv = XLSX.utils.sheet_to_csv(
        worksheet
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename=${fileName}.csv`
    );

    res.setHeader(
        "Content-Type",
        "text/csv"
    );

    return res.send(csv);
};