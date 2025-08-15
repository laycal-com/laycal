import csv from 'csv-parser';
import { Readable } from 'stream';

export interface CsvLead {
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  notes?: string;
}

export interface CsvProcessingResult {
  leads: CsvLead[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid international phone number (7-15 digits as per E.164 standard)
  return cleaned.length >= 7 && cleaned.length <= 15;
}

export function normalizePhoneNumber(phone: string): string {
  // If phone already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +1 if it's a 10-digit US number
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // Add + if it's 11 digits starting with 1 (US/Canada)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // For other international numbers, add + prefix
  if (cleaned.length >= 7 && cleaned.length <= 15) {
    return `+${cleaned}`;
  }
  
  return phone; // Return original if we can't normalize
}

export async function processCsvBuffer(buffer: Buffer): Promise<CsvProcessingResult> {
  return new Promise((resolve, reject) => {
    const leads: CsvLead[] = [];
    const errors: string[] = [];
    let totalRows = 0;
    let validRows = 0;

    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (row) => {
        totalRows++;
        
        try {
          // Extract and clean data from CSV row
          const name = (row.name || row.Name || row.full_name || row['Full Name'] || '').trim();
          const phoneNumber = (row.phone || row.Phone || row.phoneNumber || row['Phone Number'] || row.mobile || row.Mobile || '').trim();
          const email = (row.email || row.Email || row['Email Address'] || '').trim();
          const company = (row.company || row.Company || row.organization || row.Organization || '').trim();
          const notes = (row.notes || row.Notes || row.description || row.Description || '').trim();

          // Validate required fields
          if (!name) {
            errors.push(`Row ${totalRows}: Name is required`);
            return;
          }

          if (!phoneNumber) {
            errors.push(`Row ${totalRows}: Phone number is required`);
            return;
          }

          if (!validatePhoneNumber(phoneNumber)) {
            errors.push(`Row ${totalRows}: Invalid phone number format: ${phoneNumber}`);
            return;
          }

          // Create lead object
          const lead: CsvLead = {
            name,
            phoneNumber: normalizePhoneNumber(phoneNumber),
          };

          // Add optional fields if they exist
          if (email) lead.email = email;
          if (company) lead.company = company;
          if (notes) lead.notes = notes;

          leads.push(lead);
          validRows++;
        } catch (error) {
          errors.push(`Row ${totalRows}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })
      .on('end', () => {
        resolve({
          leads,
          errors,
          totalRows,
          validRows,
        });
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });
  });
}