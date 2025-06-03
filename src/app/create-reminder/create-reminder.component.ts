import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
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

  // Novos estados para a repetição
  public daysOfWeek = [
    { label: 'Dom', value: 'SUNDAY' },
    { label: 'Seg', value: 'MONDAY' },
    { label: 'Ter', value: 'TUESDAY' },
    { label: 'Qua', value: 'WEDNESDAY' },
    { label: 'Qui', value: 'THURSDAY' },
    { label: 'Sex', value: 'FRIDAY' },
    { label: 'Sáb', value: 'SATURDAY' },
  ];
  public selectedDays: string[] = [];

  constructor(
    private fb: FormBuilder,
    private reminderService: ReminderService,
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
      repeat: ['never', Validators.required], // Valor inicial 'never'
      daysOfWeek: [[] as string[]], // Inicializa como array vazio para o controle
    }, { validators: this.daysOfWeekValidator() });
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Escuta mudanças no controle 'repeat' para aplicar/remover validação
    this.reminderForm.get('repeat')?.valueChanges.subscribe(value => {
      const daysOfWeekControl = this.reminderForm.get('daysOfWeek');
      if (daysOfWeekControl) {
        if (value === 'weekly') {
          daysOfWeekControl.setValidators(Validators.required);
          daysOfWeekControl.updateValueAndValidity(); // Garante que a validação é aplicada
        } else {
          daysOfWeekControl.clearValidators();
          daysOfWeekControl.updateValueAndValidity(); // Remove a validação
          this.selectedDays = []; // Limpa os dias selecionados se a repetição mudar
        }
      }
    });
  }

   // Validador personalizado para garantir que daysOfWeek não esteja vazio se 'weekly' for selecionado
  daysOfWeekValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const repeatControl = control.get('repeat');
      const daysOfWeekControl = control.get('daysOfWeek');

      if (repeatControl?.value === 'weekly' && (!daysOfWeekControl?.value || daysOfWeekControl.value.length === 0)) {
        return { 'daysOfWeekRequired': true };
      }
      return null;
    };
  }

  public onRepeatChange(repeatValue: string): void {
    const daysOfWeekControl = this.reminderForm.get('daysOfWeek');
    if (repeatValue !== 'weekly') {
      this.selectedDays = []; // Limpa os dias selecionados
      daysOfWeekControl?.setValue([]); // Zera o valor do controle do formulário
    }
  }

  public toggleDay(dayValue: string): void {
    const index = this.selectedDays.indexOf(dayValue);
    if (index > -1) {
      this.selectedDays.splice(index, 1); // Remove o dia
    } else {
      this.selectedDays.push(dayValue); // Adiciona o dia
    }
    // Atualiza o valor do controle daysOfWeek para que o validador reaja
    this.reminderForm.get('daysOfWeek')?.setValue(this.selectedDays);
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
      } catch (error) {
        console.error('Error creating reminder');
        // Here you could show an error message to the user
      } finally {
        this.isSubmitting = false;
      }
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
