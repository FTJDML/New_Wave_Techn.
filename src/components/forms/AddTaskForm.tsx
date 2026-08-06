import { useState } from 'react';
import { upsertTask } from '@/research/store';
import type { NewTaskInput } from '@/research/types';
import type { ResearchTask } from '@/types/catalogue';
import styles from './forms.module.css';

const STATUSES = ['BACKLOG', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

function emptyForm(gapId: string): NewTaskInput {
  return { gap_id: gapId, task_title: '', status: STATUSES[0], priority: '', assigned_to: '', next_action: '' };
}

function formFromExisting(task: ResearchTask): NewTaskInput {
  return {
    gap_id: task.gap_id,
    task_title: task.task_title,
    task_type: task.task_type,
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to,
    next_action: task.next_action,
    target_date: task.target_date,
    result_summary: task.result_summary,
  };
}

interface AddTaskFormProps {
  readonly gapId: string;
  readonly existing?: ResearchTask;
  readonly onSaved?: () => void;
}

export function AddTaskForm({ gapId, existing, onSaved }: AddTaskFormProps) {
  const [open, setOpen] = useState(Boolean(existing));
  const [form, setForm] = useState<NewTaskInput>(() => (existing ? formFromExisting(existing) : emptyForm(gapId)));
  const [errors, setErrors] = useState<readonly string[]>([]);

  if (!open) {
    return (
      <button type="button" className={styles.toggleButton} onClick={() => setOpen(true)} data-testid="add-task-toggle">
        + Add research task
      </button>
    );
  }

  const submit = () => {
    const { result } = upsertTask(form, existing?.task_id);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    if (!existing) {
      setForm(emptyForm(gapId));
      setOpen(false);
    }
    onSaved?.();
  };

  return (
    <div className={styles.panel} data-testid="add-task-panel">
      <div className={styles.grid}>
        <div className={[styles.field, styles.fieldWide].join(' ')}>
          <label className={styles.label} htmlFor="task-title">Task</label>
          <input id="task-title" className={styles.input} value={form.task_title} onChange={(e) => setForm({ ...form, task_title: e.target.value })} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-status">Status</label>
          <select id="task-status" className={styles.select} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="task-priority">Priority</label>
          <input id="task-priority" className={styles.input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
        </div>
        <div className={[styles.field, styles.fieldWide].join(' ')}>
          <label className={styles.label} htmlFor="task-next-action">Next action</label>
          <textarea id="task-next-action" className={styles.textarea} value={form.next_action} onChange={(e) => setForm({ ...form, next_action: e.target.value })} />
        </div>
        {form.status === 'DONE' ? (
          <div className={[styles.field, styles.fieldWide].join(' ')}>
            <label className={styles.label} htmlFor="task-result">Result summary</label>
            <textarea id="task-result" className={styles.textarea} value={form.result_summary} onChange={(e) => setForm({ ...form, result_summary: e.target.value })} />
          </div>
        ) : null}
      </div>
      {errors.length > 0 ? (
        <ul className={styles.errorList} data-testid="add-task-errors">
          {errors.map((e) => (
            <li key={e} className={styles.errorItem}>{e}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.actions}>
        <button type="button" className={styles.primaryButton} onClick={submit} data-testid="add-task-submit">
          {existing ? 'Save changes' : 'Save task'}
        </button>
        {!existing ? (
          <button type="button" className={styles.secondaryButton} onClick={() => { setOpen(false); setErrors([]); }}>Cancel</button>
        ) : null}
      </div>
    </div>
  );
}
