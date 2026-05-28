import type { Task } from '../services/api';

export function exportTasksCsv(tasks: Task[]): void {
  const headers = ['ID', 'Название', 'Описание', 'Статус', 'Приоритет', 'Исполнитель', 'Дедлайн', 'Создана'];
  const rows = tasks.map(t => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.assigneeName || '',
    t.dueDate || '',
    t.createdAt ? new Date(t.createdAt).toLocaleDateString('ru-RU') : '',
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportTasksPdf(tasks: Task[]): Promise<void> {
  try {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Список задач XProject', 14, 15);
    doc.setFontSize(10);
    doc.text(`Экспорт: ${new Date().toLocaleString('ru-RU')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['ID', 'Название', 'Статус', 'Приоритет', 'Исполнитель', 'Дедлайн']],
      body: tasks.map(t => [
        t.id,
        t.title,
        t.status,
        t.priority,
        t.assigneeName || '—',
        t.dueDate ? new Date(t.dueDate).toLocaleDateString('ru-RU') : '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`tasks_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch {
  }
}
