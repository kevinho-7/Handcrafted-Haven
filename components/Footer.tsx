'use client';
import Link from 'next/link';

import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
    return (
    <footer className="text-black border-t border-black">
            <div className="px-6 py-6"> {/*padding px=padding left, py=padding right */}
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-sm">

            {/* LEFT */}
            <div className="text-center md:text-left">
                <p className="font-medium">
                Website Assignment for WDD430
                </p>
            </div>

            {/* MIDDLE */}
            <div className="text-center">
                <p className="font-medium mb-1">TEAM MEMBERS:</p>
                <p>
                James Eberhard<br/>
                Keith James Eberhard<br/>
                Kevin Garcia Ferreira<br/>
                Miguel Ignacio Arcos Salazar
                </p>
            </div>

            {/* RIGHT */}
            <div className="flex gap-4">
                <Link
                href="https://facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-[var(--rust)]"
                >
                <Facebook className="h-5 w-5" />
                </Link>

                <Link
                href="https://instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-[var(--rust)]"
                >
                <Instagram className="h-5 w-5" />
                </Link>

                <Link
                href="https://x.com/" 
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-[var(--rust)]"
                >
                <Twitter className="h-5 w-5" />
                </Link> 
            </div>

            </div>
        </div>
        </footer>
    );
}