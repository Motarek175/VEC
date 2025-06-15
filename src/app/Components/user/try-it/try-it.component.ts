import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserAuthService } from '../../../Core/services/user-auth.service';
import { Router } from '@angular/router';
import { CustomerService } from '../../../Core/services/customer.service';
import { interval, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-try-it',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './try-it.component.html',
  styleUrl: './try-it.component.css',
})
export class TryComponent implements OnInit, OnDestroy {
  productImage: string | null = null;
  productColor: string | null = null;
  selectedImage: string | null = null;
  resultImage: string | null = null;
  loading: boolean = false;
  progress: number = 0; // Progress percentage for the bar
  private statusPollingSubscription: Subscription | null = null;
  private progressInterval: any = null; // For setInterval

  constructor(
    private userAuthService: UserAuthService,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.userAuthService.isUserLogin.getValue()) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Log In First',
        text: 'You must log in to access the Try It feature.',
        confirmButtonText: 'Go to Login',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
      }).then((result) => {
        if (result.isConfirmed) {
          const currentUrl = this.router.url;
          localStorage.setItem('returnUrl', currentUrl);
          this.router.navigate(['/login']);
        } else {
          this.router.navigate(['/shop']);
        }
      });
      return;
    }

    // Retrieve product data from localStorage
    const tryItData = localStorage.getItem('tryItProduct');
    if (tryItData) {
      try {
        const parsedData = JSON.parse(tryItData);
        // Check if color is present and not empty
        if (!parsedData.color) {
          Swal.fire({
            icon: 'error',
            title: 'Incomplete Product Information',
            text: 'Please select a product and choose a color before trying it.',
            confirmButtonText: 'Go to Shop',
          }).then(() => {
            localStorage.removeItem('tryItProduct');
            this.router.navigate(['/shop']);
          });
          return;
        }
        this.productColor = parsedData.color || null;
        this.productImage = parsedData.image || null;
        localStorage.removeItem('tryItProduct');
      } catch (error) {
        console.error('Error parsing tryItProduct data:', error);
        Swal.fire({
          icon: 'error',
          title: 'Invalid Data',
          text: 'Failed to load product data. Please select a product again.',
          confirmButtonText: 'Go to Shop',
        }).then(() => {
          localStorage.removeItem('tryItProduct');
          this.router.navigate(['/shop']);
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'No Product Selected',
        text: 'Please select a product and choose a color before trying it.',
        confirmButtonText: 'Go to Shop',
      }).then(() => {
        this.router.navigate(['/shop']);
      });
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from polling subscription and clear progress interval
    if (this.statusPollingSubscription) {
      this.statusPollingSubscription.unsubscribe();
    }
    this.stopProgress();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 1 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please upload an image smaller than 1MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  tryProduct(): void {
    if (!this.selectedImage || !this.productImage) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Images',
        text: 'Please upload your photo and ensure a product is selected.',
      });
      return;
    }

    this.loading = true;
    this.startProgress(); // Start progress bar animation
    const data = {
      model_image: this.selectedImage, // User-uploaded image (base64)
      garment_image: this.productImage, // Product image (URL or base64)
      category: 'auto', // Use default 'auto' for automatic garment classification
      return_base64: true, // Return result as base64 for privacy
      mode: 'balanced', // Balanced mode for quality and speed
      moderation_level: 'permissive', // Allow swimwear/underwear
    };

    this.customerService.tryIt(data).subscribe({
      next: (response) => {
        if (response.id) {
          this.pollStatus(response.id);
        } else {
          this.handleError('No prediction ID returned from the API.');
        }
      },
      error: (err) => {
        this.handleError('Failed to initiate try-on. Please try again later.');
        console.error('TryIt Error:', err);
      },
    });
  }

  private startProgress(): void {
    this.progress = 0;
    const maxDuration = 40000; // 40 seconds max (based on API max time)
    const increment = 100 / (maxDuration / 100); // Increment per 100ms
    this.progressInterval = setInterval(() => {
      this.progress = Math.min(this.progress + increment, 100); // Cap at 100%
      if (this.progress >= 100) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }
    }, 100); // Update every 100ms for smooth animation
  }

  private stopProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.progress = 100; // Set to 100% when done
  }

  private pollStatus(predictionId: string): void {
    const pollInterval = interval(3000); // Poll every 3 seconds
    this.statusPollingSubscription = pollInterval.subscribe(() => {
      this.customerService.getPredictionStatus(predictionId).subscribe({
        next: (response) => {
          if (response.status === 'completed') {
            this.statusPollingSubscription?.unsubscribe();
            this.stopProgress(); // Stop progress bar
            this.loading = false;
            if (response.output && response.output[0]) {
              this.resultImage = response.output[0]; // Set result image (base64 or URL)
              Swal.fire({
                icon: 'success',
                title: 'Try-On Complete!',
                text: 'Your try-on result is ready.',
                confirmButtonText: 'View Result',
              });
            } else {
              this.handleError('No output image returned.');
            }
          } else if (response.status === 'failed') {
            this.statusPollingSubscription?.unsubscribe();
            this.stopProgress(); // Stop progress bar
            this.handleError('Try-on failed. Please try again.');
          } // Continue polling for 'starting', 'in_queue', or 'processing'
        },
        error: (err) => {
          this.statusPollingSubscription?.unsubscribe();
          this.stopProgress(); // Stop progress bar
          this.handleError('Failed to check try-on status.');
          console.error('Status Error:', err);
        },
      });
    });
  }

  private handleError(message: string): void {
    this.loading = false;
    this.stopProgress(); // Stop progress bar
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'OK',
    });
  }

  clearSelectedImage(): void {
    this.selectedImage = null;
  }
}
