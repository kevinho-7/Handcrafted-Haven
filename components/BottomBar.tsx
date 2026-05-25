"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";


type CategoryProps = {
    categories: string[]
}

export default function BottomBar({categories}: CategoryProps){
    const [isSmall, setIsSmall] = useState(false);

    useEffect(() => {
        const checkWidth = () => {
            setIsSmall(window.innerWidth <= 1260)
        }
        
        checkWidth();
        window.addEventListener("resize", checkWidth);

        return () => window.removeEventListener("resize", checkWidth);

    }, []);

    const menuRef = useRef<HTMLDivElement>(null);

    function toTitleCase(text: string) {
        return text
        .split(/[\s-]+/)       // split by spaces or hyphens
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    function scrollLeft(){
        menuRef.current?.scrollBy({left: -menuRef.current.clientWidth, behavior: "smooth"})
    }

    function scrollRight(){
        menuRef.current?.scrollBy({left: menuRef.current.clientWidth, behavior: "smooth"})
    }

    if (isSmall){
        return(
            <nav className="border-t bg-[var(--rust)] text-[#fff] hidden md:block">

                <div className="px-6 py-3 flex justify-center gap-6">

                    <button onClick={scrollLeft} className='px-3 py-1 text-[1.2rem] rounded-lg hover:bg-white hover:text-black hover:cursor-pointer'>◀</button>

                    <div ref={menuRef} className='flex gap-6 overflow-x-auto scroll-smooth whitespace-nowrap max-w-[900px] [&::-webkit-scrollbar]:hidden'>

                    {categories.map((category) => (
                        <Link
                        key={category}
                        href={`/category/${category.toLowerCase()}`}
                        className="font-medium p-1 rounded-lg hover:underline cursor-pointer"
                        >
                        {toTitleCase(category)}
                        </Link>
                    ))}
                    </div>

                    <button onClick={scrollRight} className='px-3 py-1 text-[1.2rem] rounded-lg hover:bg-white hover:text-black hover:cursor-pointer'>▶</button>

                </div>

            </nav> 
        )
    } else {
        return(
            <nav className="border-t bg-[var(--rust)] text-[#fff] hidden md:block">

                <div className="px-6 py-3 flex justify-center gap-6">

                    {categories.map((category) => (
                        <Link
                        key={category}
                        href={`/category/${category.toLowerCase()}`}
                        className="font-medium p-1 rounded-lg hover:underline text-white cursor-pointer"
                        >
                        {toTitleCase(category)}
                        </Link>
                    ))}

                </div>

            </nav>
        )
    }
}


