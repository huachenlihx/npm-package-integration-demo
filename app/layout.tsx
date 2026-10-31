import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'npm Package Integration Lab',description:'Integration demo for form_recaptcha and pdfjs-embed-viewer'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
