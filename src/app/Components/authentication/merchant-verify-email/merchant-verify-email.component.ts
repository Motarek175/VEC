import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { forget, Rest } from '../../../Core/interfaces/user-auth';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-merchant-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './merchant-verify-email.component.html',
  styleUrl: './merchant-verify-email.component.css',
})
export class MerchantVerifyEmailComponent {
  resetForm = new FormGroup({
    input1: new FormControl('', [Validators.required]),
    input2: new FormControl('', [Validators.required]),
    input3: new FormControl('', [Validators.required]),
    input4: new FormControl('', [Validators.required]),
    input5: new FormControl('', [Validators.required]),
    input6: new FormControl('', [Validators.required]),
  });
  verifyEmail: Rest = {
    email: '',
    verificationCode: '',
  };

  constructor(
    private _Router: Router,
    private _UserAuthService: UserAuthService
  ) {}
  verify() {
    const code = String(
      Object.values(this.resetForm.value)
        .map((value) => value || '')
        .join('')
    );
    this.verifyEmail.email = localStorage.getItem('email') || '';
    this.verifyEmail.verificationCode = code;
    this.resetForm.reset();
    console.log(this.verifyEmail);
    this._UserAuthService.verifyResetCode(this.verifyEmail).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'Success',
          text: 'Code is valid, your account has been created but is still pending. Please wait for the admin to activate it. Thank you for your patience.',
          icon: 'success',
          showConfirmButton: true,
        }).then(() => {
          localStorage.removeItem('email');
          this._Router.navigate(['/login']);
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          text: err.error.message,
          icon: 'error',
          showConfirmButton: true,
        });
      },
    });
  }

  sendCodeAgain() {
    const email = localStorage.getItem('email') || '';
    this._UserAuthService.resendverificationcode(email).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'Success',
          text: 'Code has been sent to your email again',
          icon: 'success',
          showCloseButton: true,
        });
      },
      error: (err) => {
        Swal.fire({
          title: 'Error',
          icon: 'error',
        });
      },
    });
  }
}
