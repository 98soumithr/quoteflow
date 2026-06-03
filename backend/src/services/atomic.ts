const BASE = process.env.ATOMIC_CRM_BASE_URL!;
const KEY = process.env.ATOMIC_CRM_API_KEY!;

export interface AtomicContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_id: string;
  status: string;
  phone: string;
  state: string;
  gstin: string;
}

type CreateContactData = Omit<AtomicContact, 'id'>;
type UpdateContactData = Partial<Omit<AtomicContact, 'id'>>;

const defaultHeaders = {
  apikey: KEY,
  'Content-Type': 'application/json',
};

export async function listContacts(
  limit = 50,
  offset = 0
): Promise<AtomicContact[]> {
  try {
    const url = `${BASE}/contacts?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, { headers: defaultHeaders });

    if (!res.ok) {
      throw new Error(
        `Atomic CRM listContacts failed: ${res.status} ${res.statusText}`
      );
    }

    return (await res.json()) as AtomicContact[];
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Atomic CRM listContacts error: ${err.message}`);
    }
    throw new Error('Atomic CRM listContacts: unknown error');
  }
}

export async function getContactById(id: string): Promise<AtomicContact> {
  try {
    const url = `${BASE}/contacts?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, { headers: defaultHeaders });

    if (!res.ok) {
      throw new Error(
        `Atomic CRM getContactById failed: ${res.status} ${res.statusText}`
      );
    }

    const data = (await res.json()) as AtomicContact[];

    if (!data[0]) {
      throw new Error(`Atomic CRM getContactById: contact ${id} not found`);
    }

    return data[0];
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Atomic CRM getContactById error: ${err.message}`);
    }
    throw new Error('Atomic CRM getContactById: unknown error');
  }
}

export async function createContact(
  data: CreateContactData
): Promise<AtomicContact> {
  try {
    const url = `${BASE}/contacts`;
    const res = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(
        `Atomic CRM createContact failed: ${res.status} ${res.statusText}`
      );
    }

    return (await res.json()) as AtomicContact;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Atomic CRM createContact error: ${err.message}`);
    }
    throw new Error('Atomic CRM createContact: unknown error');
  }
}

export async function updateContact(
  id: string,
  data: UpdateContactData
): Promise<AtomicContact> {
  try {
    const url = `${BASE}/contacts?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(
        `Atomic CRM updateContact failed: ${res.status} ${res.statusText}`
      );
    }

    const result = (await res.json()) as AtomicContact[];

    if (!result[0]) {
      throw new Error(`Atomic CRM updateContact: contact ${id} not found`);
    }

    return result[0];
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Atomic CRM updateContact error: ${err.message}`);
    }
    throw new Error('Atomic CRM updateContact: unknown error');
  }
}
