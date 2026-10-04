// Global exposed by feedback-widget-js (https://github.com/JeanGarf/feedback-widget-js) once its
// <script> tag has loaded. Absent until then, hence the optional properties.
interface Window {
  Feedback?: {
    open(): void;
    close(): void;
    identify(userRef: string): void;
  };
}
