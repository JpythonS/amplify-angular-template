import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ReminderService } from '../services/reminder.service';

@Component({
  selector: 'app-create-reminder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-reminder.component.html',
  styleUrl: './create-reminder.component.css',
})
export class CreateReminderComponent {
  public minDate: string;
  public reminderForm: FormGroup;
  public selectedQuickOption: string = '';
  public isSubmitting = false;
  public showSuccess = false;

  constructor(
    private fb: FormBuilder,
    private reminderService: ReminderService
  ) {
    this.reminderForm = this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      description: ['', Validators.maxLength(300)],
      date: ['', Validators.required],
      time: ['', Validators.required],
      priority: ['MEDIUM', Validators.required],
      category: [''],
    });
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  public async onSubmit(): Promise<void> {
    if (this.reminderForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.reminderForm.value;
      const reminderDateTime = new Date(`${formValue.date}T${formValue.time}`);

      const reminderData = {
        title: formValue.title,
        description: formValue.description || undefined,
        reminderDate: reminderDateTime.toISOString(),
        priority: formValue.priority,
        categoria: formValue.category || undefined,
      };

      try {
        await this.reminderService.createReminder(reminderData);
          this.showSuccess = true;
          this.reminderForm.reset();
          this.reminderForm.patchValue({ priority: 'MEDIUM' });
          this.selectedQuickOption = '';
          setTimeout(() => {
            this.showSuccess = false;
          }, 3000);
      } catch(error) {
        
          console.error('Error creating reminder');
          // Here you could show an error message to the user
      } finally {
        this.isSubmitting = false;
      }

      // this.reminderService.createReminder(reminderData).subscribe({
      //   next: () => {
      //     this.isSubmitting = false;
      //     this.showSuccess = true;
      //     this.reminderForm.reset();
      //     this.reminderForm.patchValue({ priority: 'MEDIUM' });
      //     this.selectedQuickOption = '';

      //     setTimeout(() => {
      //       this.showSuccess = false;
      //     }, 3000);
      //   },
      //   error: () => {
      //     this.isSubmitting = false;
      //     console.error('Error creating reminder');
      //     // Here you could show an error message to the user
      //   },
      // });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.reminderForm.controls).forEach((key) => {
        this.reminderForm.get(key)?.markAsTouched();
      });
    }
  }

  public isFieldInvalid(key: string) {
    const field = this.reminderForm.get(key);
    return !!(field && field.invalid && field.touched);
  }

  public setQuickDate(option: 'today' | 'tomorrow' | 'week'): void {
    this.selectedQuickOption = option;
    const today = new Date();
    let targetDate = new Date();

    switch (option) {
      case 'today':
        targetDate = today;
        break;

      case 'tomorrow':
        targetDate.setDate(today.getDate() + 1);
        break;

      case 'week':
        targetDate.setDate(today.getDate() + 7);
        break;

      default:
        break;
    }

    const dateString = targetDate.toISOString().split('T')[0];
    this.reminderForm.patchValue({ date: dateString });
  }
}
