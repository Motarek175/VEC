import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { ProfileInfo } from '../../../Core/interfaces/user-auth';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  loading = signal<boolean>(true);
  customerId: string = '';
  customerPersonName: string = '';
  decodedToken: any;
  profileInfo: ProfileInfo | null = null;
  selectedImage: File | null = null;

  constructor(
    public userAuthService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.userAuthService.isUserLogin.value) {
      this.handleNotLoggedIn();
      return;
    }

    const token = localStorage.getItem('token');
    if (token) {
      this.decodedToken = jwtDecode(token);
      this.customerPersonName = this.decodedToken.Name || '';
      this.customerId = this.decodedToken.ID || '';
      this.loadProfileInfo();
    } else {
      this.loading.set(false);
    }
  }

  private handleNotLoggedIn(): void {
    Swal.fire({
      icon: 'info',
      title: 'Not Logged In',
      text: 'You need to log in to view your profile. Would you like to log in now?',
      confirmButtonText: 'Log In',
      showCancelButton: true,
      cancelButtonText: 'Go to Home',
    }).then((result) => {
      if (result.isConfirmed) {
        const currentUrl = this.router.url;
        localStorage.setItem('returnUrl', currentUrl);
        this.router.navigate(['/login']);
      } else {
        this.router.navigate(['/home']);
      }
    });
    this.loading.set(false);
  }

  private loadProfileInfo(): void {
    if (!this.customerId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.userAuthService.ProfileInfo(this.customerId).subscribe({
      next: (data) => {
        this.profileInfo = data;
        this.loading.set(false);
        this.userAuthService.profilePicture.next(
          `${data.image}?v=${Date.now()}`
        );
      },
      error: (err) => {
        this.loading.set(false);
        this.profileInfo = null;
        Swal.fire({
          title: 'Error',
          text: 'Failed to load profile information.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
        console.error('Profile Error:', err);
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];
      this.updateProfilePicture();
      input.value = '';
    }
  }

  updateProfilePicture(): void {
    if (!this.selectedImage || !this.customerId) {
      Swal.fire({
        title: 'Error',
        text: 'Please select an image and ensure you are logged in.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    this.loading.set(true);
    const formData = new FormData();
    formData.append('image', this.selectedImage);
    this.userAuthService.updateProfilePic(this.customerId, formData).subscribe({
      next: (response) => {
        this.loading.set(false);
        Swal.fire({
          title: 'Success',
          text: 'Profile picture updated successfully!',
          icon: 'success',
          confirmButtonColor: '#22c55e',
        }).then(() => {
          this.userAuthService.profilePicture.next(
            `${response.image}?v=${Date.now()}`
          );
          this.loadProfileInfo();
        });
      },
      error: (err) => {
        this.loading.set(false);
        Swal.fire({
          title: 'Error',
          text: 'Failed to update profile picture.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
        console.error('Update Error:', err);
      },
    });
  }
}
