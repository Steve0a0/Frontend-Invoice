// components/DropdownPortal.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import ReactDOM from "react-dom";

export default function DropdownPortal({ children, targetRef, isOpen }) {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isPositioned, setIsPositioned] = useState(false);
    const dropdownRef = useRef(null);

    const updatePosition = useCallback(() => {
        if (targetRef.current && isOpen) {
            const rect = targetRef.current.getBoundingClientRect();
            const dropdownHeight = dropdownRef.current?.offsetHeight || 300;
            const viewportHeight = window.innerHeight;
            
            // Check if dropdown would go off bottom of screen
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            let top, placement;
            
            // If not enough space below but more space above, show above
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                top = rect.top + window.scrollY - dropdownHeight - 8;
                placement = 'top';
            } else {
                // Default: show below
                top = rect.bottom + window.scrollY + 8;
                placement = 'bottom';
            }
            
            setPosition({
                top,
                left: rect.left + rect.width / 2,
                placement
            });
            // Set positioned immediately for instant display
            if (!isPositioned) {
                setIsPositioned(true);
            }
        }
    }, [isOpen, targetRef, isPositioned]);

    useEffect(() => {
        if (isOpen) {
            // Calculate position immediately on mount
            setIsPositioned(true); // Set to true immediately for instant display
            updatePosition();
            
            // Use passive listeners for better scroll performance
            window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
            window.addEventListener('resize', updatePosition, { passive: true });
            
            return () => {
                window.removeEventListener('scroll', updatePosition, { capture: true });
                window.removeEventListener('resize', updatePosition);
            };
        } else {
            setIsPositioned(false);
        }
    }, [isOpen, updatePosition]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div
            ref={dropdownRef}
            className="dropdown-portal-content absolute bg-gray-800 text-white shadow-2xl rounded-lg z-[9999] border border-gray-700 overflow-hidden"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: "translateX(-50%)",
                position: "absolute",
                minWidth: "220px",
                maxWidth: "280px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            }}
        >
            {/* Simple Arrow */}
            <div 
                className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-800 rotate-45 border-gray-700 ${
                    position.placement === 'top' 
                        ? 'bottom-[-6px] border-r border-b' 
                        : '-top-[6px] border-l border-t'
                }`}
            ></div>
            
            {/* Content */}
            <div className="relative">
                {children}
            </div>
        </div>,
        document.body
    );
}

