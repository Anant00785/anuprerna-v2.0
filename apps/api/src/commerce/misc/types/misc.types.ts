export interface ContactUsData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function parseContactUsData(data: any): ContactUsData {
  if (!data.name || typeof data.name !== 'string') throw new Error('Invalid name');
  if (!data.email || typeof data.email !== 'string') throw new Error('Invalid email');
  if (!data.subject || typeof data.subject !== 'string') throw new Error('Invalid subject');
  if (!data.message || typeof data.message !== 'string') throw new Error('Invalid message');

  return {
    name: data.name.trim(),
    email: data.email.trim(),
    subject: data.subject.trim(),
    message: data.message.trim(),
  };
}
