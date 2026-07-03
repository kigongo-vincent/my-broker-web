// src/providers/SmoothScrollProvider.tsx
import { createContext, useContext, useEffect, useRef, ReactNode } from "react"
import Lenis from "lenis"

const LenisContext = createContext<Lenis | null>(null)

export const useLenis = () => useContext(LenisContext)

interface Props {
    children: ReactNode
}

const SmoothScrollProvider = ({ children }: Props) => {
    const lenisRef = useRef<Lenis | null>(null)

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out expo, spring-ish feel
            smoothWheel: true,
            touchMultiplier: 1.5,
        })

        lenisRef.current = lenis

        let rafId: number
        function raf(time: number) {
            lenis.raf(time)
            rafId = requestAnimationFrame(raf)
        }
        rafId = requestAnimationFrame(raf)

        return () => {
            cancelAnimationFrame(rafId)
            lenis.destroy()
        }
    }, [])

    return (
        <LenisContext.Provider value={lenisRef.current}>
            {children}
        </LenisContext.Provider>
    )
}

export default SmoothScrollProvider