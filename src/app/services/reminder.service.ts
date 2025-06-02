import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../../amplify/data/resource';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReminderService {
  private client = generateClient<Schema>();

  async createReminder(
    reminder:
      | {
          title: string;
          description?: string;
          reminderDate: string;
          priority: 'LOW' | 'MEDIUM' | 'HIGH';
          category: string;
        }
      | any,
  ) {
    try {
      return await this.client.models.Reminder.create(reminder);
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      throw error;
    }
  }

  getReminders(): Observable<any> {
    return from(this.client.models.Reminder.list());
  }

  updateReminder(id: string, updates: any): Observable<any> {
    return from(this.client.models.Reminder.update({ id, ...updates }));
  }

  deleteReminder(id: string): Observable<any> {
    return from(this.client.models.Reminder.delete({ id }));
  }
}
