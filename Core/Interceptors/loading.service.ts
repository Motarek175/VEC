import { HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Counter to track active PUT requests
let activeRequests = 0;
// Progress state
let progress = 0;
let progressInterval: any = null;

export function loadingInterceptor(req: HttpRequest<any>, next: HttpHandlerFn) {
  // Check if the request is a PUT request to the Admin API
  if (
    (req.method === 'PUT' &&
      req.url.includes('https://aston.runasp.net/api/Admin/')) ||
    (req.method === 'PUT' &&
      req.url.includes('https://aston.runasp.net/api/Merchant/'))
  ) {
    // Show loader only if this is the first active request
    if (activeRequests === 0) {
      progress = 0; // Reset progress
      Swal.fire({
        title: 'Updating...',
        html: `
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div id="progress-bar" class="h-4 rounded-full bg-gradient-to-r from-[#703232] to-[#a14b4b] transition-all duration-300" style="width: 0%"></div>
          </div>
          <p class="mt-2 text-gray-600"><span id="progress-text">0</span>%</p>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        background: 'rgba(255, 255, 255, 0.95)',
        customClass: {
          popup: 'backdrop-blur-lg',
          title: 'text-gray-800 font-semibold',
        },
        didOpen: () => {
          // Start progress animation
          const progressBar = document.getElementById('progress-bar');
          const progressText = document.getElementById('progress-text');
          if (progressBar && progressText) {
            progressInterval = setInterval(() => {
              if (progress < 90) {
                progress += 1; // Increment progress slowly
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}`;
              }
            }, 100); // Adjust speed (100ms per 1%)
          }
        },
      });
    }
    activeRequests++;

    // Handle the request and complete the progress when done
    return next(req).pipe(
      finalize(() => {
        activeRequests--;
        if (activeRequests === 0) {
          // Complete progress to 100%
          const progressBar = document.getElementById('progress-bar');
          const progressText = document.getElementById('progress-text');
          if (progressBar && progressText) {
            clearInterval(progressInterval);
            progress = 100;
            progressBar.style.width = '100%';
            progressText.textContent = '100';
            // Close the popup after a short delay to show 100%
            setTimeout(() => {
              Swal.close();
            }, 300);
          } else {
            // Fallback: close immediately if elements are not found
            Swal.close();
          }
        }
      })
    );
  }

  // Pass through non-PUT requests without modification
  return next(req);
}
