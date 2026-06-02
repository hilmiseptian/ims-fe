import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LevelService } from '../../../core/services/level.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-level-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSlideToggleModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">{{ isEdit ? 'Edit Level' : 'Create Level' }}</h1>
        <p class="page-header__subtitle">{{ isEdit ? 'Update role configuration' : 'Define a new user role' }}</p>
      </div>
      <a mat-button routerLink="/levels"><mat-icon>arrow_back</mat-icon> Back</a>
    </div>

    @if (loadingData()) {
      <div class="loading-overlay"><mat-spinner diameter="40" /></div>
    } @else {
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Level Name</mat-label>
            <mat-icon matPrefix>layers</mat-icon>
            <input matInput formControlName="name" placeholder="e.g. Manager">
            @if (err('name', 'required')) { <mat-error>Required</mat-error> }
            @if (backendErrors()['name']) { <mat-error>{{ backendErrors()['name'] }}</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"
              placeholder="Describe this level's role and responsibilities…"></textarea>
          </mat-form-field>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="is_active" color="primary">Active</mat-slide-toggle>
          </div>

          <div class="form-actions">
            <a mat-button routerLink="/levels">Cancel</a>
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="20" /> }
              @else { <mat-icon>save</mat-icon> {{ isEdit ? 'Update' : 'Create' }} }
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .toggle-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    form { display: flex; flex-direction: column; gap: 16px; }
  `]
})
export class LevelFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(LevelService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  levelId?: number;
  loadingData = signal(false);
  saving = signal(false);
  backendErrors = signal<Record<string, string>>({});

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    is_active: [true]
  });

  ngOnInit(): void {
    this.levelId = +this.route.snapshot.params['id'];
    this.isEdit = !!this.levelId;
    if (this.isEdit) this.loadLevel();
  }

  loadLevel(): void {
    this.loadingData.set(true);
    this.service.getById(this.levelId!).subscribe({
      next: res => {
        this.form.patchValue({ name: res.data.name, description: res.data.description, is_active: res.data.is_active });
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.backendErrors.set({});
    const payload: any = this.form.value;
    const req = this.isEdit ? this.service.update(this.levelId!, payload) : this.service.create(payload);
    req.subscribe({
      next: () => { this.notify.success(`Level ${this.isEdit ? 'updated' : 'created'}.`); this.router.navigate(['/levels']); },
      error: err => {
        this.saving.set(false);
        if (err.error?.errors) this.backendErrors.set(err.error.errors);
        else this.notify.error(err.error?.message || 'Save failed.');
      }
    });
  }

  err(field: string, type: string): boolean {
    const c = this.form.get(field);
    return !!(c?.errors?.[type] && c.touched);
  }
}
