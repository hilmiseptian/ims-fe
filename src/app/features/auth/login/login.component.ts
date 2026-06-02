import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-page">
      <div class="login-panel">
        <div class="login-brand">
          <div class="brand-icon">
            <mat-icon>shield</mat-icon>
          </div>
          <h1>UAM</h1>
          <p>User Access Management</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="login-form">
          <h2>Sign in to continue</h2>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Username or Email</mat-label>
            <mat-icon matPrefix>person</mat-icon>
            <input
              matInput
              formControlName="login"
              placeholder="admin"
              autocomplete="username"
              value="admin"
            />
            @if (
              form.get('login')?.errors?.['required'] &&
              form.get('login')?.touched
            ) {
              <mat-error>This field is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input
              matInput
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="showPassword.set(!showPassword())"
            >
              <mat-icon>{{
                showPassword() ? 'visibility_off' : 'visibility'
              }}</mat-icon>
            </button>
            @if (
              form.get('password')?.errors?.['required'] &&
              form.get('password')?.touched
            ) {
              <mat-error>Password is required</mat-error>
            }
          </mat-form-field>

          @if (errorMsg()) {
            <div class="error-banner">
              <mat-icon>error_outline</mat-icon>
              {{ errorMsg() }}
            </div>
          }

          <button
            mat-flat-button
            color="primary"
            type="submit"
            class="submit-btn"
            [disabled]="loading()"
          >
            @if (loading()) {
              <mat-spinner diameter="20" />
            } @else {
              <mat-icon>login</mat-icon>
              Sign In
            }
          </button>
        </form>
      </div>

      <div class="login-bg">
        <div class="bg-grid"></div>
        <div class="bg-content">
          <h2>Secure Access Control</h2>
          <p>
            Manage users, roles, and permissions with precision and clarity.
          </p>
          <div class="feature-list">
            <div class="feature">
              <mat-icon>verified_user</mat-icon>
              <span>Role-based access control</span>
            </div>
            <div class="feature">
              <mat-icon>tune</mat-icon>
              <span>Granular permission management</span>
            </div>
            <div class="feature">
              <mat-icon>timeline</mat-icon>
              <span>Action-level authorization</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        display: grid;
        grid-template-columns: 480px 1fr;
        min-height: 100vh;
        @media (max-width: 900px) {
          grid-template-columns: 1fr;
        }
      }

      .login-panel {
        background: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 48px 56px;
        @media (max-width: 600px) {
          padding: 32px 24px;
        }
      }

      .login-brand {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 36px;
        .brand-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          mat-icon {
            color: white;
            font-size: 26px;
          }
        }
        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        p {
          margin: 4px 0 0;
          color: var(--text-secondary);
          font-size: 14px;
        }
      }

      .login-form {
        h2 {
          margin: 0 0 24px;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
        }
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .error-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.08);
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: var(--radius-sm);
        padding: 10px 14px;
        color: var(--danger);
        font-size: 13px;
        mat-icon {
          font-size: 18px;
        }
      }

      .submit-btn {
        height: 48px;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 4px;
      }

      /* ─── Right Panel ───── */
      .login-bg {
        background: #0f1117;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        @media (max-width: 900px) {
          display: none;
        }
      }

      .bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        background-size: 40px 40px;
      }

      .bg-content {
        position: relative;
        z-index: 1;
        color: white;
        padding: 40px;
        max-width: 440px;

        h2 {
          font-size: 32px;
          font-weight: 800;
          margin: 0 0 16px;
          line-height: 1.2;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          color: #64748b;
          font-size: 16px;
          margin: 0 0 32px;
        }
      }

      .feature-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .feature {
        display: flex;
        align-items: center;
        gap: 12px;
        mat-icon {
          width: 36px;
          height: 36px;
          background: rgba(79, 70, 229, 0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #818cf8;
          flex-shrink: 0;
        }
        span {
          font-size: 15px;
          color: #cbd5e1;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notify = inject(NotificationService);

  loading = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    login: ['admin', Validators.required],
    password: ['Admin123!', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        const returnUrl =
          this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
        this.notify.success('Welcome back!');
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err.error?.message || 'Invalid credentials. Please try again.';
        this.errorMsg.set(msg);
      },
    });
  }
}
