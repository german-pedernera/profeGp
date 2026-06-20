import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { sortEvaluations } from './constants';

export const exportPlanillaToExcel = async (evaluations, fechaExamen) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Planilla Resumen');

  // Title rows
  sheet.mergeCells('A1:S1');
  sheet.getCell('A1').value = "“PLANILLA DE RESUMEN” AL PON 06/25 (PARA NORMAR LAS PRUEBAS DE APTITUDES FÍSICAS DEL PERSONAL OFICIALES, SUBOFICIALES, GENDARMES Y ALUMNOS DE LA FUERZA).";
  sheet.getCell('A1').font = { bold: true, size: 12 };
  sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  sheet.getRow(1).height = 40;

  sheet.getCell('A3').value = "PLANILLA DE RESUMEN A";
  sheet.getCell('A3').font = { bold: true, size: 10 };
  
  sheet.getCell('A4').value = "UNIDAD: ..............................................................";
  sheet.getCell('I4').value = "AGRUPACIÓN: ...............................................................";
  sheet.getCell('O4').value = "REGIÓN: .................................";
  sheet.getRow(4).font = { bold: true, size: 10 };

  // Table Headers

  // Define Columns and Merges for Headers
  sheet.mergeCells('A6:A7'); sheet.getCell('A6').value = "CATEGORÍA";
  sheet.mergeCells('B6:B7'); sheet.getCell('B6').value = "NRO\nDE\nORDEN";
  sheet.mergeCells('C6:C7'); sheet.getCell('C6').value = "GRADO";
  sheet.mergeCells('D6:D7'); sheet.getCell('D6').value = "APELLIDO Y NOMBRES";
  sheet.mergeCells('E6:E7'); sheet.getCell('E6').value = "EDAD";
  sheet.mergeCells('F6:F7'); sheet.getCell('F6').value = "PESO";
  sheet.mergeCells('G6:G7'); sheet.getCell('G6').value = "TALLA";
  
  sheet.mergeCells('H6:Q6'); sheet.getCell('H6').value = "RENDIMIENTO Y PUNTAJE DE PRUEBAS";
  
  sheet.getCell('H7').value = "CARRERA\nAERÓBICA"; sheet.getCell('I7').value = "PTS";
  sheet.getCell('J7').value = "BARRA"; sheet.getCell('K7').value = "PTS";
  sheet.getCell('L7').value = "PLANCHA\nISOMÉTRICA"; sheet.getCell('M7').value = "PTS";
  sheet.getCell('N7').value = "FLEXO EXT.\nBRAZOS"; sheet.getCell('O7').value = "PTS";
  sheet.getCell('P7').value = "PLIOMETRÍA"; sheet.getCell('Q7').value = "PTS";

  sheet.mergeCells('R6:R7'); sheet.getCell('R6').value = "PUNTAJE";
  sheet.mergeCells('S6:S7'); sheet.getCell('S6').value = "PROMEDIO";

  // Style Headers
  ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S'].forEach(col => {
    [6, 7].forEach(r => {
      const cell = sheet.getCell(`${col}${r}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }; // Gray background
      cell.font = { bold: true, size: 9 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // Column Widths
  sheet.getColumn('A').width = 15;
  sheet.getColumn('B').width = 8;
  sheet.getColumn('C').width = 15;
  sheet.getColumn('D').width = 35;
  sheet.getColumn('E').width = 6;
  sheet.getColumn('F').width = 6;
  sheet.getColumn('G').width = 6;
  ['H','I','J','K','L','M','N','O','P','Q'].forEach(c => sheet.getColumn(c).width = 10);
  sheet.getColumn('R').width = 10;
  sheet.getColumn('S').width = 10;

  // Populate Data
  let currentRow = 8;
  
  const sorted = sortEvaluations(evaluations);

  let currentCat = null;
  let mergeStartRow = currentRow;

  sorted.forEach((ev, idx) => {
    let t = 0, n = 0;
    if (ev.resultados?.carreraAerobicaPts) { t += ev.resultados.carreraAerobicaPts; n++; }
    if (ev.resultados?.planchaIsometricaPts) { t += ev.resultados.planchaIsometricaPts; n++; }
    if (ev.resultados?.flexoExtensionBrazosPts) { t += ev.resultados.flexoExtensionBrazosPts; n++; }
    if (ev.resultados?.pliometriaPts) { t += ev.resultados.pliometriaPts; n++; }
    if (ev.resultados?.barraFijaPts) { t += ev.resultados.barraFijaPts; n++; }
    const promedio = n > 0 ? (t / n).toFixed(2) : '-';

    const isNewCat = currentCat !== ev.categoria;
    if (isNewCat) {
      if (currentCat !== null && currentRow - 1 > mergeStartRow) {
        sheet.mergeCells(`A${mergeStartRow}:A${currentRow - 1}`);
      }
      currentCat = ev.categoria;
      mergeStartRow = currentRow;
    }

    const row = sheet.getRow(currentRow);
    row.values = [
      ev.categoria || '-',
      idx + 1,
      ev.jerarquia || '-',
      ev.nombreApellido || '-',
      ev.edad || '-',
      ev.peso || '-',
      ev.talla || '-',
      ev.pruebas?.carreraAerobica || '-',
      ev.resultados?.carreraAerobicaPts || '-',
      ev.pruebas?.barraFija || '-',
      ev.resultados?.barraFijaPts || '-',
      ev.pruebas?.planchaIsometrica || '-',
      ev.resultados?.planchaIsometricaPts || '-',
      ev.pruebas?.flexoExtensionBrazos || '-',
      ev.resultados?.flexoExtensionBrazosPts || '-',
      ev.pruebas?.pliometria || '-',
      ev.resultados?.pliometriaPts || '-',
      t > 0 ? t : '-',
      promedio
    ];

    // Data row styling
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { size: 9 };
      if (colNumber === 4) cell.alignment.horizontal = 'left'; // Name left aligned
      if ([9, 11, 13, 15, 17, 18, 19].includes(colNumber)) cell.font.bold = true; // PTS columns bold
    });
    
    currentRow++;
  });

  // Merge the last category
  if (currentCat !== null && currentRow - 1 > mergeStartRow) {
    sheet.mergeCells(`A${mergeStartRow}:A${currentRow - 1}`);
  }

  // Footer
  currentRow += 2;
  sheet.getCell(`A${currentRow}`).value = "NOTA: * Se confeccionará una planilla para Personal de Oficiales; Suboficiales y Gendarmes";
  sheet.getCell(`A${currentRow}`).font = { size: 9, italic: true };
  
  sheet.getCell(`O${currentRow}`).value = "Lugar y Fecha.........................................................";
  sheet.getCell(`O${currentRow}`).font = { size: 9 };

  currentRow += 3;
  sheet.getCell(`C${currentRow}`).value = "..................................................................";
  sheet.getCell(`O${currentRow}`).value = "..................................................................";
  
  currentRow += 1;
  sheet.getCell(`C${currentRow}`).value = "FIRMA DEL SSOO EVALUADOR";
  sheet.getCell(`O${currentRow}`).value = "FIRMA DEL JEFE DE UNIDAD O ELEMENTO";
  sheet.getRow(currentRow).font = { size: 9, bold: true };
  sheet.getCell(`C${currentRow}`).alignment = { horizontal: 'center' };
  sheet.getCell(`O${currentRow}`).alignment = { horizontal: 'center' };

  // Write and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = fechaExamen 
    ? `Planilla_Examen_${fechaExamen.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`
    : `Planilla_Resumen_Exigencias.xlsx`;
  
  saveAs(blob, filename);
};
