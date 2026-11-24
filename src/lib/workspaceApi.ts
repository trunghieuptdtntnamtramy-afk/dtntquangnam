// Real client-side Google Workspace REST API calls using the in-memory OAuth access token.

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GmailMessageSummary {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

async function workspaceFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg =
      (data as { error?: { message?: string } })?.error?.message ||
      `Lỗi Google Workspace API (${res.status})`;
    throw new Error(errMsg);
  }
  return data as T;
}

// 1. Google Drive: List study files
export async function listDriveFiles(token: string, queryText?: string): Promise<DriveFileItem[]> {
  const qParts = ['trashed = false'];
  if (queryText && queryText.trim()) {
    const escaped = queryText.trim().replace(/'/g, "\\'");
    qParts.push(`name contains '${escaped}'`);
  }
  const params = new URLSearchParams({
    pageSize: '12',
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    q: qParts.join(' and '),
    orderBy: 'modifiedTime desc',
  });
  const data = await workspaceFetch<{ files?: DriveFileItem[] }>(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    token
  );
  return data.files ?? [];
}

// 2. Google Sheets: Create & populate Study Progress spreadsheet
export async function exportProgressToGoogleSheets(
  token: string,
  title: string,
  rows: (string | number)[][]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetTitle: string }> {
  const created = await workspaceFetch<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    sheets?: Array<{ properties?: { title?: string } }>;
  }>('https://sheets.googleapis.com/v4/spreadsheets', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: { title },
    }),
  });

  const actualSheetTitle = created.sheets?.[0]?.properties?.title || 'Sheet1';
  const range = encodeURIComponent(`'${actualSheetTitle}'!A1`);
  await workspaceFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(created.spreadsheetId)}/values/${range}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: rows }),
    }
  );

  return {
    spreadsheetId: created.spreadsheetId,
    spreadsheetUrl: created.spreadsheetUrl,
    sheetTitle: actualSheetTitle,
  };
}

// 3. Google Docs: Create & write Study Note document
export async function createStudyGoogleDoc(
  token: string,
  title: string,
  bodyText: string
): Promise<{ documentId: string; documentUrl: string }> {
  const created = await workspaceFetch<{ documentId: string }>(
    'https://docs.googleapis.com/v1/documents',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }
  );

  await workspaceFetch(
    `https://docs.googleapis.com/v1/documents/${encodeURIComponent(created.documentId)}:batchUpdate`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: bodyText,
            },
          },
        ],
      }),
    }
  );

  return {
    documentId: created.documentId,
    documentUrl: `https://docs.google.com/document/d/${created.documentId}/edit`,
  };
}

// 4. Google Slides: Create study summary presentation
export async function createSummaryGoogleSlides(
  token: string,
  title: string,
  bulletSummary: string
): Promise<{ presentationId: string; presentationUrl: string }> {
  const created = await workspaceFetch<{
    presentationId: string;
    slides?: Array<{ objectId: string; pageElements?: Array<{ objectId: string }> }>;
  }>('https://slides.googleapis.com/v1/presentations', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  const firstSlide = created.slides?.[0];
  const titleElementId = firstSlide?.pageElements?.[0]?.objectId;
  const subtitleElementId = firstSlide?.pageElements?.[1]?.objectId;

  const requests: Record<string, unknown>[] = [];
  if (titleElementId) {
    requests.push({
      insertText: {
        objectId: titleElementId,
        text: title,
      },
    });
  }
  if (subtitleElementId) {
    requests.push({
      insertText: {
        objectId: subtitleElementId,
        text: bulletSummary.slice(0, 600),
      },
    });
  }

  if (requests.length > 0) {
    await workspaceFetch(
      `https://slides.googleapis.com/v1/presentations/${encodeURIComponent(created.presentationId)}:batchUpdate`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      }
    );
  }

  return {
    presentationId: created.presentationId,
    presentationUrl: `https://docs.google.com/presentation/d/${created.presentationId}/edit`,
  };
}

// 5. Google Forms: Create a Self-Test reflection form
export async function createSelfTestGoogleForm(
  token: string,
  title: string,
  questions: string[]
): Promise<{ formId: string; responderUri: string; editUrl: string }> {
  const created = await workspaceFetch<{
    formId: string;
    responderUri?: string;
  }>('https://forms.googleapis.com/v1/forms', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      info: {
        title,
        documentTitle: title,
      },
    }),
  });

  const requests = questions.slice(0, 5).map((q, idx) => ({
    createItem: {
      item: {
        title: q,
        questionItem: {
          question: {
            required: true,
            textQuestion: { paragraph: true },
          },
        },
      },
      location: { index: idx },
    },
  }));

  if (requests.length > 0) {
    await workspaceFetch(
      `https://forms.googleapis.com/v1/forms/${encodeURIComponent(created.formId)}:batchUpdate`,
      token,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      }
    );
  }

  return {
    formId: created.formId,
    responderUri:
      created.responderUri || `https://docs.google.com/forms/d/${created.formId}/viewform`,
    editUrl: `https://docs.google.com/forms/d/${created.formId}/edit`,
  };
}

// 6. Google Meet: Create a coaching/study meeting room
export async function createGoogleMeetSpace(
  token: string
): Promise<{ meetingUri: string; meetingCode: string }> {
  const data = await workspaceFetch<{
    meetingUri: string;
    meetingCode: string;
  }>('https://meet.googleapis.com/v2/spaces', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return {
    meetingUri: data.meetingUri,
    meetingCode: data.meetingCode,
  };
}

// 7. Gmail: List recent messages & Send email
export async function listRecentGmailMessages(token: string): Promise<GmailMessageSummary[]> {
  const listData = await workspaceFetch<{ messages?: Array<{ id: string }> }>(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=6',
    token
  );
  const ids = (listData.messages ?? []).slice(0, 6);
  const results = await Promise.all(
    ids.map(async (item) => {
      const msg = await workspaceFetch<{
        id: string;
        snippet?: string;
        payload?: { headers?: Array<{ name: string; value: string }> };
      }>(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        token
      );
      const headers = msg.payload?.headers ?? [];
      const findHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      return {
        id: msg.id,
        subject: findHeader('Subject') || '(Không có tiêu đề)',
        from: findHeader('From') || 'Không rõ người gửi',
        date: findHeader('Date') || '',
        snippet: msg.snippet || '',
      };
    })
  );
  return results;
}

function encodeBase64UrlUtf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sendGmailMessage(
  token: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ id: string }> {
  const mimeLines = [
    `To: ${to.trim()}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject.trim())))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    bodyText,
  ];
  const raw = encodeBase64UrlUtf8(mimeLines.join('\r\n'));
  return workspaceFetch<{ id: string }>(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    }
  );
}
