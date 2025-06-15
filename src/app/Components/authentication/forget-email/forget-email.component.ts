import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forget } from '../../../Core/interfaces/user-auth';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forget-email',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './forget-email.component.html',
  styleUrl: './forget-email.component.css',
})
export class ForgetEmailComponent {
  constructor(
    private _Router: Router,
    private _UserAuthService: UserAuthService
  ) {}
  form = new FormGroup({
    email: new FormControl('', [Validators.required]),
  });
  reset() {
    const email: forget = {
      email: this.form.get('email')?.value || '',
    };
    this._UserAuthService.forgetPassword(email).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'Email Sent',
          text: res.message,
          icon: 'success',
        }).then(() => {
          localStorage.setItem(
            'email',
            this.form.get('email')?.value || ''
          );
          this._Router.navigate(['/reset-code']);
        });
      },
      error: (err) => {
        console.log(err);
        Swal.fire({
          title: 'Error',
          text: err.error.message,
          icon: 'error',
        });
      },
    });
  }
}
