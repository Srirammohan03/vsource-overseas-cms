import type { Metadata } from "next";
import "../index.css";
import "react-loading-skeleton/dist/skeleton.css";
import "aos/dist/aos.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.vsourceoverseas.com"),
  title: "VSource - Premier Educational Consultancy",
  description: "Your trusted educational consultancy for study abroad programs, university admissions, scholarships, visa assistance, and educational loans.",
  openGraph: { images: ["/assets/images/vsource-og-image.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><meta name="google-site-verification" content="uwYYd_JH8EHQvigEXmCJ-26DkF7zPsNyqsIR093yezE"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com"/><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet"/><link rel="icon" href="https://vsourcevarsity.com/assets/images/180%20X%20180%20favicon.png"/></head><body>{children}<noscript><img height="1" width="1" style={{display:"none"}} src="https://www.facebook.com/tr?id=1502613430421469&ev=PageView&noscript=1" alt=""/></noscript><script dangerouslySetInnerHTML={{__html:`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)})(window,document,'script','dataLayer','GTM-NT323LDZ');`}}/><script dangerouslySetInnerHTML={{__html:`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1502613430421469');fbq('track','PageView');`}}/></body></html>;
}
