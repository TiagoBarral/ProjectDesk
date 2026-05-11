const MAX_TASK_TITLE_LENGTH = 300;

export async function improveTaskTitle(title) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    throw new Error('Enter a task title to improve.');
  }

  if (trimmedTitle.length > MAX_TASK_TITLE_LENGTH) {
    throw new Error(`Keep the task title under ${MAX_TASK_TITLE_LENGTH} characters before improving it.`);
  }

  const response = await fetch('/api/improve-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: trimmedTitle }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'AI improvement failed.');
  }

  const improvedTitle = String(body.improvedTitle || '').trim();
  if (!improvedTitle) {
    throw new Error('AI did not return an improved title.');
  }

  return improvedTitle;
}
