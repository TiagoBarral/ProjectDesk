const MAX_TASK_TITLE_LENGTH = 300;

export async function improveTask(title, description = '') {
  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();

  if (!trimmedTitle) {
    throw new Error('Enter a task title to improve.');
  }

  if (trimmedTitle.length > MAX_TASK_TITLE_LENGTH) {
    throw new Error(`Keep the task title under ${MAX_TASK_TITLE_LENGTH} characters before improving it.`);
  }

  const response = await fetch('/api/improve-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: trimmedTitle, description: trimmedDescription }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'AI improvement failed.');
  }

  const improvedTitle = String(body.improvedTitle || '').trim();
  const improvedDescription = String(body.improvedDescription || '').trim();
  if (!improvedTitle || !improvedDescription) {
    throw new Error('AI did not return a complete suggestion.');
  }

  return { title: improvedTitle, description: improvedDescription };
}
