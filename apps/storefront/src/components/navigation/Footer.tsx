"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1E2530] text-gray-300 font-sans pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 pb-12 border-b border-gray-800">
          
          {/* Column 1: ABOUT US */}
          <div className="space-y-4">
            <h3 className="text-base font-bold tracking-wider text-white uppercase">
              ABOUT US
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about-the-brand" className="hover:text-white transition-colors">
                  About the Brand
                </Link>
              </li>
              <li>
                <Link href="/impact" className="hover:text-white transition-colors">
                  About Our Impact
                </Link>
              </li>
              <li>
                <Link href="/production-studio" className="hover:text-white transition-colors">
                  Our Production Studio
                </Link>
              </li>
              <li>
                <Link href="/wholesale-production" className="hover:text-white transition-colors">
                  Wholesale Production
                </Link>
              </li>
              <li>
                <Link href="/custom-manufacturing" className="hover:text-white transition-colors">
                  Custom Clothing &amp; More
                </Link>
              </li>
              <li>
                <Link href="/global-fabric-wholesaler" className="hover:text-white transition-colors">
                  Global Fabric Wholesaler
                </Link>
              </li>
              <li>
                <Link href="/wholesale-fabric-sourcing" className="hover:text-white transition-colors">
                  Wholesale Fabric Sourcing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: ORDER DASHBOARD */}
          <div className="space-y-4">
            <h3 className="text-base font-bold tracking-wider text-white uppercase">
              ORDER DASHBOARD
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/account/orders" className="hover:text-white transition-colors">
                  Past Orders
                </Link>
              </li>
              <li>
                <Link href="/services/fabric-swatches" className="hover:text-white transition-colors">
                  Order Fabric Swatches
                </Link>
              </li>
              <li>
                <Link href="/services/custom-dyeing" className="hover:text-white transition-colors">
                  Natural &amp; Organic Dyeing
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-white transition-colors">
                  Read Our Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: DETAILED POLICY */}
          <div className="space-y-4">
            <h3 className="text-base font-bold tracking-wider text-white uppercase">
              DETAILED POLICY
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="hover:text-white transition-colors">
                  Return &amp; Exchange Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-white transition-colors">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/international-orders" className="hover:text-white transition-colors">
                  International Orders
                </Link>
              </li>
              <li>
                <Link href="/production-policy" className="hover:text-white transition-colors">
                  Production Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: CONTACT INFO */}
          <div className="space-y-4">
            <h3 className="text-base font-bold tracking-wider text-white uppercase">
              CONTACT INFO
            </h3>
            
            <div className="space-y-3 text-sm">
              <a
                href="mailto:support@anuprerna.com"
                className="flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@anuprerna.com</span>
              </a>

              <a
                href="tel:+918653403212"
                className="flex items-center gap-2.5 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91 8653403212</span>
              </a>
            </div>

            {/* Contact Us Button */}
            <div className="pt-1">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C4B49A] hover:bg-[#b2a186] text-gray-900 font-semibold text-sm transition-colors shadow-xs"
              >
                <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Contact us</span>
              </Link>
            </div>

            {/* Social Icons */}
            <div className="pt-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                Follow Us:
              </p>
              <div className="flex items-center space-x-3 text-gray-400">
                {/* Twitter / X */}
                <a href="https://twitter.com/anuprerna" target="_blank" rel="noreferrer" className="hover:text-white p-1">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* Facebook */}
                <a href="https://facebook.com/anuprerna" target="_blank" rel="noreferrer" className="hover:text-white p-1">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.592 9 4.415V8z"/>
                  </svg>
                </a>
                {/* Pinterest */}
                <a href="https://pinterest.com/anuprerna" target="_blank" rel="noreferrer" className="hover:text-white p-1">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z"/>
                  </svg>
                </a>
                {/* Instagram */}
                <a href="https://instagram.com/anuprerna" target="_blank" rel="noreferrer" className="hover:text-white p-1">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a href="https://linkedin.com/company/anuprerna" target="_blank" rel="noreferrer" className="hover:text-white p-1">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* Copyright Bar at Bottom */}
        <div className="pt-8 text-center text-xs text-gray-400 font-medium">
          <p>Anuprerna Artisan Alliance Pvt. Ltd. © All Rights Reserved</p>
        </div>

      </div>
    </footer>
  );
}
