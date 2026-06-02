import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../core/services/user.service';
import { LevelService } from '../../../core/services/level.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Level } from '../../../core/models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">{{ isEdit ? 'Edit User' : 'Create User' }}</h1>
        <p class="page-header__subtitle">{{ isEdit ? 'Update user information' : 'Add a new user account' }}</p>
      </div>
      <a mat-button routerLink="/users">
        <mat-icon>arrow_back</mat-icon> Back
      </a>
    </div>

    @if (loadingData()) {
      <div class="loading-overlay"><mat-spinner diameter="40" /></div>
    } @else {
      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="full_name" placeholder="John Doe">
              @if (err('full_name', 'required')) { <mat-error>Required</mat-error> }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="johndoe">
              @if (err('username', 'required')) { <mat-error>Required</mat-error> }
              @if (backendErrors()['username']) {
                <mat-error>{{ backendErrors()['username'] }}</mat-error>
              }
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>email</mat-icon>
            <input matInput formControlName="email" type="email" placeholder="john@example.com">
            @if (err('email', 'required')) { <mat-error>Required</mat-error> }
            @if (err('email', 'email')) { <mat-error>Invalid email</mat-error> }
            @if (backendErrors()['email']) {
              <mat-error>{{ backendErrors()['email'] }}</mat-error>
            }
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Password{{ isEdit ? ' (leave blank to keep)' : '' }}</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="password">
              <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())">
                <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (err('password', 'required')) { <mat-error>Required</mat-error> }
              @if (err('password', 'minlength')) { <mat-error>Min 8 characters</mat-error> }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Level</mat-label>
              <mat-icon matPrefix>layers</mat-icon>
              <mat-select formControlName="level_id">
                @for (level of levels(); track level.id) {
                  <mat-option [value]="level.id">{{ level.name }}</mat-option>
                }
              </mat-select>
              @if (err('level_id', 'required')) { <mat-error>Required</mat-error> }
            </mat-form-field>
          </div>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="is_active" color="primary">
              Account Active
            </mat-slide-toggle>
            <span class="text-muted">Inactive users cannot log in</span>
          </div>

          <div class="form-actions">
            <a mat-button routerLink="/users">Cancel</a>
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="20" /> }
              @else { <mat-icon>save</mat-icon> {{ isEdit ? 'Update' : 'Create' }} User }
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }
    form { display: flex; flex-direction: column; gap: 16px; }
  `]
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(UserService);
  private levelService = inject(LevelService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEdit = false;
  userId?: number;
  levels = signal<Level[]>([]);
  loading = signal(false);
  loadingData = signal(false);
  saving = signal(false);
  showPwd = signal(false);
  backendErrors = signal<Record<string, string>>({});

  form = this.fb.group({
    full_name: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(8)]],
    level_id: [null as number | null, Validators.required],
    is_active: [true]
  });

  ngOnInit(): void {
    this.userId = +this.route.snapshot.params['id'];
    this.isEdit = !!this.userId;
    if (!this.isEdit) {
      this.form.get('password')!.addValidators(Validators.required);
    }
    this.loadLevels();
    if (this.isEdit) this.loadUser();
  }

  loadLevels(): void {
    this.levelService.getAllActive().subscribe(res => this.levels.set(res.data));
  }

  loadUser(): void {
    this.loadingData.set(true);
    this.service.getById(this.userId!).subscribe({
      next: res => {
        const u = res.data;
        this.form.patchValue({
          full_name: u.full_name, username: u.username,
          email: u.email, level_id: u.level_id, is_active: u.is_active
        });
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false)
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.backendErrors.set({});

    const val = this.form.value;
    const payload: any = {
      full_name: val.full_name, username: val.username,
      email: val.email, level_id: val.level_id, is_active: val.is_active
    };
    if (val.password) payload.password = val.password;

    const req = this.isEdit
      ? this.service.update(this.userId!, payload)
      : this.service.create(payload);

    req.subscribe({
      next: () => {
        this.notify.success(`User ${this.isEdit ? 'updated' : 'created'} successfully.`);
        this.router.navigate(['/users']);
      },
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
