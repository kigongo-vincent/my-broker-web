import { AnimatePresence, motion } from "framer-motion"
import { HTMLAttributes, ReactNode, useRef } from "react"
import { createPortal } from "react-dom"
import { XMarkIcon } from "@heroicons/react/24/solid"
import useSystemTheme from "../../hooks/theme"

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
    open?: boolean
    position?: "center" | "right" | "bottom"
    actions?: ReactNode
    onClose: () => void

}

const Modal = ({ position = "center", onClose, children, className, open, actions }: ModalProps) => {

    const overlayRef = useRef(null)

    // const handleClose = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    //   if (e.currentTarget == overlayRef.current) {
    //     onClose()
    //   }
    // }

    const handleClose = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }



    const overlayTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }
    const sheetTransition = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const }

    const { theme } = useSystemTheme()

    const overlayStyles = theme == "light" ? "bg-black/5 backdrop-blur-md " : " backdrop-blur-md"

    const content = (
        <AnimatePresence>
            {open &&
                <motion.div
                    key="modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={overlayTransition}
                    onPointerDown={handleClose}
                    ref={overlayRef}
                    className={`fixed inset-0 z-100 flex ${overlayStyles} ${position === "right" ? "items-stretch justify-end" : position === "bottom" ? "items-end justify-center" : "items-center justify-center"}`}>

                    {/* content  */}
                    {
                        position == "center"
                            ?

                            // center modal 
                            <motion.div
                                key="modal-center-sheet"
                                initial={{ y: -20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 28, opacity: 0 }}
                                transition={sheetTransition}
                                onClick={(e) => e.stopPropagation()}
                                className={`bg-paper mx-3 sm:mx-4 w-[min(100%,98vw)] sm:w-[min(92vw,36rem)] md:w-[min(40vw,42rem)] max-h-[90vh] rounded-lg p-4 sm:p-6 flex flex-col ${className ?? ""} dark:border border-text/10`}
                            >

                                {/* header - fixed at top, not scrollable */}
                                <div className="flex mb-6 items-center justify-end shrink-0">
                                    <button onClick={onClose} className="">
                                        <XMarkIcon className="h-8 w-8" />
                                    </button>
                                </div>

                                {/* content - scrollable */}
                                <div className="flex-grow overflow-auto min-h-0">
                                    {children}
                                </div>

                                {/* actions - fixed at bottom, not scrollable */}
                                {actions && (
                                    <div className="shrink-0 min-w-max mt-4 gap-3 pt-4 flex justify-end ">
                                        {actions}
                                    </div>
                                )}

                            </motion.div>

                            : position == "right"

                                ?

                                // right
                                <motion.div
                                    key="modal-right-sheet"
                                    initial={{ x: "18%" }}
                                    animate={{ x: 0 }}
                                    exit={{ x: "100%" }}
                                    transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`h-full max-h-dvh w-full max-w-full overflow-y-auto border-l border-text/10 bg-paper p-5 sm:p-6 md:max-w-xl md:p-8 sm:max-w-lg ${className ?? ""}`}
                                >
                                    {/* header - fixed at top, not scrollable */}
                                    <div className="flex mb-6 items-center justify-end shrink-0">
                                        <button onClick={onClose} className="hover:bg-pale">
                                            <XMarkIcon className="h-8 w-8" />
                                        </button>
                                    </div>
                                    <div className="max-h-[90vh] overflow-y-auto">
                                        {children}
                                    </div>
                                </motion.div>

                                :

                                // bottom sheet
                                <motion.div
                                    key="modal-bottom-sheet"
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`bg-black/20 w-full max-w-full sm:max-w-lg md:max-w-xl max-h-[90vh] rounded-t-3xl  flex flex-col overflow-hidden ${className ?? ""}`}
                                >

                                    {/* header - fixed at top, close button centered, not scrollable */}
                                    <div className="flex items-center justify-center  shrink-0">
                                        <button onClick={onClose} className="btn m-3 bg-pale w-full rounded-full">
                                            <XMarkIcon className="h-6 w-6" />
                                            close
                                        </button>
                                    </div>
                                    {/* content - scrollable, no padding */}
                                    <div className="flex-grow m-4 mt-0 rounded-4xl overflow-auto min-h-0">
                                        {children}
                                    </div>

                                    {/* actions - fixed at bottom, not scrollable */}
                                    {actions && (
                                        <div className="shrink-0 min-w-max gap-3 p-4 flex justify-end border-t border-text/10">
                                            {actions}
                                        </div>
                                    )}
                                </motion.div>
                    }

                </motion.div>
            }
        </AnimatePresence>
    )

    if (typeof document === "undefined") return null
    return createPortal(content, document.body)
}

export default Modal