package com.gamifiedpm.service;

import com.gamifiedpm.model.entity.Project;
import com.gamifiedpm.model.entity.Task;
import com.gamifiedpm.repository.ProjectRepository;
import com.gamifiedpm.repository.TaskRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Color;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExportService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    public byte[] exportExcel(Long projectId) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        List<Task> tasks = taskRepository.findByProject(project);

        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Задачи");

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            org.apache.poi.ss.usermodel.Font hFont = wb.createFont();
            hFont.setColor(IndexedColors.WHITE.getIndex());
            hFont.setBold(true);
            headerStyle.setFont(hFont);

            String[] headers = { "ID", "Название", "Статус", "Приоритет", "Исполнитель", "Дедлайн", "XP" };
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Task t : tasks) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(t.getTitle() != null ? t.getTitle() : "");
                row.createCell(2).setCellValue(t.getStatus() != null ? t.getStatus().name() : "");
                row.createCell(3).setCellValue(t.getPriority() != null ? t.getPriority().name() : "");
                String assignee = t.getAssignedTo() != null
                        ? (t.getAssignedTo().getFirstName() + " " + t.getAssignedTo().getLastName()).trim()
                        : "";
                row.createCell(4).setCellValue(assignee);
                row.createCell(5).setCellValue(t.getDeadline() != null ? t.getDeadline().format(DATE_FMT) : "");
                row.createCell(6).setCellValue(t.getXpReward() != null ? t.getXpReward() : 0);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportPdf(Long projectId) throws Exception {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        List<Task> tasks = taskRepository.findByProject(project);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate());
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, new Color(30, 30, 80));
        Paragraph title = new Paragraph("Проект: " + project.getName(), titleFont);
        title.setSpacingAfter(12f);
        doc.add(title);

        Font subFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.DARK_GRAY);
        doc.add(new Paragraph("Задач: " + tasks.size(), subFont));
        doc.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{ 0.5f, 3f, 1.2f, 1.2f, 2f, 1.5f, 0.8f });

        Font colFont = new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE);
        Color headerBg = new Color(30, 30, 120);
        for (String h : new String[]{ "ID", "Название", "Статус", "Приоритет", "Исполнитель", "Дедлайн", "XP" }) {
            PdfPCell cell = new PdfPCell(new Phrase(h, colFont));
            cell.setBackgroundColor(headerBg);
            cell.setPadding(6f);
            table.addCell(cell);
        }

        Font rowFont = new Font(Font.HELVETICA, 9);
        boolean alt = false;
        for (Task t : tasks) {
            Color rowBg = alt ? new Color(240, 240, 255) : Color.WHITE;
            alt = !alt;
            String assignee = t.getAssignedTo() != null
                    ? (t.getAssignedTo().getFirstName() + " " + t.getAssignedTo().getLastName()).trim()
                    : "";
            String[] vals = {
                    String.valueOf(t.getId()),
                    t.getTitle() != null ? t.getTitle() : "",
                    t.getStatus() != null ? t.getStatus().name() : "",
                    t.getPriority() != null ? t.getPriority().name() : "",
                    assignee,
                    t.getDeadline() != null ? t.getDeadline().format(DATE_FMT) : "",
                    String.valueOf(t.getXpReward() != null ? t.getXpReward() : 0)
            };
            for (String v : vals) {
                PdfPCell cell = new PdfPCell(new Phrase(v, rowFont));
                cell.setBackgroundColor(rowBg);
                cell.setPadding(5f);
                table.addCell(cell);
            }
        }

        doc.add(table);
        doc.close();
        return out.toByteArray();
    }
}
