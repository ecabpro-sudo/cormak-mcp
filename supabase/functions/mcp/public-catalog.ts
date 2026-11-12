import type { fromJsonSchema } from 'npm:@modelcontextprotocol/server@2.3.1';

type Properties = NonNullable<Parameters<typeof fromJsonSchema>[0]['properties']>;

// The public preview includes selected, documented tools. The authenticated
// catalog is still built from the caller's grant on every request.
const uuid = (description: string) => ({ type: 'string', format: 'uuid', description });
const text = (maxLength: number, description: string) => ({ type: 'string', minLength: 1, maxLength, description });
const limit = { type: 'integer', minimum: 1, maximum: 50, description: 'Maximum number of results to return.' };
const page = { limit, offset: { type: 'integer', minimum: 0, maximum: 10000, description: 'Number of results to skip for pagination.' } };
const project_id = uuid('ID of a project in your Cormak account.');
const task_id = uuid('ID of the task in your Cormak account.');
const board_id = uuid('ID of the task board in your Cormak account.');
const request_id = uuid('Unique ID for this operation. Reuse it when retrying with the same arguments.');
const object = (properties: Properties, required: string[] = []) =>
  ({ type: 'object' as const, properties, required, additionalProperties: false });

function tool(name: string, description: string, properties: Properties = {}, required: string[] = [],
  { readOnlyHint = true, openWorldHint = false } = {}) {
  return {
    name,
    description: description + ' Requires Cormak OAuth.',
    inputSchema: object(properties, required),
    annotations: { readOnlyHint, destructiveHint: !readOnlyHint, idempotentHint: true, openWorldHint },
  };
}

export const PUBLIC_TOOLS = [
  tool('get_account', 'Read your Cormak plan and remaining credits.'),
  tool('list_projects', 'List your Cormak projects, most recently updated first.', { limit: { ...limit, default: 20 } }),
  tool('get_project', 'Read the title and HTML of a project you own.', { project_id }, ['project_id']),
  tool('rename_project', 'Change the title of a project you own.',
    { request_id, project_id, title: text(200, 'New project title.') }, ['request_id', 'project_id', 'title'], { readOnlyHint: false }),
  tool('list_tasks', 'List your tasks and brief result previews.', {
    ...page, board_id, view: { enum: ['all', 'today', 'week', 'overdue'], description: 'Filter by due date. Week includes today and the next six days.' },
    today: { type: 'string', format: 'date', description: 'Your local date in YYYY-MM-DD format, required for today, week and overdue views.' },
  }),
  tool('get_task', 'Read the description, checklist, result and current version of a task you own.', { ...page, task_id }, ['task_id']),
  tool('add_task_comment', 'Save an internal comment on one of your tasks.',
    { request_id, board_id, task_id, body: text(4000, 'Text of the comment to save.') },
    ['request_id', 'board_id', 'task_id', 'body'], { readOnlyHint: false }),
  tool('list_agents', 'List the AI agents configured in your account.', page),
  tool('list_employees', 'List AI employees in your account.', page),
  tool('list_images', 'List images in your library with temporary download links.', page),
  tool('list_3d_models', 'List your saved 3D models with temporary download links.', page),
  tool('list_audio', 'List your saved audio results with temporary download links.', page),
  tool('list_seo_reports', 'List your saved SEO and GEO reports.', page),
  tool('list_domains', 'List your connected domains and their status.', page),
  tool('generate_image', 'Create and save a Photo Studio image for two shared Cormak credits. The owner must approve the exact request in Cormak.',
    {
      request_id,
      confirm_spend: { type: 'boolean', const: true, description: 'True once the user confirms the credit cost.' },
      prompt: text(2000, 'Description of the image to generate.'),
      aspect_ratio: { enum: ['1:1', '16:9', '9:16', '4:3', '3:4'], default: '1:1', description: 'Width to height ratio of the output image.' },
      style: { enum: ['gold', 'neon', 'vector', 'realistic', 'logo'], default: 'realistic', description: 'Photo Studio style preset.' },
      reference: { ...object({
        data: text(3_000_000, 'Inline base64 image data.'),
        mime_type: { enum: ['image/png', 'image/jpeg', 'image/webp'], description: 'MIME type of the reference image.' },
      }, ['data', 'mime_type']), description: 'Optional reference image.' },
    }, ['request_id', 'confirm_spend', 'prompt'], { readOnlyHint: false, openWorldHint: true }),
  tool('get_generation', 'Read the state or result of a generation submitted through this connection.',
    { request_id: uuid('Original ID of the generation request.') }, ['request_id']),
];

